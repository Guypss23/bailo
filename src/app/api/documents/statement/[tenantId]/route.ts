import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import {
  getTenant,
  listLeases,
  getProperty,
  listDueOverviews,
  listPayments,
} from "@/lib/data"
import { buildTenantStatement } from "@/lib/domain/statement"
import { renderStatementToBuffer } from "@/lib/pdf/statement"

export const runtime = "nodejs"

const paramsSchema = z.object({
  tenantId: z.string().min(1, "Identifiant locataire manquant"),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  let auth
  try {
    auth = await requireUser()
  } catch {
    return new NextResponse("Non autorisé", { status: 401 })
  }

  const rawParams = await context.params
  const parsed = paramsSchema.safeParse(rawParams)
  if (!parsed.success) {
    return new NextResponse("Identifiant invalide", { status: 400 })
  }

  const { tenantId } = parsed.data
  const { user, profile } = auth

  const tenant = await getTenant(user.id, tenantId)
  if (!tenant) {
    return new NextResponse("Locataire non trouvé", { status: 404 })
  }

  const [leases, dues, payments] = await Promise.all([
    listLeases(user.id, { tenantId }),
    listDueOverviews(user.id, { tenantId }),
    listPayments(user.id),
  ])

  // Find active or primary lease
  const activeLease =
    leases.find((l) => l.status === "actif") || leases[0] || null

  const property = activeLease
    ? await getProperty(user.id, activeLease.property_id)
    : null

  // Filter payments associated with this tenant's dues
  const dueIdsSet = new Set(dues.map((d) => d.id))
  const tenantPayments = payments.filter((p) => dueIdsSet.has(p.rent_due_id))

  const statement = buildTenantStatement({
    tenant,
    lease: activeLease,
    property,
    dues,
    payments: tenantPayments,
  })

  const currency = profile.currency || "XAF"
  const pdfBuffer = await renderStatementToBuffer({
    statement,
    profile,
    currency,
  })

  const cleanLastName = tenant.last_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
  const cleanFirstName = tenant.first_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")

  const filename = `Releve-de-compte-${cleanLastName}_${cleanFirstName}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  })
}
