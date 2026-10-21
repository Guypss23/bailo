import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { Expense, NewExpense } from "../types"
import { ValidationError, NotFoundError } from "../errors"

export async function listExpensesSupabase(
  ownerId: string,
  options: {
    propertyId?: string
    category?: string
    year?: number
    month?: number // 1 to 12
  } = {}
): Promise<Expense[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("date", { ascending: false })

  if (options.propertyId) {
    query = query.eq("property_id", options.propertyId)
  }
  if (options.category) {
    query = query.eq("category", options.category)
  }
  if (options.year) {
    const yearStr = String(options.year)
    if (options.month) {
      const monthStr = String(options.month).padStart(2, "0")
      const start = `${yearStr}-${monthStr}-01`
      const lastDay = new Date(options.year, options.month, 0).getDate()
      const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`
      query = query.gte("date", start).lte("date", end)
    } else {
      query = query.gte("date", `${yearStr}-01-01`).lte("date", `${yearStr}-12-31`)
    }
  }

  const { data, error } = await query
  if (error) {
    throw error
  }
  return (data ?? []) as Expense[]
}

export async function getExpenseSupabase(
  ownerId: string,
  id: string
): Promise<Expense | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error) {
    throw error
  }
  return (data as Expense) ?? null
}

export async function createExpenseSupabase(
  ownerId: string,
  data: NewExpense
): Promise<Expense> {
  if (data.amount <= 0) {
    throw new ValidationError("Le montant de la dépense doit être strictement positif.")
  }

  const supabase = getSupabaseAdmin()
  const insertPayload = {
    owner_id: ownerId,
    property_id: data.property_id || null,
    category: data.category,
    description: data.description.trim(),
    amount: data.amount,
    date: data.date,
    payment_method: data.payment_method || "especes",
    receipt_url: data.receipt_url || null,
    notes: data.notes ? data.notes.trim() : null,
  }

  const { data: created, error } = await supabase
    .from("expenses")
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw error
  }
  return created as Expense
}

export async function updateExpenseSupabase(
  ownerId: string,
  id: string,
  data: Partial<NewExpense>
): Promise<Expense> {
  const supabase = getSupabaseAdmin()
  const updatePayload: Record<string, any> = {}

  if (data.property_id !== undefined) updatePayload.property_id = data.property_id || null
  if (data.category !== undefined) updatePayload.category = data.category
  if (data.description !== undefined) updatePayload.description = data.description.trim()
  if (data.amount !== undefined) {
    if (data.amount <= 0) {
      throw new ValidationError("Le montant de la dépense doit être strictement positif.")
    }
    updatePayload.amount = data.amount
  }
  if (data.date !== undefined) updatePayload.date = data.date
  if (data.payment_method !== undefined) updatePayload.payment_method = data.payment_method
  if (data.receipt_url !== undefined) updatePayload.receipt_url = data.receipt_url || null
  if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes.trim() : null

  const { data: updated, error } = await supabase
    .from("expenses")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single()

  if (error) {
    throw error
  }
  if (!updated) {
    throw new NotFoundError("Dépense", id)
  }
  return updated as Expense
}

export async function deleteExpenseSupabase(
  ownerId: string,
  id: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)

  if (error) {
    throw error
  }
}
