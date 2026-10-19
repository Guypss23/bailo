import {
  differenceInCalendarDays,
  addDays,
  format,
} from "date-fns"
import { fr } from "date-fns/locale"
import type {
  Property,
  Tenant,
  Lease,
  Payment,
  RentDueOverview,
} from "@/lib/data/types"
import {
  toPeriod,
  addMonthsToPeriod,
  parseISODate,
  parseISODateParts,
  toCents,
  fromCents,
} from "@/lib/format"

export interface DashboardKPIs {
  currentMonth: {
    period: string // 'YYYY-MM-01'
    monthLabel: string // 'octobre 2026'
    totalPaid: number
    totalDue: number
    recoveryRate: number
  }
  unpaidInProgress: {
    totalUnpaid: number
    tenantCount: number
    overdueCount: number
  }
  occupationRate: {
    occupiedCount: number
    totalCount: number
    rate: number
  }
  yearToDate: {
    year: number
    totalPaid: number
    previousYearTotalPaid: number
    changePercentage: number | null
  }
}

export interface DashboardChartPoint {
  monthKey: string // 'YYYY-MM'
  period: string // 'YYYY-MM-01'
  label: string // 'Nov.', 'Déc.', ...
  fullLabel: string // 'Novembre 2025'
  attendu: number
  encaisse: number
  recoveryRate: number
}

export interface DashboardReminderItem {
  due: RentDueOverview
  tenant: Tenant | null
  property: Property | null
  lease: Lease | null
}

export interface DashboardUpcomingItem {
  due: RentDueOverview
  tenant: Tenant | null
  property: Property | null
  lease: Lease | null
}

export interface DashboardExpiringLeaseItem {
  lease: Lease
  tenant: Tenant | null
  property: Property | null
  daysUntilEnd: number
}

export interface DashboardOnboardingStatus {
  hasProperties: boolean
  hasTenants: boolean
  hasLeases: boolean
  hasPayments: boolean
  completedCount: number
}

export interface DashboardCalculatedData {
  today: string
  hasLeases: boolean
  onboarding: DashboardOnboardingStatus
  kpis: DashboardKPIs
  chartSeries: DashboardChartPoint[]
  reminders: DashboardReminderItem[]
  upcomingDues: DashboardUpcomingItem[]
  expiringLeases: DashboardExpiringLeaseItem[]
}

/**
 * Computes current month collection KPI.
 */
export function computeCurrentMonthKPI(
  dues: RentDueOverview[],
  currentPeriod: string
): DashboardKPIs["currentMonth"] {
  const currentDues = dues.filter((d) => d.period === currentPeriod)

  let dueCents = 0
  let paidCents = 0

  for (const d of currentDues) {
    dueCents += toCents(d.total_amount)
    paidCents += toCents(d.paid_amount)
  }

  const totalDue = fromCents(dueCents)
  const totalPaid = fromCents(paidCents)
  const recoveryRate =
    totalDue > 0
      ? Math.round((totalPaid / totalDue) * 100)
      : totalPaid > 0
      ? 100
      : 0

  const date = parseISODate(currentPeriod)
  const monthLabel = format(date, "MMMM yyyy", { locale: fr })

  return {
    period: currentPeriod,
    monthLabel,
    totalPaid,
    totalDue,
    recoveryRate,
  }
}

/**
 * Computes unpaid/partially paid amounts and number of tenants concerned.
 */
export function computeUnpaidInProgress(
  dues: RentDueOverview[],
  leases?: Lease[]
): DashboardKPIs["unpaidInProgress"] {
  const overdueOrPartial = dues.filter(
    (d) => (d.status === "impaye" || d.status === "partiel") && d.balance > 0
  )

  const leasesMap = leases ? new Map(leases.map((l) => [l.id, l])) : null
  let unpaidCents = 0
  const tenantIds = new Set<string>()

  for (const d of overdueOrPartial) {
    unpaidCents += toCents(d.balance)
    const tId = d.tenant_id || (leasesMap?.get(d.lease_id)?.tenant_id ?? "")
    if (tId) {
      tenantIds.add(tId)
    }
  }

  return {
    totalUnpaid: fromCents(unpaidCents),
    tenantCount: tenantIds.size,
    overdueCount: overdueOrPartial.length,
  }
}

/**
 * Computes occupation rate: active leases / non-archived properties.
 */
export function computeOccupationRate(
  properties: Property[],
  leases: Lease[]
): DashboardKPIs["occupationRate"] {
  const activeProperties = properties.filter((p) => p.archived_at === null)
  const activePropIds = new Set(activeProperties.map((p) => p.id))

  // Leases with active status whose property is not archived
  const activeLeasedPropIds = new Set<string>()
  for (const l of leases) {
    if (l.status === "actif" && activePropIds.has(l.property_id)) {
      activeLeasedPropIds.add(l.property_id)
    }
  }

  const totalCount = activeProperties.length
  const occupiedCount = activeLeasedPropIds.size
  const rate =
    totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0

  return {
    occupiedCount,
    totalCount,
    rate,
  }
}

