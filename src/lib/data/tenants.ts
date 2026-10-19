import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listTenantsSupabase,
  getTenantSupabase,
  createTenantSupabase,
  updateTenantSupabase,
  archiveTenantSupabase,
  deleteTenantSupabase,
} from "./supabase/tenants"
import type { Tenant, NewTenant } from "./types"
import { NotFoundError, HasLeasesError } from "./errors"

export async function listTenants(
  ownerId: string,
  options: { includeArchived?: boolean } = {}
): Promise<Tenant[]> {
  if (isSupabaseConfigured()) {
    return listTenantsSupabase(ownerId, options)
  }
  const store = await readStore()
  return store.tenants.filter((t) => {
    if (t.owner_id !== ownerId) return false
    if (!options.includeArchived && t.archived_at !== null) return false
    return true
  })
}

export async function getTenant(
  ownerId: string,
  id: string
): Promise<Tenant | null> {
  if (isSupabaseConfigured()) {
    return getTenantSupabase(ownerId, id)
  }
  const store = await readStore()
  const tenant = store.tenants.find((t) => t.id === id && t.owner_id === ownerId)
  return tenant ?? null
}

export async function createTenant(
  ownerId: string,
  data: NewTenant
): Promise<Tenant> {
  if (isSupabaseConfigured()) {
    return createTenantSupabase(ownerId, data)
  }
  return mutateStore((current) => {
    const newTenant: Tenant = {
      id: generateUUID(),
      owner_id: ownerId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      archived_at: data.archived_at ?? null,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        tenants: [...current.tenants, newTenant],
      },
      result: newTenant,
    }
  })
}

export async function updateTenant(
  ownerId: string,
  id: string,
  data: Partial<NewTenant>
): Promise<Tenant> {
  if (isSupabaseConfigured()) {
    return updateTenantSupabase(ownerId, id, data)
  }
  return mutateStore((current) => {
    const index = current.tenants.findIndex(
      (t) => t.id === id && t.owner_id === ownerId
    )
    if (index === -1) {
      throw new NotFoundError("Locataire", id)
    }

    const updated: Tenant = {
      ...current.tenants[index],
      ...data,
    }

    const nextTenants = [...current.tenants]
    nextTenants[index] = updated

    return {
      nextData: {
        ...current,
        tenants: nextTenants,
      },
      result: updated,
    }
  })
}

export async function archiveTenant(
  ownerId: string,
  id: string,
  archive = true
): Promise<Tenant> {
  if (isSupabaseConfigured()) {
    return archiveTenantSupabase(ownerId, id, archive)
  }
  return updateTenant(ownerId, id, {
    archived_at: archive ? currentISO() : null,
  })
}

export async function deleteTenant(
  ownerId: string,
  id: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    return deleteTenantSupabase(ownerId, id)
  }
  return mutateStore((current) => {
    const tenant = current.tenants.find(
      (t) => t.id === id && t.owner_id === ownerId
    )
    if (!tenant) {
      throw new NotFoundError("Locataire", id)
    }

    // Integrity rule: cannot delete a tenant that has leases
    const hasLeases = current.leases.some(
      (l) => l.tenant_id === id && l.owner_id === ownerId
    )
    if (hasLeases) {
      throw new HasLeasesError("locataire")
    }

    return {
      nextData: {
        ...current,
        tenants: current.tenants.filter((t) => t.id !== id),
      },
      result: undefined,
    }
  })
}
