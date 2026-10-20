import type { Lease, NewRentDue } from "../data/types"
import { toCents, fromCents, sumMoney } from "./money"
import { addMonthsToPeriod, parseISODateParts } from "../format"

export interface DueForCascade {
  id: string
  period: string // 'YYYY-MM-01'
  due_date: string // 'YYYY-MM-DD'
  total_amount: number
  balance: number
}

export interface CascadeAllocation {
  rent_due_id?: string
  period: string
  amount: number
  previousBalance: number
  remainingBalanceAfter: number
  isSettled: boolean
  isNewDue: boolean
}

export interface CascadeSimulationResult {
  allocations: CascadeAllocation[]
  totalAllocated: number
  newDuesToCreate: NewRentDue[]
}

/**
 * Pure function that simulates or computes the legal cascade allocation of a lump-sum payment
 * across existing unpaid dues (from oldest to newest), and creates future dues if the payment
 * exceeds all current dues (advance payment).
 */
export function simulateCascadePayment(
  lease: Lease,
  existingDues: DueForCascade[],
  paymentAmount: number
): CascadeSimulationResult {
  if (paymentAmount <= 0) {
    return {
      allocations: [],
      totalAllocated: 0,
      newDuesToCreate: [],
    }
  }

  let remainingCents = toCents(paymentAmount)
  const allocations: CascadeAllocation[] = []
  const newDuesToCreate: NewRentDue[] = []

  // 1. Sort existing dues chronologically (oldest period first)
  const sortedDues = [...existingDues].sort((a, b) => a.period.localeCompare(b.period))

  // 2. Allocate to existing dues that have a remaining positive balance
  for (const due of sortedDues) {
    if (remainingCents <= 0) break

    const dueBalanceCents = toCents(due.balance)
    if (dueBalanceCents <= 0) continue

    const allocatedCents = Math.min(remainingCents, dueBalanceCents)
    const remainingAfterCents = dueBalanceCents - allocatedCents

    allocations.push({
      rent_due_id: due.id,
      period: due.period,
      amount: fromCents(allocatedCents),
      previousBalance: due.balance,
      remainingBalanceAfter: fromCents(remainingAfterCents),
      isSettled: remainingAfterCents === 0,
      isNewDue: false,
    })

    remainingCents -= allocatedCents
  }

  // 3. If remaining money remains, generate future monthly dues until fully absorbed
  if (remainingCents > 0) {
    // Find the latest period among existing dues or start from lease start_date
    let latestPeriod: string
    if (sortedDues.length > 0) {
      latestPeriod = sortedDues[sortedDues.length - 1].period
    } else {
      latestPeriod = `${lease.start_date.slice(0, 7)}-01`
    }

    const monthlyTotal = sumMoney([lease.rent_amount, lease.charges_amount])
    const monthlyTotalCents = toCents(monthlyTotal)

    let currentPeriod = latestPeriod

    // Avoid infinite loop if monthly rent is 0
    while (remainingCents > 0 && monthlyTotalCents > 0) {
      currentPeriod = addMonthsToPeriod(currentPeriod, 1)

      // Check if lease has ended and period is beyond end_date
      if (lease.end_date && currentPeriod > `${lease.end_date.slice(0, 7)}-01`) {
        // Lease has ended: still allocate the remainder as an advance or stop
        break
      }

      const { year, month } = parseISODateParts(currentPeriod)
      const dayStr = String(lease.due_day).padStart(2, "0")
      const monthStr = String(month).padStart(2, "0")
      const dueDate = `${year}-${monthStr}-${dayStr}`

      const newDue: NewRentDue = {
        lease_id: lease.id,
        period: currentPeriod,
        due_date: dueDate,
        rent_amount: lease.rent_amount,
        charges_amount: lease.charges_amount,
        total_amount: monthlyTotal,
        note: null,
      }
      newDuesToCreate.push(newDue)

      const allocatedCents = Math.min(remainingCents, monthlyTotalCents)
      const remainingAfterCents = monthlyTotalCents - allocatedCents

      allocations.push({
        period: currentPeriod,
        amount: fromCents(allocatedCents),
        previousBalance: monthlyTotal,
        remainingBalanceAfter: fromCents(remainingAfterCents),
        isSettled: remainingAfterCents === 0,
        isNewDue: true,
      })

      remainingCents -= allocatedCents
    }
  }

  const totalAllocated = allocations.reduce((acc, a) => acc + a.amount, 0)

  return {
    allocations,
    totalAllocated,
    newDuesToCreate,
  }
}
