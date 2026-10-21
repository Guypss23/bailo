"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  type Expense,
} from "@/lib/data"
import {
  expenseSchema,
  updateExpenseSchema,
  type ExpenseFormData,
  type UpdateExpenseFormData,
} from "@/lib/validations/expense"

export type ExpenseActionResult =
  | { success: true; expense: Expense }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

export type ActionStatusResult =
  | { success: true }
  | { success: false; error: string }

function revalidateExpensePaths() {
  revalidatePath("/depenses")
  revalidatePath("/tableau-de-bord")
  revalidatePath("/loyers/annuel")
  revalidatePath("/biens")
}

export async function createExpenseAction(raw: unknown): Promise<ExpenseActionResult> {
  const { user } = await requireUser()
  const parsed = expenseSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form"
      fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations de la dépense.",
      fieldErrors,
    }
  }

  try {
    const expense = await createExpense(user.id, parsed.data)
    revalidateExpensePaths()
    return { success: true, expense }
  } catch (err: any) {
    console.error("Error creating expense:", err)
    return {
      success: false,
      error: err.message || "Erreur lors de l'enregistrement de la dépense.",
    }
  }
}

export async function updateExpenseAction(raw: unknown): Promise<ExpenseActionResult> {
  const { user } = await requireUser()
  const parsed = updateExpenseSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form"
      fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: "Veuillez vérifier les informations de la dépense.",
      fieldErrors,
    }
  }

  try {
    const { id, ...data } = parsed.data
    const expense = await updateExpense(user.id, id, data)
    revalidateExpensePaths()
    return { success: true, expense }
  } catch (err: any) {
    console.error("Error updating expense:", err)
    return {
      success: false,
      error: err.message || "Erreur lors de la mise à jour de la dépense.",
    }
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionStatusResult> {
  const { user } = await requireUser()

  try {
    await deleteExpense(user.id, id)
    revalidateExpensePaths()
    return { success: true }
  } catch (err: any) {
    console.error("Error deleting expense:", err)
    return {
      success: false,
      error: err.message || "Erreur lors de la suppression de la dépense.",
    }
  }
}
