import type {
  Lease,
  Tenant,
  Property,
  Payment,
  RentDueOverview,
  DueStatus,
  EnrichedDueOverview,
} from "@/lib/data/types"
import { toPeriod } from "@/lib/format"

export interface AnnualGridMonthCell {
  monthIndex: number // 0 to 11
  period: string // 'YYYY-MM-01'
  monthLabel: string // 'Janv.', 'Févr.', ...
  isOutOfLease: boolean
  due: EnrichedDueOverview | null
  status: DueStatus | "hors_bail"
  paidAmount: number
  totalAmount: number
  balance: number
  daysLate: number
  lastPaidAt: string | null
  paidRatio: number // 0 to 1
}

export interface AnnualGridRow {
  lease: Lease
  tenant: Tenant | null
  property: Property | null
  cells: AnnualGridMonthCell[]
  totalPaid: number
  totalDue: number
  totalBalance: number
}

export interface AnnualMonthSummary {
  monthIndex: number
  period: string
  monthLabel: string
  totalDue: number
  totalPaid: number
  recoveryRate: number
}

export interface AnnualGridData {
  year: number
  rows: AnnualGridRow[]
  monthSummaries: AnnualMonthSummary[]
  kpis: {
    totalPaid: number
    totalDue: number
    recoveryRate: number
    unpaidCount: number
    avgLateDays: number
  }
}

export const MONTH_SHORT_LABELS = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
]

export const MONTH_INITIALS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
]

/**
 * Checks if a given month period ('YYYY-MM-01') falls within the active bounds of a lease.
 */
export function isPeriodInLease(period: string, lease: Lease): boolean {
  const leaseStartPeriod = toPeriod(lease.start_date)
  if (period < leaseStartPeriod) return false

  if (lease.end_date) {
    const leaseEndPeriod = toPeriod(lease.end_date)
    if (period > leaseEndPeriod) return false
  }

  return true
}

/**
 * Pure function: pivots leases and rent dues for a specified year into a complete spreadsheet-style grid.
 */
