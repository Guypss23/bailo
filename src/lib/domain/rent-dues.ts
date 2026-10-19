import type { Lease, NewRentDue } from "../data/types"
import { toCents, fromCents, sumMoney } from "./money"

function parseYearMonth(periodStr: string): { year: number; month: number } {
  const [y, m] = periodStr.split("-").map((v) => parseInt(v, 10))
  return { year: y, month: m }
}

function formatPeriod(year: number, month: number): string {
  const mStr = String(month).padStart(2, "0")
  return `${year}-${mStr}-01`
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 }
  }
  return { year, month: month + 1 }
}

export function toPeriodString(dateStr: string): string {
  const [y, m] = dateStr.split("-")
  return `${y}-${m}-01`
}

export function getDefaultUntilPeriod(referenceDate?: Date): string {
  const now = referenceDate ?? new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  const next = nextMonth(year, month)
  return formatPeriod(next.year, next.month)
}

/**
 * Computes missing rent dues for a lease up to a specified until period.
 * Does not generate anything for 'brouillon' leases.
 */
export function computeMissingDues(
  lease: Lease,
  existingPeriods: string[] | Set<string>,
  untilPeriod?: string
): NewRentDue[] {
  if (lease.status === "brouillon") {
    return []
  }

  const existingSet = Array.isArray(existingPeriods)
    ? new Set(existingPeriods)
    : existingPeriods

  const startPeriod = toPeriodString(lease.start_date)
  const defaultUntil = untilPeriod ?? getDefaultUntilPeriod()
  
  let endPeriod = defaultUntil
  if (lease.end_date) {
    const leaseEndPeriod = toPeriodString(lease.end_date)
    if (leaseEndPeriod < endPeriod) {
      endPeriod = leaseEndPeriod
    }
  }

  if (startPeriod > endPeriod) {
    return []
  }

  const duesToCreate: NewRentDue[] = []
  let { year, month } = parseYearMonth(startPeriod)
  const endLimit = parseYearMonth(endPeriod)

  while (true) {
    const currentPeriodStr = formatPeriod(year, month)

    if (!existingSet.has(currentPeriodStr)) {
      const dayStr = String(lease.due_day).padStart(2, "0")
      const dueDate = `${year}-${String(month).padStart(2, "0")}-${dayStr}`
      const total_amount = sumMoney([lease.rent_amount, lease.charges_amount])

      duesToCreate.push({
        lease_id: lease.id,
        period: currentPeriodStr,
        due_date: dueDate,
        rent_amount: lease.rent_amount,
        charges_amount: lease.charges_amount,
        total_amount,
        note: null,
      })
    }

    if (year === endLimit.year && month === endLimit.month) {
      break
    }

    const next = nextMonth(year, month)
    year = next.year
    month = next.month
  }

  return duesToCreate
}
