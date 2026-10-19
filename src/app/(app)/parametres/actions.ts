"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser, signOut } from "@/lib/auth"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import {
  updateProfile,
  getDemoStatus,
  createDemoData,
  deleteDemoData,
  saveFile,
  deleteFile,
  updateUserPassword,
  exportUserData,
  deleteUserAccount,
  type Currency,
} from "@/lib/data"

export interface ParametresActionState {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Le nom doit comporter au moins 2 caractères."),
  company_name: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  currency: z.enum(["XAF", "XOF", "EUR", "MAD", "CHF", "CAD"]).default("XAF"),
  reminder_days_after_due: z.coerce
    .number()
    .int("Le délai doit être un nombre entier.")
    .min(1, "Le délai minimum est de 1 jour.")
    .max(30, "Le délai maximum est de 30 jours.")
    .default(5),
  notice_days_before: z.coerce
    .number()
    .int("Le préavis doit être un nombre entier.")
    .min(1, "Le préavis minimum est de 1 jour.")
    .max(30, "Le préavis maximum est de 30 jours.")
    .default(5),
  payment_instructions: z.string().trim().optional(),
})

export async function updateProfileAction(
  prevState: ParametresActionState | null,
  formData: FormData
): Promise<ParametresActionState> {
  const { user } = await requireUser()

  const rawData = {
    full_name: formData.get("full_name")?.toString() ?? "",
    company_name: formData.get("company_name")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    currency: formData.get("currency")?.toString() ?? "XAF",
    reminder_days_after_due: formData.get("reminder_days_after_due")?.toString() ?? "5",
    notice_days_before: formData.get("notice_days_before")?.toString() ?? "5",
    payment_instructions: formData.get("payment_instructions")?.toString() ?? "",
  }

  const result = updateProfileSchema.safeParse(rawData)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations saisies.",
      fieldErrors,
    }
  }

  const data = result.data

  try {
    await updateProfile(user.id, {
      full_name: data.full_name,
      company_name: data.company_name ? data.company_name : null,
      address: data.address ? data.address : null,
      city: data.city ? data.city : null,
      phone: data.phone ? data.phone : null,
      currency: data.currency as Currency,
      reminder_days_after_due: data.reminder_days_after_due,
      notice_days_before: data.notice_days_before,
      payment_instructions: data.payment_instructions ? data.payment_instructions : null,
    })

    revalidatePath("/parametres")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")
    revalidatePath("/", "layout")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      error: "Impossible d'enregistrer les modifications. Veuillez réessayer.",
    }
  }
}

/**
 * Exécute manuellement les tâches quotidiennes (génération d'échéances, avis, relances, quittances).
 */
export async function runDailyTasksManualAction(): Promise<{
  success: boolean
  summary?: string
  totalCount?: number
  error?: string
}> {
  const { user } = await requireUser()
  try {
    const { runDailyTasks } = await import("@/lib/daily")
    const result = await runDailyTasks(user.id)

    revalidatePath("/parametres")
    revalidatePath("/parametres/boite-envoi")
    revalidatePath("/loyers")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/", "layout")

    return {
      success: true,
      summary: result.summary,
      totalCount: result.totalCount,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'exécution des tâches du jour."
    return { success: false, error: message }
  }
}

/**
 * Saves a signature file (PNG or JPEG <= 1 Mo) from an uploaded file or base64 canvas drawing.
 */
export async function saveSignatureAction(formData: FormData): Promise<{
  ok: boolean
  signaturePath?: string
  error?: string
}> {
  const { user } = await requireUser()

  try {
    const file = formData.get("file") as File | null
    const dataUrl = formData.get("dataUrl")?.toString()

    let buffer: Buffer

    if (file && file.size > 0) {
      // 1 Mo max
      if (file.size > 1024 * 1024) {
        return { ok: false, error: "Le fichier ne doit pas dépasser 1 Mo." }
      }

      if (file.type !== "image/png" && file.type !== "image/jpeg") {
        return { ok: false, error: "Format invalide. Utilisez une image PNG ou JPEG." }
      }

      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (dataUrl && dataUrl.startsWith("data:image/")) {
      const base64Data = dataUrl.split(",")[1]
      if (!base64Data) {
        return { ok: false, error: "Données de signature invalides." }
      }
      buffer = Buffer.from(base64Data, "base64")
      if (buffer.length > 1024 * 1024) {
        return { ok: false, error: "Le tracé de signature est trop volumineux (max 1 Mo)." }
      }
    } else {
      return { ok: false, error: "Aucun fichier ou dessin de signature fourni." }
    }

    const savedRelativePath = await saveFile(user.id, "signature.png", buffer)
    await updateProfile(user.id, {
      signature_path: savedRelativePath,
    })

    revalidatePath("/parametres")
    revalidatePath("/tableau-de-bord")

    return { ok: true, signaturePath: savedRelativePath }
  } catch (error) {
    console.error("Error saving signature:", error)
    return { ok: false, error: "Une erreur est survenue lors de l'enregistrement de la signature." }
  }
}

/**
 * Deletes the user's stored signature.
 */
export async function deleteSignatureAction(): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser()

  try {
    await deleteFile(user.id, "signature.png")
    await updateProfile(user.id, {
      signature_path: null,
    })

    revalidatePath("/parametres")
    return { ok: true }
  } catch (error) {
    console.error("Error deleting signature:", error)
    return { ok: false, error: "Impossible de supprimer la signature." }
  }
}

/**
 * Changes user password verifying the previous password first.
 */
const updatePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Veuillez renseigner votre mot de passe actuel."),
    new_password: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères."),
    confirm_password: z.string().min(1, "Veuillez confirmer le mot de passe."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les nouveaux mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  })

