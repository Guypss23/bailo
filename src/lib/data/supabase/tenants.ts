import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Tenant, NewTenant } from "../types"
import { NotFoundError, HasLeasesError } from "../errors"

export async function listTenantsSupabase(
  ownerId: string,
  options: { includeArchived?: boolean } = {}
): Promise<Tenant[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (!options.includeArchived) {
    query = query.is("archived_at", null)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error listTenantsSupabase:", error)
    return []
  }
  return (data ?? []) as Tenant[]
}

export async function getTenantSupabase(
  ownerId: string,
  id: string
): Promise<Tenant | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    console.error("Error getTenantSupabase:", error)
    return null
  }
  return data as Tenant | null
}

export async function createTenantSupabase(
  ownerId: string,
  data: NewTenant
): Promise<Tenant> {
  const supabase = getSupabaseAdmin()
  const record = {
    owner_id: ownerId,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    notes: data.notes ?? null,
    archived_at: data.archived_at ?? null,
  }

  const { data: inserted, error } = await supabase
    .from("tenants")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("Error createTenantSupabase:", error)
    throw new Error(`Erreur lors de la création du locataire: ${error.message}`)
  }

  return inserted as Tenant
}

export async function updateTenantSupabase(
  ownerId: string,
  id: string,
  data: Partial<NewTenant>
): Promise<Tenant> {
  const supabase = getSupabaseAdmin()
  const existing = await getTenantSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Locataire", id)
  }

  const { data: updated, error } = await supabase
    .from("tenants")
    .update(data)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    console.error("Error updateTenantSupabase:", error)
    throw new Error(`Erreur lors de la modification du locataire: ${error.message}`)
  }

  return updated as Tenant
}

export async function archiveTenantSupabase(
  ownerId: string,
  id: string,
  archive = true
): Promise<Tenant> {
  return updateTenantSupabase(ownerId, id, {
    archived_at: archive ? new Date().toISOString() : null,
  })
}

export async function deleteTenantSupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const existing = await getTenantSupabase(ownerId, id)
  if (!existing) {
    throw new NotFoundError("Locataire", id)
  }

  // Integrity rule: cannot delete a tenant that has leases
  const { count, error: countError } = await supabase
    .from("leases")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", id)
    .eq("owner_id", ownerId)

  if (countError) {
    console.error("Error checking leases before tenant deletion:", countError)
  }

  if (count && count > 0) {
    throw new HasLeasesError("locataire")
  }

  const { error } = await supabase
    .from("tenants")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    console.error("Error deleteTenantSupabase:", error)
    throw new Error(`Erreur lors de la suppression du locataire: ${error.message}`)
  }
}
