"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { signIn, signUp, signOut } from "@/lib/auth"

export interface AuthActionState {
  error?: string
  fieldErrors?: Record<string, string>
}

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Veuillez saisir votre adresse e-mail.")
    .email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(1, "Veuillez saisir votre mot de passe."),
  next: z.string().optional(),
})

const signUpSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Le prénom et nom doivent comporter au moins 2 caractères."),
  email: z
    .string()
    .trim()
    .min(1, "Veuillez saisir votre adresse e-mail.")
    .email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit comporter au moins 8 caractères."),
})

/**
 * Server Action for signing in with email and password.
 */
export async function signInAction(
  prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const rawEmail = formData.get("email")?.toString() ?? ""
  const rawPassword = formData.get("password")?.toString() ?? ""
  const rawNext = formData.get("next")?.toString()

  const result = signInSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    next: rawNext,
  })

  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      error: "Veuillez vérifier les informations saisies.",
      fieldErrors,
    }
  }

  const { email, password, next } = result.data
  const authResult = await signIn({ email, password })

  if (!authResult.success) {
    return {
      error: authResult.error || "E-mail ou mot de passe incorrect.",
    }
  }

  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/tableau-de-bord"
  redirect(target)
}

/**
 * Server Action for creating an account and profile.
 */
export async function signUpAction(
  prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const rawFullName = formData.get("full_name")?.toString() ?? ""
  const rawEmail = formData.get("email")?.toString() ?? ""
  const rawPassword = formData.get("password")?.toString() ?? ""

  const result = signUpSchema.safeParse({
    full_name: rawFullName,
    email: rawEmail,
    password: rawPassword,
  })

  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      error: "Veuillez vérifier les informations saisies.",
      fieldErrors,
    }
  }

  const { full_name, email, password } = result.data
  const authResult = await signUp({ full_name, email, password })

  if (!authResult.success) {
    return {
      error: authResult.error || "Impossible de créer le compte.",
    }
  }

  redirect("/tableau-de-bord")
}

/**
 * Server Action to log out and clear the session cookie.
 */
export async function signOutAction(): Promise<void> {
  await signOut()
  redirect("/connexion")
}
