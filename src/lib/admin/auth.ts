import "server-only"
import { redirect } from "next/navigation"
import { requireUser, type AuthenticatedUser } from "@/lib/auth"
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase"
import fs from "node:fs/promises"
import path from "node:path"

export const SUPER_ADMIN_EMAIL = "bourdettes.guypatrick@gmail.com"

const ADMIN_STORAGE_DIR = process.env.VERCEL
  ? path.resolve("/tmp", ".data")
  : path.resolve(process.cwd(), ".data")
const ADMIN_STORAGE_FILE = path.join(ADMIN_STORAGE_DIR, "admins.json")

/**
 * Lit la liste des administrateurs dynamiques persistés.
 */
export async function getDynamicAdminEmails(): Promise<string[]> {
  try {
    await fs.mkdir(ADMIN_STORAGE_DIR, { recursive: true })
    const raw = await fs.readFile(ADMIN_STORAGE_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((e: string) => e.trim().toLowerCase())
    }
    return []
  } catch {
    return []
  }
}

/**
 * Enregistre la liste des administrateurs dynamiques.
 */
async function saveDynamicAdminEmails(emails: string[]): Promise<void> {
  try {
    await fs.mkdir(ADMIN_STORAGE_DIR, { recursive: true })
    await fs.writeFile(ADMIN_STORAGE_FILE, JSON.stringify(emails, null, 2), "utf-8")
  } catch (err) {
    console.error("Erreur lors de la sauvegarde des administrateurs :", err)
  }
}

/**
 * Récupère l'ensemble des adresses e-mail autorisées en tant qu'administrateurs.
 */
export async function getAuthorizedAdminEmails(): Promise<string[]> {
  const list = new Set<string>()
  list.add(SUPER_ADMIN_EMAIL.toLowerCase())

  // Variables d'environnement éventuelles
  if (process.env.ADMIN_EMAILS) {
    for (const email of process.env.ADMIN_EMAILS.split(",")) {
      const clean = email.trim().toLowerCase()
      if (clean) list.add(clean)
    }
  }

  // Stockage dynamique local / serverless
  const dynamicList = await getDynamicAdminEmails()
  for (const email of dynamicList) {
    list.add(email)
  }

  // Supabase Auth app_metadata (si configuré)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data } = await supabase.auth.admin.listUsers()
      if (data?.users) {
        for (const u of data.users) {
          if (u.email && u.app_metadata?.is_admin === true) {
            list.add(u.email.toLowerCase())
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de la lecture des admins Supabase :", err)
    }
  }

  return Array.from(list)
}

/**
 * Vérifie si une adresse e-mail dispose des privilèges administrateur.
 */
export async function isUserAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false
  const cleanEmail = email.trim().toLowerCase()
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true
  }

  const authorized = await getAuthorizedAdminEmails()
  return authorized.includes(cleanEmail)
}

/**
 * Vérifie que l'utilisateur connecté est administrateur.
 * Redirige vers le tableau de bord standard si ce n'est pas le cas.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const session = await requireUser()
  const isAdmin = await isUserAdmin(session.user.email)
  if (!isAdmin) {
    redirect("/tableau-de-bord")
  }
  return session
}

/**
 * Ajoute un administrateur délégué.
 */
export async function addAuthorizedAdmin(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Adresse e-mail invalide." }
  }

  const current = await getDynamicAdminEmails()
  if (!current.includes(cleanEmail)) {
    current.push(cleanEmail)
    await saveDynamicAdminEmails(current)
  }

  // Si l'utilisateur existe dans Supabase, marquer son app_metadata
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data } = await supabase.auth.admin.listUsers()
      const user = data?.users?.find((u) => u.email?.toLowerCase() === cleanEmail)
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...user.app_metadata,
            is_admin: true,
          },
        })
      }
    } catch (err) {
      console.error("Erreur mise à jour app_metadata Supabase :", err)
    }
  }

  return { success: true }
}

/**
 * Révoque les droits d'un administrateur délégué.
 * Le super-administrateur ne peut jamais être révoqué.
 */
export async function removeAuthorizedAdmin(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, error: "Le super-administrateur ne peut pas être révoqué." }
  }

  const current = await getDynamicAdminEmails()
  const next = current.filter((e) => e !== cleanEmail)
  await saveDynamicAdminEmails(next)

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data } = await supabase.auth.admin.listUsers()
      const user = data?.users?.find((u) => u.email?.toLowerCase() === cleanEmail)
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...user.app_metadata,
            is_admin: false,
          },
        })
      }
    } catch (err) {
      console.error("Erreur révocation app_metadata Supabase :", err)
    }
  }

  return { success: true }
}
