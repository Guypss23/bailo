import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Document, NewDocument, DocumentKind } from "../types"

export async function listDocumentsSupabase(
  ownerId: string,
  options: {
    leaseId?: string
    rentDueId?: string
    kind?: DocumentKind
  } = {}
): Promise<Document[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (options.leaseId) {
    query = query.eq("lease_id", options.leaseId)
  }
  if (options.rentDueId) {
    query = query.eq("rent_due_id", options.rentDueId)
  }
  if (options.kind) {
    query = query.eq("kind", options.kind)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listDocumentsSupabase:", error)
    return []
  }
  return (data ?? []) as Document[]
}

export async function getDocumentSupabase(
  ownerId: string,
  id: string
): Promise<Document | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getDocumentSupabase:", error)
    return null
  }
  return data as Document | null
}

export async function getDocumentByRentDueSupabase(
  ownerId: string,
  rentDueId: string,
  kind?: DocumentKind
): Promise<Document | null> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("rent_due_id", rentDueId)

  if (kind) {
    query = query.eq("kind", kind)
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error("Error getDocumentByRentDueSupabase:", error)
    return null
  }
  return data as Document | null
}

export async function createDocumentSupabase(
  ownerId: string,
  data: NewDocument
): Promise<Document> {
  const supabase = getSupabaseAdmin()

  // Replace if existing for same rent_due_id & kind
  const existing = await getDocumentByRentDueSupabase(ownerId, data.rent_due_id, data.kind)
  if (existing) {
    const { data: updated, error } = await supabase
      .from("documents")
      .update({
        lease_id: data.lease_id,
        file_path: data.file_path,
      })
      .eq("id", existing.id)
      .eq("owner_id", ownerId)
      .select()
      .single()

    if (error) {
      console.error("Error updating document Supabase:", error)
      throw new Error(`Erreur mise à jour document: ${error.message}`)
    }
    return updated as Document
  }

  const record = {
    owner_id: ownerId,
    lease_id: data.lease_id,
    rent_due_id: data.rent_due_id,
    kind: data.kind,
    file_path: data.file_path,
  }

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error creating document Supabase:", error)
    throw new Error(`Erreur création document: ${error.message}`)
  }

  return inserted as Document
}

export async function deleteDocumentSupabase(
  ownerId: string,
  id: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error deleting document Supabase:", error)
    return false
  }
  return true
}
