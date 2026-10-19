import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import { deleteAllOwnerFiles } from "./files"
import {
  getUserByIdSupabase,
  getUserByEmailSupabase,
  createUserSupabase,
  updateUserPasswordSupabase,
  exportUserDataSupabase,
  deleteUserAccountSupabase,
} from "./supabase/users"
import type { User, NewUser } from "./types"

export async function getUserById(id: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return getUserByIdSupabase(id)
  }
  const store = await readStore()
  return store.users.find((u) => u.id === id) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return getUserByEmailSupabase(email)
  }
  const store = await readStore()
  const lower = email.trim().toLowerCase()
  return store.users.find((u) => u.email.toLowerCase() === lower) ?? null
}

export async function createUser(data: NewUser): Promise<User> {
  if (isSupabaseConfigured()) {
    return createUserSupabase(data)
  }
  return mutateStore((current) => {
    const newUser: User = {
      id: generateUUID(),
      email: data.email.trim().toLowerCase(),
      password_hash: data.password_hash,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        users: [...current.users, newUser],
      },
      result: newUser,
    }
  })
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    return updateUserPasswordSupabase(userId, passwordHash)
  }
  await mutateStore((current) => {
    const userIndex = current.users.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      throw new Error(`Utilisateur introuvable: ${userId}`)
    }

    const nextUsers = [...current.users]
    nextUsers[userIndex] = {
      ...nextUsers[userIndex],
      password_hash: passwordHash,
    }

    return {
      nextData: {
        ...current,
        users: nextUsers,
      },
      result: undefined,
    }
  })
}

/**
 * Returns a complete JSON export of all data belonging to an owner.
 */
export async function exportUserData(ownerId: string) {
  if (isSupabaseConfigured()) {
    return exportUserDataSupabase(ownerId)
  }
  const store = await readStore()
  const user = store.users.find((u) => u.id === ownerId)
  return {
    version: "1.0",
    exported_at: currentISO(),
    user: user ? { id: user.id, email: user.email, created_at: user.created_at } : null,
    profile: store.profiles.find((p) => p.id === ownerId) ?? null,
    properties: store.properties.filter((p) => p.owner_id === ownerId),
    tenants: store.tenants.filter((t) => t.owner_id === ownerId),
    leases: store.leases.filter((l) => l.owner_id === ownerId),
    rent_dues: store.rent_dues.filter((d) => d.owner_id === ownerId),
    payments: store.payments.filter((p) => p.owner_id === ownerId),
    documents: (store.documents ?? []).filter((d) => d.owner_id === ownerId),
    outbox: (store.outbox ?? []).filter((m) => m.owner_id === ownerId),
  }
}

/**
 * Permanently removes all data and files belonging to the owner.
 */
export async function deleteUserAccount(ownerId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return deleteUserAccountSupabase(ownerId)
  }
  await mutateStore((current) => {
    return {
      nextData: {
        users: current.users.filter((u) => u.id !== ownerId),
        profiles: current.profiles.filter((p) => p.id !== ownerId),
        properties: current.properties.filter((p) => p.owner_id !== ownerId),
        tenants: current.tenants.filter((t) => t.owner_id !== ownerId),
        leases: current.leases.filter((l) => l.owner_id !== ownerId),
        rent_dues: current.rent_dues.filter((d) => d.owner_id !== ownerId),
        payments: current.payments.filter((p) => p.owner_id !== ownerId),
        documents: (current.documents ?? []).filter((d) => d.owner_id !== ownerId),
        outbox: (current.outbox ?? []).filter((m) => m.owner_id !== ownerId),
      },
      result: undefined,
    }
  })

  // Delete all uploaded private files for this owner
  await deleteAllOwnerFiles(ownerId).catch(() => {})
}
