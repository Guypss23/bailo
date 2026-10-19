import "server-only"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import type { OutboxMessage, NewOutboxMessage, OutboxMessageKind } from "./types"

export async function listOutbox(
  ownerId: string,
  options: {
    rentDueId?: string
    kind?: OutboxMessageKind
  } = {}
): Promise<OutboxMessage[]> {
  const store = await readStore()
  const messages = store.outbox ?? []
  return messages
    .filter((msg) => {
      if (msg.owner_id !== ownerId) return false
      if (options.rentDueId && msg.rent_due_id !== options.rentDueId) return false
      if (options.kind && msg.kind !== options.kind) return false
      return true
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getOutboxMessage(
  ownerId: string,
  id: string
): Promise<OutboxMessage | null> {
  const store = await readStore()
  const messages = store.outbox ?? []
  const msg = messages.find((m) => m.id === id && m.owner_id === ownerId)
  return msg ?? null
}

export async function hasOutboxMessage(
  ownerId: string,
  rentDueId: string,
  kind: OutboxMessageKind
): Promise<boolean> {
  const store = await readStore()
  const messages = store.outbox ?? []
  return messages.some(
    (m) =>
      m.owner_id === ownerId &&
      m.rent_due_id === rentDueId &&
      m.kind === kind
  )
}

/**
 * Crée un message dans la boîte d'envoi locale.
 * Règle métier : pour un même rent_due_id, un seul message de chaque kind est autorisé,
 * sauf pour les relances manuelles ('relance_manuelle') qui peuvent être répétées.
 */
export async function createOutboxMessage(
  ownerId: string,
  data: NewOutboxMessage
): Promise<OutboxMessage> {
  return mutateStore((current) => {
    const messages = current.outbox ?? []

    // Règle d'unicité sauf relance_manuelle
    if (data.kind !== "relance_manuelle") {
      const existing = messages.find(
        (m) =>
          m.owner_id === ownerId &&
          m.rent_due_id === data.rent_due_id &&
          m.kind === data.kind
      )
      if (existing) {
        return {
          nextData: current,
          result: existing,
        }
      }
    }

    const newMessage: OutboxMessage = {
      id: generateUUID(),
      owner_id: ownerId,
      rent_due_id: data.rent_due_id,
      kind: data.kind,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachment_path: data.attachment_path ?? null,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        outbox: [...messages, newMessage],
      },
      result: newMessage,
    }
  })
}
