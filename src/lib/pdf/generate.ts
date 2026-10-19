import "server-only"
import {
  listDueOverviews,
  getLease,
  getTenant,
  getProperty,
  getProfile,
  listPayments,
  readFile,
  saveFile,
  createDocument,
  type DocumentKind,
} from "@/lib/data"
import { renderDocumentToBuffer } from "./quittance"

export interface GeneratedDocumentResult {
  filePath: string
  buffer: Buffer
  filename: string
  isQuittance: boolean
}

/**
 * Génère le PDF (quittance si payé, reçu si partiel) et l'enregistre dans le stockage local privé.
 * Enregistre également la métadonnée dans la collection documents.
 */
export async function generateAndSaveQuittancePdf(
  ownerId: string,
  dueId: string
): Promise<GeneratedDocumentResult> {
  const dues = await listDueOverviews(ownerId)
  const due = dues.find((d) => d.id === dueId && d.owner_id === ownerId)
  if (!due) {
    throw new Error("Échéance non trouvée.")
  }

  const lease = await getLease(ownerId, due.lease_id)
  if (!lease) {
    throw new Error("Bail non trouvé.")
  }

  const tenant = await getTenant(ownerId, lease.tenant_id)
  if (!tenant) {
    throw new Error("Locataire non trouvé.")
  }

  const property = await getProperty(ownerId, lease.property_id)
  if (!property) {
    throw new Error("Bien non trouvé.")
  }

  const profile = await getProfile(ownerId)
  if (!profile) {
    throw new Error("Profil bailleur non trouvé.")
  }

  const payments = await listPayments(ownerId, { rentDueId: due.id })
  payments.sort((a, b) => b.paid_at.localeCompare(a.paid_at))

  let signatureDataUri: string | null = null
  if (profile.signature_path) {
    try {
      const sigBuffer = await readFile(ownerId, profile.signature_path)
      if (sigBuffer) {
        signatureDataUri = `data:image/png;base64,${sigBuffer.toString("base64")}`
      }
    } catch {
      // Ignore signature reading error
    }
  }

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

  const monthKey = due.period.slice(0, 7)
  const relativePath = isQuittance
    ? `${lease.id}/${monthKey}-quittance.pdf`
    : `${lease.id}/${monthKey}-recu-${Date.now()}.pdf`

  const savedFilePath = await saveFile(ownerId, relativePath, pdfBuffer)

  await createDocument(ownerId, {
    lease_id: lease.id,
    rent_due_id: due.id,
    kind,
    file_path: savedFilePath,
  })

  const cleanLastName = tenant.last_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
  const docPrefix = isQuittance ? "Quittance" : "Recu"
  const filename = `${docPrefix}-${monthKey}-${cleanLastName || "locataire"}.pdf`

  return {
    filePath: savedFilePath,
    buffer: pdfBuffer,
    filename,
    isQuittance,
  }
}
