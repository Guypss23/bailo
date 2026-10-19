import type { RentDue, Payment, DueStatus } from "../data/types"
import { toCents, fromCents, sumMoney } from "./money"

export interface DueOverviewResult {
  paid_amount: number
  balance: number
  last_paid_at: string | null
  status: DueStatus
  days_late: number
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10))
  return { year: y, month: m, day: d }
}

function diffInCalendarDays(fromStr: string, toStr: string): number {
  const from = parseDateParts(fromStr)
  const to = parseDateParts(toStr)
  const utcFrom = Date.UTC(from.year, from.month - 1, from.day)
  const utcTo = Date.UTC(to.year, to.month - 1, to.day)
  return Math.floor((utcTo - utcFrom) / (1000 * 60 * 60 * 24))
}

/**
 * Computes status, payment progress, balance and days late for a given rent due.
 */
export function getDueOverview(
  due: RentDue,
  payments: Payment[],
  today: string
): DueOverviewResult {
  // Only consider payments associated with this specific rent due
  const duePayments = payments.filter((p) => p.rent_due_id === due.id)

  const paid_amount = sumMoney(duePayments.map((p) => p.amount))
  const totalCents = toCents(due.total_amount)
  const paidCents = toCents(paid_amount)
  const balanceCents = Math.max(0, totalCents - paidCents)
  const balance = fromCents(balanceCents)

  // Find last payment date if any
  let last_paid_at: string | null = null
  if (duePayments.length > 0) {
    const sorted = [...duePayments].sort((a, b) => b.paid_at.localeCompare(a.paid_at))
    last_paid_at = sorted[0].paid_at
  }

  // Determine status
  let status: DueStatus
  if (paidCents >= totalCents) {
    status = "paye"
  } else if (paidCents > 0) {
    status = "partiel"
  } else if (due.due_date < today) {
    status = "impaye"
  } else {
    status = "a_venir"
  }

  // Compute days_late
  let days_late = 0
  if (balanceCents > 0 && due.due_date < today) {
    days_late = Math.max(0, diffInCalendarDays(due.due_date, today))
  }

  return {
    paid_amount,
    balance,
    last_paid_at,
    status,
    days_late,
  }
}
