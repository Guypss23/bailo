import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Property, NewProperty } from "../types"
import { NotFoundError, HasLeasesError } from "../errors"

export async function listPropertiesSupabase(
  ownerId: string,
  options: { includeArchived?: boolean } = {}
): Promise<Property[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (!options.includeArchived) {
    query = query.is("archived_at", null)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listPropertiesSupabase:", error)
    return []
  }
  return (data ?? []) as Property[]
}

export async function getPropertySupabase(
  ownerId: string,
  id: string
): Promise<Property | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getPropertySupabase:", error)
    return null
  }
  return data as Property | null
}

export async function createPropertySupabase(
  ownerId: string,
  data: NewProperty
): Promise<Property> {
  const supabase = getSupabaseAdmin()
  const record = {
    owner_id: ownerId,
    name: data.name,
    type: data.type,
    address_line1: data.address_line1,
    address_line2: data.address_line2 ?? null,
    postal_code: data.postal_code,
    city: data.city,
    country: data.country ?? "GA",
    surface_m2: data.surface_m2 ?? null,
    notes: data.notes ?? null,
    archived_at: data.archived_at ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("properties")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createPropertySupabase:", error)
    throw new Error(`Erreur lors de la création du bien: ${error.message}`)
  }

  return inserted as Property
}

export async function updatePropertySupabase(
  ownerId: string,
  id: string,
  data: Partial<NewProperty>
): Promise<Property> {
  const supabase = getSupabaseAdmin()
  const existing = await getPropertySupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Bien", id)
  }

  const { data: updated, error } = await supabase
    .from("properties")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updatePropertySupabase:", error)
    throw new Error(`Erreur lors de la modification du bien: ${error.message}`)
  }

  return updated as Property
}

export async function archivePropertySupabase(
  ownerId: string,
  id: string,
  archive = true
): Promise<Property> {
  return updatePropertySupabase(ownerId, id, {
    archived_at: archive ? new Date().toISOString() : null,
  })
}

export async function deletePropertySupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const existing = await getPropertySupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Bien", id)
  }

  // Integrity rule: cannot delete a property that has leases
  const { count, error: countError } = await supabase
    .from("leases")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id)
    .eq("owner_id", ownerId)

  if (countError) {
    console.error("Error checking leases before property deletion:", countError)
  }

  if (count && count > 0) {
    throw new HasLeasesError("bien")
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error deletePropertySupabase:", error)
    throw new Error(`Erreur lors de la suppression du bien: ${error.message}`)
  }
}
