import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { OutboxMessage, NewOutboxMessage, OutboxMessageKind } from "../types"

export async function listOutboxSupabase(
  ownerId: string,
  options: {
    rentDueId?: string
    kind?: OutboxMessageKind
  } = {}
): Promise<OutboxMessage[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("outbox")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (options.rentDueId) {
    query = query.eq("rent_due_id", options.rentDueId)
  }
  if (options.kind) {
    query = query.eq("kind", options.kind)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listOutboxSupabase:", error)
    return []
  }
  return (data ?? []) as OutboxMessage[]
}

export async function getOutboxMessageSupabase(
  ownerId: string,
  id: string
): Promise<OutboxMessage | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("outbox")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getOutboxMessageSupabase:", error)
    return null
  }
  return data as OutboxMessage | null
}

export async function hasOutboxMessageSupabase(
  ownerId: string,
  rentDueId: string,
  kind: OutboxMessageKind
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { count, error } = await supabase
    .from("outbox")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("rent_due_id", rentDueId)
    .eq("kind", kind)

  if (error) {
    console.error("Error checking outbox message Supabase:", error)
    return false
  }
  return (count ?? 0) > 0
}

export async function createOutboxMessageSupabase(
  ownerId: string,
  data: NewOutboxMessage
): Promise<OutboxMessage> {
  const supabase = getSupabaseAdmin()

  // Unicity rule except for relance_manuelle
  if (data.kind !== "relance_manuelle") {
    const { data: existing } = await supabase
      .from("outbox")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("rent_due_id", data.rent_due_id)
      .eq("kind", data.kind)
      .maybeSingle()

    if (existing) {
      return existing as OutboxMessage
    }
  }

  const record = {
    owner_id: ownerId,
    rent_due_id: data.rent_due_id,
    kind: data.kind,
    to: data.to,
    subject: data.subject,
    html: data.html,
    attachment_path: data.attachment_path ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("outbox")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createOutboxMessageSupabase:", error)
    throw new Error(`Erreur enregistrement message outbox: ${error.message}`)
  }

  return inserted as OutboxMessage
}