export function buildAnnualGrid(options: {
  year: number
  leases: Lease[]
  tenants: Tenant[]
  properties: Property[]
  dues: RentDueOverview[]
  payments?: Payment[]
  propertyFilter?: string | null
}): AnnualGridData {
  const { year, leases, tenants, properties, dues, payments = [], propertyFilter } = options

  const tenantsMap = new Map<string, Tenant>(tenants.map((t) => [t.id, t]))
  const propertiesMap = new Map<string, Property>(properties.map((p) => [p.id, p]))

  // Map payments by rent_due_id
  const paymentsByDue = new Map<string, Payment[]>()
  for (const p of payments) {
    const list = paymentsByDue.get(p.rent_due_id) || []
    list.push(p)
    paymentsByDue.set(p.rent_due_id, list)
  }

  // Pre-filter leases:
  // Must not be draft, must match propertyFilter if set,
  // and must either be active during the year or have dues in the year.
  const yearStartPeriod = `${year}-01-01`
  const yearEndPeriod = `${year}-12-01`

  const eligibleLeases = leases.filter((lease) => {
    if (lease.status === "brouillon") return false
    if (propertyFilter && propertyFilter !== "all" && lease.property_id !== propertyFilter) {
      return false
    }

    const leaseStartPeriod = toPeriod(lease.start_date)
    if (leaseStartPeriod > yearEndPeriod) return false

    if (lease.end_date) {
      const leaseEndPeriod = toPeriod(lease.end_date)
      if (leaseEndPeriod < yearStartPeriod) return false
    }

    return true
  })

  // Index dues by `lease_id:period`
  const duesByLeasePeriod = new Map<string, RentDueOverview>()
  for (const d of dues) {
    duesByLeasePeriod.set(`${d.lease_id}:${d.period}`, d)
  }

  // Build grid rows
  const rows: AnnualGridRow[] = []

  for (const lease of eligibleLeases) {
    const tenant = tenantsMap.get(lease.tenant_id) || null
    const property = propertiesMap.get(lease.property_id) || null

    let rowTotalPaid = 0
    let rowTotalDue = 0
    let rowTotalBalance = 0

    const cells: AnnualGridMonthCell[] = []

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthStr = String(monthIndex + 1).padStart(2, "0")
      const period = `${year}-${monthStr}-01`
      const monthLabel = MONTH_SHORT_LABELS[monthIndex]

      const inLease = isPeriodInLease(period, lease)
      const rawDue = duesByLeasePeriod.get(`${lease.id}:${period}`) || null

      if (!inLease && !rawDue) {
        cells.push({
          monthIndex,
          period,
          monthLabel,
          isOutOfLease: true,
          due: null,
          status: "hors_bail",
          paidAmount: 0,
          totalAmount: 0,
          balance: 0,
          daysLate: 0,
          lastPaidAt: null,
          paidRatio: 0,
        })
        continue
      }

      // If we have an existing due, enrich it for interaction, or synthesize if in lease
      let enrichedDue: EnrichedDueOverview | null = null
      if (rawDue) {
        const duePayments = paymentsByDue.get(rawDue.id) || []
        enrichedDue = {
          ...rawDue,
          tenant,
          property,
          lease,
          payments: duePayments,
        }
      } else if (inLease) {
        const dayStr = String(lease.due_day).padStart(2, "0")
        const dueDate = `${year}-${monthStr}-${dayStr}`
        const monthlyTotal = lease.rent_amount + lease.charges_amount
        enrichedDue = {
          id: `virtual-${lease.id}-${period}`,
          owner_id: lease.owner_id,
          lease_id: lease.id,
          property_id: lease.property_id,
          tenant_id: lease.tenant_id,
          period,
          due_date: dueDate,
          rent_amount: lease.rent_amount,
          charges_amount: lease.charges_amount,
          total_amount: monthlyTotal,
          paid_amount: 0,
          balance: monthlyTotal,
          last_paid_at: null,
          status: "a_venir",
          days_late: 0,
          note: null,
          created_at: new Date().toISOString(),
          tenant,
          property,
          lease,
          payments: [],
        }
      }

      const totalAmount = rawDue ? rawDue.total_amount : lease.rent_amount + lease.charges_amount
      const paidAmount = rawDue ? rawDue.paid_amount : 0
      const balance = rawDue ? rawDue.balance : totalAmount
      const status: DueStatus = rawDue ? rawDue.status : "a_venir"
      const daysLate = rawDue ? rawDue.days_late : 0
      const lastPaidAt = rawDue ? rawDue.last_paid_at : null
      const paidRatio = totalAmount > 0 ? Math.min(1, paidAmount / totalAmount) : 1

      rowTotalPaid += paidAmount
      rowTotalDue += totalAmount
      rowTotalBalance += balance

      cells.push({
        monthIndex,
        period,
        monthLabel,
        isOutOfLease: false,
        due: enrichedDue,
        status,
        paidAmount,
        totalAmount,
        balance,
        daysLate,
        lastPaidAt,
        paidRatio,
      })
    }

    rows.push({
      lease,
      tenant,
      property,
      cells,
      totalPaid: rowTotalPaid,
      totalDue: rowTotalDue,
      totalBalance: rowTotalBalance,
    })
  }

  // Monthly summary calculations (footer)
  const monthSummaries: AnnualMonthSummary[] = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthStr = String(monthIndex + 1).padStart(2, "0")
    const period = `${year}-${monthStr}-01`
    const monthLabel = MONTH_SHORT_LABELS[monthIndex]

    let monthDue = 0
    let monthPaid = 0

    for (const row of rows) {
      const cell = row.cells[monthIndex]
      if (!cell.isOutOfLease) {
        monthDue += cell.totalAmount
        monthPaid += cell.paidAmount
      }
    }

    const recoveryRate = monthDue > 0 ? Math.round((monthPaid / monthDue) * 100) : 100

    monthSummaries.push({
      monthIndex,
      period,
      monthLabel,
      totalDue: monthDue,
      totalPaid: monthPaid,
      recoveryRate,
    })
  }

  // Global KPIs computation
  let grandTotalPaid = 0
  let grandTotalDue = 0
  let unpaidCount = 0
  let totalLateDays = 0
  let lateDuesCount = 0

  for (const row of rows) {
    grandTotalPaid += row.totalPaid
    grandTotalDue += row.totalDue

    for (const cell of row.cells) {
      if (cell.isOutOfLease) continue

      if (cell.status === "impaye" || cell.status === "partiel") {
        unpaidCount++
      }

      if (cell.daysLate > 0) {
        totalLateDays += cell.daysLate
        lateDuesCount++
      }
    }
  }

  const recoveryRate =
    grandTotalDue > 0 ? Math.round((grandTotalPaid / grandTotalDue) * 100) : 100

  const avgLateDays = lateDuesCount > 0 ? Math.round(totalLateDays / lateDuesCount) : 0

  return {
    year,
    rows,
    monthSummaries,
    kpis: {
      totalPaid: grandTotalPaid,
      totalDue: grandTotalDue,
      recoveryRate,
      unpaidCount,
      avgLateDays,
    },
  }
}
