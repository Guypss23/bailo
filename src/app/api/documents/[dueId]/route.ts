import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import {
  getRentDue,
  listDueOverviews,
  getLease,
  getTenant,
  getProperty,
  listPayments,
  readFile,
  saveFile,
  createDocument,
  type DocumentKind,
} from "@/lib/data"
import { renderDocumentToBuffer } from "@/lib/pdf/quittance"

export const runtime = "nodejs"

const paramsSchema = z.object({
  dueId: z.string().min(1, "Identifiant d'échéance manquant"),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dueId: string }> }
) {
  let auth
  try {
    auth = await requireUser()
  } catch {
    return new NextResponse("Non autorisé", { status: 401 })
  }

  const rawParams = await context.params
  const parsedParams = paramsSchema.safeParse(rawParams)
  if (!parsedParams.success) {
    return new NextResponse("Identifiant d'échéance manquant", { status: 400 })
  }
  const { dueId } = parsedParams.data

  const { user, profile } = auth

  // 1. Fetch rent due overview
  const dues = await listDueOverviews(user.id)
  const due = dues.find((d) => d.id === dueId && d.owner_id === user.id)
  if (!due) {
    return new NextResponse("Échéance non trouvée", { status: 404 })
  }

  // Check payment condition: At least partial payment required
  if (due.paid_amount <= 0 && due.status !== "paye") {
    return new NextResponse(
      "Aucun paiement n'a été enregistré pour cette échéance. Une quittance ou un reçu exige un versement.",
      { status: 400 }
    )
  }

  // 2. Fetch associated lease, tenant, property
  const lease = await getLease(user.id, due.lease_id)
  if (!lease) {
    return new NextResponse("Bail non trouvé", { status: 404 })
  }

  const tenant = await getTenant(user.id, lease.tenant_id)
  if (!tenant) {
    return new NextResponse("Locataire non trouvé", { status: 404 })
  }

  const property = await getProperty(user.id, lease.property_id)
  if (!property) {
    return new NextResponse("Bien non trouvé", { status: 404 })
  }

  // 3. Fetch payments
  const payments = await listPayments(user.id, { rentDueId: due.id })
  payments.sort((a, b) => b.paid_at.localeCompare(a.paid_at))

  // 4. Fetch signature if configured
  let signatureDataUri: string | null = null
  if (profile.signature_path) {
    try {
      const sigBuffer = await readFile(user.id, profile.signature_path)
      if (sigBuffer) {
        signatureDataUri = `data:image/png;base64,${sigBuffer.toString("base64")}`
      }
    } catch {
      // Signature reading failure should not prevent PDF generation
    }
  }

  // 5. Render PDF to Buffer
  const isQuittance = due.status === "paye"
  const kind: DocumentKind = isQuittance ? "quittance" : "recu"

  const pdfBuffer = await renderDocumentToBuffer({
    due,
    lease,
    tenant,
    property,
    profile,
    payments,
    signatureDataUri,
  })

  // 6. Save PDF to private files storage: [lease_id]/[AAAA-MM]-quittance.pdf
  const monthKey = due.period.slice(0, 7)
  const relativePath = isQuittance
    ? `${lease.id}/${monthKey}-quittance.pdf`
    : `${lease.id}/${monthKey}-recu-${Date.now()}.pdf`

  const savedFilePath = await saveFile(user.id, relativePath, pdfBuffer)

  // 7. Record entry in documents collection
  await createDocument(user.id, {
    lease_id: lease.id,
    rent_due_id: due.id,
    kind,
    file_path: savedFilePath,
  })

  // 8. Return PDF download response with human-readable filename
  const cleanLastName = tenant.last_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
  const docPrefix = isQuittance ? "Quittance" : "Recu"
  const filename = `${docPrefix}-${monthKey}-${cleanLastName || "locataire"}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  })
}
