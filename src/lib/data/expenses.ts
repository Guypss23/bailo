import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listExpensesSupabase,
  getExpenseSupabase,
  createExpenseSupabase,
  updateExpenseSupabase,
  deleteExpenseSupabase,
} from "./supabase/expenses"
import type { Expense, NewExpense, ExpenseCategory } from "./types"
import { NotFoundError, ValidationError } from "./errors"

export interface ListExpensesOptions {
  propertyId?: string
  category?: ExpenseCategory | string
  year?: number
  month?: number // 1 to 12
}

export async function listExpenses(
  ownerId: string,
  options: ListExpensesOptions = {}
): Promise<Expense[]> {
  if (isSupabaseConfigured()) {
    try {
      return await listExpensesSupabase(ownerId, options)
    } catch (err) {
      console.warn("Supabase listExpenses failed or table missing, falling back to local store:", err)
    }
  }

  const store = await readStore()
  const expenses = store.expenses ?? []

  return expenses
    .filter((e) => {
      if (e.owner_id !== ownerId) return false
      if (options.propertyId && e.property_id !== options.propertyId) return false
      if (options.category && e.category !== options.category) return false

      if (options.year) {
        const [expYear, expMonth] = e.date.split("-").map(Number)
        if (expYear !== options.year) return false
        if (options.month && expMonth !== options.month) return false
      }

      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getExpense(
  ownerId: string,
  id: string
): Promise<Expense | null> {
  if (isSupabaseConfigured()) {
    try {
      return await getExpenseSupabase(ownerId, id)
    } catch (err) {
      console.warn("Supabase getExpense failed, falling back to local store:", err)
    }
  }

  const store = await readStore()
  const expenses = store.expenses ?? []
  const found = expenses.find((e) => e.id === id && e.owner_id === ownerId)
  return found ?? null
}

export async function createExpense(
  ownerId: string,
  data: NewExpense
): Promise<Expense> {
  if (data.amount <= 0) {
    throw new ValidationError("Le montant de la dépense doit être strictement positif.")
  }

  if (isSupabaseConfigured()) {
    try {
      return await createExpenseSupabase(ownerId, data)
    } catch (err) {
      console.warn("Supabase createExpense failed, falling back to local store:", err)
    }
  }

  return mutateStore((current) => {
    if (data.property_id) {
      const property = current.properties.find(
        (p) => p.id === data.property_id && p.owner_id === ownerId
      )
      if (!property) {
        throw new NotFoundError("Bien", data.property_id)
      }
    }

    const newExpense: Expense = {
      id: generateUUID(),
      owner_id: ownerId,
      property_id: data.property_id || null,
      category: data.category,
      description: data.description.trim(),
      amount: data.amount,
      date: data.date,
      payment_method: data.payment_method || "especes",
      receipt_url: data.receipt_url || null,
      notes: data.notes ? data.notes.trim() : null,
      created_at: currentISO(),
    }

    const existingExpenses = current.expenses ?? []
    return {
      nextData: {
        ...current,
        expenses: [...existingExpenses, newExpense],
      },
      result: newExpense,
    }
  })
}

export async function updateExpense(
  ownerId: string,
  id: string,
  data: Partial<NewExpense>
): Promise<Expense> {
  if (data.amount !== undefined && data.amount <= 0) {
    throw new ValidationError("Le montant de la dépense doit être strictement positif.")
  }

  if (isSupabaseConfigured()) {
    try {
      return await updateExpenseSupabase(ownerId, id, data)
    } catch (err) {
      console.warn("Supabase updateExpense failed, falling back to local store:", err)
    }
  }

  return mutateStore((current) => {
    const existingExpenses = current.expenses ?? []
    const index = existingExpenses.findIndex((e) => e.id === id && e.owner_id === ownerId)
    if (index === -1) {
      throw new NotFoundError("Dépense", id)
    }

    const existing = existingExpenses[index]

    if (data.property_id) {
      const property = current.properties.find(
        (p) => p.id === data.property_id && p.owner_id === ownerId
      )
      if (!property) {
        throw new NotFoundError("Bien", data.property_id)
      }
    }

    const updated: Expense = {
      ...existing,
      ...(data.property_id !== undefined ? { property_id: data.property_id || null } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(data.payment_method !== undefined ? { payment_method: data.payment_method } : {}),
      ...(data.receipt_url !== undefined ? { receipt_url: data.receipt_url || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ? data.notes.trim() : null } : {}),
    }

    const nextExpenses = [...existingExpenses]
    nextExpenses[index] = updated

    return {
      nextData: {
        ...current,
        expenses: nextExpenses,
      },
      result: updated,
    }
  })
}

export async function deleteExpense(
  ownerId: string,
  id: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await deleteExpenseSupabase(ownerId, id)
      return
    } catch (err) {
      console.warn("Supabase deleteExpense failed, falling back to local store:", err)
    }
  }

  return mutateStore((current) => {
    const existingExpenses = current.expenses ?? []
    const exists = existingExpenses.some((e) => e.id === id && e.owner_id === ownerId)
    if (!exists) {
      throw new NotFoundError("Dépense", id)
    }

    return {
      nextData: {
        ...current,
        expenses: existingExpenses.filter((e) => !(e.id === id && e.owner_id === ownerId)),
      },
      result: undefined,
    }
  })
}
