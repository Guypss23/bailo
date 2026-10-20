import type { Lease, Payment, RentDueOverview, Tenant, Property, Profile } from "../data/types"
import { toCents, fromCents } from "./money"
import { formatDate, formatPeriod, parseISODateParts } from "../format"

export interface StatementEntry {
  id: string
  date: string // 'YYYY-MM-DD'
  formattedDate: string
  type: "due" | "payment"
  description: string
  detail?: string
  
  // Chronological Ledger Columns (as in the tenant's sheet)
  dueAmount: number // Loyer dû (nouveau mois)
  previousBalance: number // Reliquat précédent
  totalDue: number // Total dû = Reliquat précédent + Loyer dû
  receivedAmount: number // Montant reçu
  remainingBalance: number // Solde restant (reliquat)
  
  // Metadata for transparency
  actualDepositDate?: string // Date effective de versement
  targetPeriod?: string // Période de loyer couverte ('YYYY-MM-01')
  paymentMethod?: string
  paymentReference?: string | null
}

export interface TenantStatement {
  tenant: Tenant
  lease: Lease | null
  property: Property | null
  entries: StatementEntry[]
  totalBilled: number
  totalPaid: number
  currentBalance: number
  entriesCount: number
}

interface BuildStatementParams {
  tenant: Tenant
  lease: Lease | null
  property: Property | null
  dues: RentDueOverview[]
  payments: Payment[]
}

/**
 * Builds the chronological running balance ledger (Relevé de compte) for a tenant.
 * Interleaves Rent Dues (debits) and actual Payments (credits) by date,
 * recording both the actual deposit date and the allocated period.
 */
export function buildTenantStatement({
  tenant,
  lease,
  property,
  dues,
  payments,
}: BuildStatementParams): TenantStatement {
  const duesMap = new Map<string, RentDueOverview>(dues.map((d) => [d.id, d]))

  // Raw chronological events
  interface RawEvent {
    id: string
    date: string // ISO 'YYYY-MM-DD'
    type: "due" | "payment"
    amount: number
    due?: RentDueOverview
    payment?: Payment
  }

  const events: RawEvent[] = []

  // 1. Rent Due events (created on due_date)
  for (const due of dues) {
    events.push({
      id: `due-${due.id}`,
      date: due.due_date,
      type: "due",
      amount: due.total_amount,
      due,
    })
  }

  // 2. Payment events (created on actual payment paid_at date)
  for (const payment of payments) {
    const matchingDue = duesMap.get(payment.rent_due_id)
    events.push({
      id: `payment-${payment.id}`,
      date: payment.paid_at,
      type: "payment",
      amount: payment.amount,
      payment,
      due: matchingDue,
    })
  }

  // 3. Sort chronologically:
  // - Ascending by date
  // - If identical date: 'due' comes before 'payment' so debt is established first
  events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    if (a.type !== b.type) {
      return a.type === "due" ? -1 : 1
    }
    return a.id.localeCompare(b.id)
  })

  // 4. Calculate running balances in strict integer cents
  let runningBalanceCents = 0
  let totalBilledCents = 0
  let totalPaidCents = 0

  const entries: StatementEntry[] = []

  for (const ev of events) {
    const prevBalanceCents = runningBalanceCents

    if (ev.type === "due" && ev.due) {
      const dueAmountCents = toCents(ev.amount)
      const totalDueCents = prevBalanceCents + dueAmountCents
      runningBalanceCents = totalDueCents
      totalBilledCents += dueAmountCents

      const periodParts = parseISODateParts(ev.due.period)
      const monthLabel = formatPeriod(ev.due.period)

      let desc = `Loyer dû : ${monthLabel}`
      if (prevBalanceCents > 0) {
        desc = `Loyer dû : ${monthLabel} (reliquat antérieur inclus)`
      }

      entries.push({
        id: ev.id,
        date: ev.date,
        formattedDate: formatDate(ev.date),
        type: "due",
        description: desc,
        detail: `Échéance du ${formatDate(ev.due.due_date)}`,
        dueAmount: ev.amount,
        previousBalance: fromCents(prevBalanceCents),
        totalDue: fromCents(totalDueCents),
        receivedAmount: 0,
        remainingBalance: fromCents(runningBalanceCents),
        targetPeriod: ev.due.period,
      })
    } else if (ev.type === "payment" && ev.payment) {
      const paymentAmountCents = toCents(ev.amount)
      const remainingCents = prevBalanceCents - paymentAmountCents
      runningBalanceCents = remainingCents
      totalPaidCents += paymentAmountCents

      const payment = ev.payment
      const due = ev.due
      const depositDateFormatted = formatDate(payment.paid_at)

      // Descriptive label explaining exactly when deposited and what period was credited
      let description = "Paiement reçu"
      let detail: string | undefined = undefined

      if (due) {
        const periodMonth = formatPeriod(due.period)
        const paymentMonth = payment.paid_at.slice(0, 7)
        const dueMonth = due.period.slice(0, 7)

        if (paymentMonth === dueMonth) {
          description = `Paiement reçu (${periodMonth})`
        } else if (paymentMonth > dueMonth) {
          // Deposited later than the due month
          description = `Paiement reçu : ${depositDateFormatted} (imputé sur loyer ${periodMonth})`
        } else {
          // Deposited earlier (advance payment)
          description = `Paiement anticipé : ${depositDateFormatted} (avance sur loyer ${periodMonth})`
        }

        const methodLabel = payment.method ? payment.method.replace("_", " ") : "règlement"
        const refPart = payment.reference ? ` · Réf: ${payment.reference}` : ""
        detail = `Dépôt réel le ${depositDateFormatted} (${methodLabel}${refPart})`
      } else {
        detail = `Dépôt réel le ${depositDateFormatted}`
      }

      entries.push({
        id: ev.id,
        date: ev.date,
        formattedDate: depositDateFormatted,
        type: "payment",
        description,
        detail,
        dueAmount: 0,
        previousBalance: fromCents(prevBalanceCents),
        totalDue: fromCents(prevBalanceCents),
        receivedAmount: ev.amount,
        remainingBalance: fromCents(runningBalanceCents),
        actualDepositDate: payment.paid_at,
        targetPeriod: due?.period,
        paymentMethod: payment.method,
        paymentReference: payment.reference,
      })
    }
  }

  return {
    tenant,
    lease,
    property,
    entries,
    totalBilled: fromCents(totalBilledCents),
    totalPaid: fromCents(totalPaidCents),
    currentBalance: fromCents(runningBalanceCents),
    entriesCount: entries.length,
  }
}
