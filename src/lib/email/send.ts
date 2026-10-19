import "server-only"
import { createOutboxMessage } from "@/lib/data"
import type { OutboxMessageKind } from "@/lib/data/types"

export interface SendEmailParams {
  ownerId: string
  rentDueId: string
  kind: OutboxMessageKind
  to: string
  subject: string
  html: string
  attachmentPath?: string | null
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * Envoie un e-mail (simulé localement dans la collection outbox pour l'instant).
 * L'envoi réel (SMTP / API transactional) sera branché plus tard en modifiant uniquement ce fichier.
 */
export async function sendEmail({
  ownerId,
  rentDueId,
  kind,
  to,
  subject,
  html,
  attachmentPath,
}: SendEmailParams): Promise<SendEmailResult> {
  try {
    if (!to || !to.includes("@")) {
      return { ok: false, error: "Adresse e-mail destinataire invalide." }
    }

    const message = await createOutboxMessage(ownerId, {
      rent_due_id: rentDueId,
      kind,
      to,
      subject,
      html,
      attachment_path: attachmentPath ?? null,
    })

    return { ok: true, id: message.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi."
    return { ok: false, error: message }
  }
}