/**
 * Computes collections from Jan 1st up to today and compares to the exact same period last year.
 */
export function computeYearToDate(
  payments: Payment[],
  today: string
): DashboardKPIs["yearToDate"] {
  const { year, month, day } = parseISODateParts(today)
  const prevYear = year - 1

  const currentYearStart = `${year}-01-01`
  const prevYearStart = `${prevYear}-01-01`
  const prevYearSameDay = `${prevYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  let currentCents = 0
  let prevCents = 0

  for (const p of payments) {
    if (p.paid_at >= currentYearStart && p.paid_at <= today) {
      currentCents += toCents(p.amount)
    } else if (p.paid_at >= prevYearStart && p.paid_at <= prevYearSameDay) {
      prevCents += toCents(p.amount)
    }
  }

  const totalPaid = fromCents(currentCents)
  const previousYearTotalPaid = fromCents(prevCents)

  let changePercentage: number | null = null
  if (previousYearTotalPaid === 0) {
    if (totalPaid > 0) {
      changePercentage = 100
    } else {
      changePercentage = null
    }
  } else {
    changePercentage = Math.round(
      ((totalPaid - previousYearTotalPaid) / previousYearTotalPaid) * 100
    )
  }

  return {
    year,
    totalPaid,
    previousYearTotalPaid,
    changePercentage,
  }
}

/**
 * Computes 12 rolling months series for Recharts bar chart.
 * Encaissé = sum of payments whose paid_at falls within the calendar month.
 * Attendu = sum of rent_dues total_amount whose period matches YYYY-MM-01.
 */
export function compute12RollingMonthsSeries(
  today: string,
  dues: RentDueOverview[],
  payments: Payment[]
): DashboardChartPoint[] {
  const currentPeriod = toPeriod(today)

  // Generate 12 months periods from M-11 to M
  const periods: string[] = []
  for (let i = 11; i >= 0; i--) {
    periods.push(addMonthsToPeriod(currentPeriod, -i))
  }

  return periods.map((period) => {
    const monthKey = period.slice(0, 7) // 'YYYY-MM'
    const date = parseISODate(period)

    // Capitalize short label e.g. "Nov.", "Déc."
    const rawLabel = format(date, "MMM", { locale: fr })
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
    const fullLabel = format(date, "MMMM yyyy", { locale: fr })

    // Expected dues
    let dueCents = 0
    for (const d of dues) {
      if (d.period === period) {
        dueCents += toCents(d.total_amount)
      }
    }

    // Collected payments in this calendar month
    let paidCents = 0
    for (const p of payments) {
      if (p.paid_at.startsWith(monthKey)) {
        paidCents += toCents(p.amount)
      }
    }

    const attendu = fromCents(dueCents)
    const encaisse = fromCents(paidCents)
    const recoveryRate =
      attendu > 0
        ? Math.round((encaisse / attendu) * 100)
        : encaisse > 0
        ? 100
        : 0

    return {
      monthKey,
      period,
      label,
      fullLabel,
      attendu,
      encaisse,
      recoveryRate,
    }
  })
}

/**
 * Computes reminder items: overdue or partial dues sorted by days_late descending (up to limit).
 */
export function computeReminders(
  dues: RentDueOverview[],
  leases: Lease[],
  tenants: Tenant[],
  properties: Property[],
  limit: number = 6
): DashboardReminderItem[] {
  const leasesMap = new Map(leases.map((l) => [l.id, l]))
  const tenantsMap = new Map(tenants.map((t) => [t.id, t]))
  const propertiesMap = new Map(properties.map((p) => [p.id, p]))

  const overdue = dues
    .filter(
      (d) => (d.status === "impaye" || d.status === "partiel") && d.balance > 0
    )
    .sort((a, b) => {
      if (b.days_late !== a.days_late) {
        return b.days_late - a.days_late
      }
      return b.balance - a.balance
    })
    .slice(0, limit)

  return overdue.map((due) => {
    const lease = leasesMap.get(due.lease_id) || null
    const tenant = due.tenant_id
      ? tenantsMap.get(due.tenant_id) || null
      : lease?.tenant_id
      ? tenantsMap.get(lease.tenant_id) || null
      : null
    const property = due.property_id
      ? propertiesMap.get(due.property_id) || null
      : lease?.property_id
      ? propertiesMap.get(lease.property_id) || null
      : null

    return {
      due,
      tenant,
      property,
      lease,
    }
  })
}

/**
 * Computes upcoming dues for the next N days (default 7 days).
 */
export function computeUpcomingDues(
  dues: RentDueOverview[],
  leases: Lease[],
  tenants: Tenant[],
  properties: Property[],
  today: string,
  days: number = 7
): DashboardUpcomingItem[] {
  const todayDate = parseISODate(today)
  const maxDateObj = addDays(todayDate, days)
  const maxDate = format(maxDateObj, "yyyy-MM-dd")

  const leasesMap = new Map(leases.map((l) => [l.id, l]))
  const tenantsMap = new Map(tenants.map((t) => [t.id, t]))
  const propertiesMap = new Map(properties.map((p) => [p.id, p]))

  const upcoming = dues
    .filter((d) => d.due_date >= today && d.due_date <= maxDate)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  return upcoming.map((due) => {
    const lease = leasesMap.get(due.lease_id) || null
    const tenant = due.tenant_id
      ? tenantsMap.get(due.tenant_id) || null
      : lease?.tenant_id
      ? tenantsMap.get(lease.tenant_id) || null
      : null
    const property = due.property_id
      ? propertiesMap.get(due.property_id) || null
      : lease?.property_id
      ? propertiesMap.get(lease.property_id) || null
      : null

    return {
      due,
      tenant,
      property,
      lease,
    }
  })
}

/**
 * Computes active leases expiring within the next N days (default 90 days).
 */
export function computeExpiringLeases(
  leases: Lease[],
  properties: Property[],
  tenants: Tenant[],
  today: string,
  days: number = 90
): DashboardExpiringLeaseItem[] {
  const todayDate = parseISODate(today)
  const maxDateObj = addDays(todayDate, days)
  const maxDate = format(maxDateObj, "yyyy-MM-dd")

  const propertiesMap = new Map(properties.map((p) => [p.id, p]))
  const tenantsMap = new Map(tenants.map((t) => [t.id, t]))

  const expiring = leases
    .filter(
      (l) =>
        l.status === "actif" &&
        l.end_date !== null &&
        l.end_date >= today &&
        l.end_date <= maxDate
    )
    .map((l) => {
      const endDate = parseISODate(l.end_date!)
      const daysUntilEnd = differenceInCalendarDays(endDate, todayDate)
      return {
        lease: l,
        property: propertiesMap.get(l.property_id) || null,
        tenant: tenantsMap.get(l.tenant_id) || null,
        daysUntilEnd,
      }
    })
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd)

  return expiring
}

/**
 * Computes onboarding checklist status.
 */
export function computeOnboardingStatus(
  properties: Property[],
  tenants: Tenant[],
  leases: Lease[],
  payments: Payment[]
): DashboardOnboardingStatus {
  const hasProperties = properties.length > 0
  const hasTenants = tenants.length > 0
  const hasLeases = leases.length > 0
  const hasPayments = payments.length > 0

  const completedCount = [
    hasProperties,
    hasTenants,
    hasLeases,
    hasPayments,
  ].filter(Boolean).length

  return {
    hasProperties,
    hasTenants,
    hasLeases,
    hasPayments,
    completedCount,
  }
}

/**
 * Aggregates all dashboard domain calculations into a single structure.
 */
export function buildDashboardData(params: {
  today: string
  properties: Property[]
  tenants: Tenant[]
  leases: Lease[]
  payments: Payment[]
  duesOverviews: RentDueOverview[]
}): DashboardCalculatedData {
  const { today, properties, tenants, leases, payments, duesOverviews } = params
  const currentPeriod = toPeriod(today)

  const hasLeases = leases.length > 0
  const onboarding = computeOnboardingStatus(
    properties,
    tenants,
    leases,
    payments
  )

  const currentMonth = computeCurrentMonthKPI(duesOverviews, currentPeriod)
  const unpaidInProgress = computeUnpaidInProgress(duesOverviews, leases)
  const occupationRate = computeOccupationRate(properties, leases)
  const yearToDate = computeYearToDate(payments, today)

  const chartSeries = compute12RollingMonthsSeries(today, duesOverviews, payments)
  const reminders = computeReminders(duesOverviews, leases, tenants, properties, 6)
  const upcomingDues = computeUpcomingDues(
    duesOverviews,
    leases,
    tenants,
    properties,
    today,
    7
  )
  const expiringLeases = computeExpiringLeases(
    leases,
    properties,
    tenants,
    today,
    90
  )

  return {
    today,
    hasLeases,
    onboarding,
    kpis: {
      currentMonth,
      unpaidInProgress,
      occupationRate,
      yearToDate,
    },
    chartSeries,
    reminders,
    upcomingDues,
    expiringLeases,
  }
}
