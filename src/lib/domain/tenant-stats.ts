import type { RentDueOverview } from "../data/types"
import { toCents, fromCents } from "../format"
import { todayISO, toPeriod, addMonthsToPeriod } from "../format"

export interface TenantStats {
  total_paid: number
  balance_due: number
  late_count_12m: number
  avg_payment_delay_days: number | null
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map((v) => parseInt(v, 10))
  return { year: y, month: m, day: d }
}

export function diffInCalendarDays(fromStr: string, toStr: string): number {
  const from = parseDateParts(fromStr)
  const to = parseDateParts(toStr)
  const utcFrom = Date.UTC(from.year, from.month - 1, from.day)
  const utcTo = Date.UTC(to.year, to.month - 1, to.day)
  return Math.floor((utcTo - utcFrom) / (1000 * 60 * 60 * 24))
}

/**
 * 1. Total payé depuis le début par le locataire (somme des montants réglés).
 */
export function computeTenantTotalPaid(overviews: RentDueOverview[]): number {
  let totalCents = 0
  for (const due of overviews) {
    totalCents += toCents(due.paid_amount || 0)
  }
  return fromCents(totalCents)
}

/**
 * 2. Solde dû actuel (somme des balances positives).
 */
export function computeTenantBalanceDue(overviews: RentDueOverview[]): number {
  let balanceCents = 0
  for (const due of overviews) {
    if (due.balance > 0) {
      balanceCents += toCents(due.balance)
    }
  }
  return fromCents(balanceCents)
}

/**
 * 3. Nombre de retards sur les 12 derniers mois.
 * Un loyer est considéré en retard si :
 * - Il a été soldé avec du retard (last_paid_at > due_date), OU
 * - Il est actuellement impayé/partiel et la date d'échéance est dépassée (due_date < today et balance > 0).
 */
export function computeTenantLateCount12Months(
  overviews: RentDueOverview[],
  today: string = todayISO()
): number {
  const currentPeriod = toPeriod(today)
  const twelveMonthsAgoPeriod = addMonthsToPeriod(currentPeriod, -11)

  const relevant = overviews.filter(
    (o) => o.period >= twelveMonthsAgoPeriod && o.period <= currentPeriod
  )

  let lateCount = 0
  for (const due of relevant) {
    const isPaidLate =
      due.last_paid_at !== null && due.last_paid_at.slice(0, 10) > due.due_date

    const isCurrentlyLate =
      due.balance > 0 && due.due_date < today

    if (isPaidLate || isCurrentlyLate) {
      lateCount++
    }
  }

  return lateCount
}

/**
 * 4. Délai moyen de paiement en jours pour chaque échéance soldée.
 * Nombre de jours entre due_date et le dernier paiement de chaque échéance entièrement réglée.
 * Renvoie un entier positif (en retard), 0 (à l'heure), négatif (en avance), ou null s'il n'y a aucune échéance soldée.
 */
export function computeTenantAvgPaymentDelayDays(
  overviews: RentDueOverview[]
): number | null {
  // Échéances soldées (solde = 0) avec date de paiement connue
  const settledDues = overviews.filter(
    (o) => (o.status === "paye" || o.balance === 0) && o.last_paid_at !== null
  )

  if (settledDues.length === 0) {
    return null
  }

  let totalDelayDays = 0
  for (const due of settledDues) {
    const delay = diffInCalendarDays(due.due_date, due.last_paid_at!)
    totalDelayDays += delay
  }

  return Math.round(totalDelayDays / settledDues.length)
}

/**
 * Regroupe le calcul des 4 indicateurs pour un locataire.
 */
export function computeTenantStats(
  overviews: RentDueOverview[],
  today: string = todayISO()
): TenantStats {
  return {
    total_paid: computeTenantTotalPaid(overviews),
    balance_due: computeTenantBalanceDue(overviews),
    late_count_12m: computeTenantLateCount12Months(overviews, today),
    avg_payment_delay_days: computeTenantAvgPaymentDelayDays(overviews),
  }
}