export async function updatePasswordAction(
  prevState: any,
  formData: FormData
): Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }> {
  const { user } = await requireUser()

  const raw = {
    current_password: formData.get("current_password")?.toString() ?? "",
    new_password: formData.get("new_password")?.toString() ?? "",
    confirm_password: formData.get("confirm_password")?.toString() ?? "",
  }

  const result = updatePasswordSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return { ok: false, error: "Veuillez vérifier les informations saisies.", fieldErrors }
  }

  // Check current password
  const isValid = await verifyPassword(result.data.current_password, user.password_hash)
  if (!isValid) {
    return {
      ok: false,
      error: "Le mot de passe actuel est incorrect.",
      fieldErrors: { current_password: "Mot de passe incorrect" },
    }
  }

  // Hash new password and update
  const newHash = await hashPassword(result.data.new_password)
  await updateUserPassword(user.id, newHash)

  return { ok: true }
}

/**
 * Exports all user data into a JSON structure.
 */
export async function exportDataAction(): Promise<{ ok: boolean; data?: any; error?: string }> {
  const { user } = await requireUser()

  try {
    const exportData = await exportUserData(user.id)
    return { ok: true, data: exportData }
  } catch (error) {
    console.error("Error exporting data:", error)
    return { ok: false, error: "Impossible d'exporter vos données." }
  }
}

/**
 * Permanently deletes the account and all associated entities and files.
 */
export async function deleteAccountAction(confirmation: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser()

  if (confirmation.trim() !== "SUPPRIMER") {
    return { ok: false, error: "Veuillez saisir exactement « SUPPRIMER » pour confirmer la suppression." }
  }

  try {
    await deleteUserAccount(user.id)
    await signOut()
    return { ok: true }
  } catch (error) {
    console.error("Error deleting user account:", error)
    return { ok: false, error: "Une erreur est survenue lors de la suppression de votre compte." }
  }
}

/**
 * Loads realistic demo data (3 properties, 3 tenants, 3 leases, dues and payments)
 * only if the user has no properties.
 */
export async function loadDemoDataAction(): Promise<{ ok: boolean; error?: string }> {
  const { user, profile } = await requireUser()

  try {
    const status = await getDemoStatus(user.id)
    if (status.hasProperties && !status.hasDemoData) {
      return {
        ok: false,
        error:
          "Les données de démonstration ne peuvent être chargées que si vous n'avez aucun bien enregistré.",
      }
    }

    await createDemoData(user.id, profile.currency)

    revalidatePath("/parametres")
    revalidatePath("/baux")
    revalidatePath("/biens")
    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return { ok: true }
  } catch (error) {
    console.error("Error loading demo data:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors du chargement des données de démo.",
    }
  }
}

/**
 * Removes all demo data marked with [demo].
 */
export async function deleteDemoDataAction(): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser()

  try {
    await deleteDemoData(user.id)

    revalidatePath("/parametres")
    revalidatePath("/baux")
    revalidatePath("/biens")
    revalidatePath("/locataires")
    revalidatePath("/tableau-de-bord")
    revalidatePath("/loyers")

    return { ok: true }
  } catch (error) {
    console.error("Error deleting demo data:", error)
    return {
      ok: false,
      error: "Une erreur est survenue lors de la suppression des données de démo.",
    }
  }
}
