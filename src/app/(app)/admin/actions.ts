"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin, addAuthorizedAdmin, removeAuthorizedAdmin } from "@/lib/admin/auth"

const adminEmailSchema = z.object({
  email: z.string().trim().email("Veuillez saisir une adresse e-mail valide."),
})

export async function addAdminAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const rawEmail = formData.get("email")
    const parsed = adminEmailSchema.safeParse({ email: rawEmail })

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Adresse e-mail invalide.",
      }
    }

    const res = await addAuthorizedAdmin(parsed.data.email)
    if (!res.success) {
      return { success: false, error: res.error || "Impossible d'ajouter cet administrateur." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erreur lors de l'ajout de l'administrateur.",
    }
  }
}

export async function removeAdminAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const rawEmail = formData.get("email")
    const parsed = adminEmailSchema.safeParse({ email: rawEmail })

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Adresse e-mail invalide.",
      }
    }

    const res = await removeAuthorizedAdmin(parsed.data.email)
    if (!res.success) {
      return { success: false, error: res.error || "Impossible de révoquer cet administrateur." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erreur lors de la révocation de l'administrateur.",
    }
  }
}
