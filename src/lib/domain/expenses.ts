import type { Expense, ExpenseCategory, Payment, Property, RentDue } from "@/lib/data/types"
import { toCents, fromCents } from "@/lib/format"

export type { ExpenseCategory }

export interface ExpenseCategoryMeta {
  key: ExpenseCategory
  label: string
  shortLabel: string
  description: string
  color: string // Tailwind color class or hex badge
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  eau_electricite: {
    key: "eau_electricite",
    label: "Eau & Électricité (SEEG / Edan)",
    shortLabel: "SEEG / Edan",
    description: "Recharges compteurs Edan, factures d'eau et d'électricité des communs",
    color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  vidange_assainissement: {
    key: "vidange_assainissement",
    label: "Vidange & Assainissement",
    shortLabel: "Vidange fosse",
    description: "Vidange de fosse septique, curage des regards et caniveaux",
    color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  reparations_travaux: {
    key: "reparations_travaux",
    label: "Réparations & Travaux",
    shortLabel: "Travaux / Dépannage",
    description: "Plomberie, climatisation, étanchéité, serrurerie, peinture",
    color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  impots_taxes: {
    key: "impots_taxes",
    label: "Impôts & Taxes foncières",
    shortLabel: "CFPB / Impôts",
    description: "CFPB, taxe municipale, impôt foncier des bailleurs",
    color: "text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  entretien_gardiennage: {
    key: "entretien_gardiennage",
    label: "Entretien & Gardiennage",
    shortLabel: "Gardien / Ménage",
    description: "Gardiennage de nuit/jour, nettoyage des cours et parties communes",
    color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  gestion_assurance: {
    key: "gestion_assurance",
    label: "Gestion & Assurance",
    shortLabel: "Frais & Assurance",
    description: "Frais bancaires, assurance propriétaire non occupant (PNO)",
    color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  autre: {
    key: "autre",
    label: "Autre dépense",
    shortLabel: "Autre",
    description: "Dépenses diverses liées au patrimoine locatif",
    color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700",
  },
}

export interface CategoryBreakdown {
  category: ExpenseCategory
  meta: ExpenseCategoryMeta
  totalCents: number
  totalAmount: number
  percentage: number // 0 à 100
  count: number
}

export interface PropertyNetYield {
  propertyId: string
  propertyName: string
  rentCollectedCents: number
  rentCollectedAmount: number
  expensesCents: number
  expensesAmount: number
  netIncomeCents: number
  netIncomeAmount: number
  netYieldRatio: number // net / rent collected (ou 0 si pas de rent)
}

export interface MonthlyNetYield {
  month: number // 1 à 12
  monthKey: string // 'YYYY-MM'
  monthLabel: string // 'Janvier', 'Février', etc.
  rentCollectedCents: number
  rentCollectedAmount: number
  expensesCents: number
  expensesAmount: number
  netIncomeCents: number
  netIncomeAmount: number
}

export interface NetYieldSummary {
  // Période analysée
  year: number
  month?: number // optionnel si filtré par mois

  // Totaux globaux en centimes et montants
  rentCollectedCents: number
  rentCollectedAmount: number
  expensesCents: number
  expensesAmount: number
  netIncomeCents: number
  netIncomeAmount: number

  // Ratios
  expenseRatio: number // (dépenses / loyers perçus) * 100
  profitMargin: number // (bénéfice net / loyers perçus) * 100

  // Répartitions
  categoryBreakdown: CategoryBreakdown[]
  propertyBreakdown: PropertyNetYield[]
  monthlyBreakdown: MonthlyNetYield[]
}

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

/**
 * Calcule le bilan financier et le rendement net (loyers perçus - dépenses)
 * pour une année donnée et éventuellement un mois spécifique.
 */
export function calculateNetYield(params: {
  year: number
  month?: number
  expenses: Expense[]
  payments: Payment[]
  properties: Property[]
  rentDues?: RentDue[]
}): NetYieldSummary {
  const { year, month, expenses, payments, properties, rentDues = [] } = params

  // Créer une map id de rent_due -> property_id via les leases si disponible
  // Pour savoir quel paiement appartient à quel bien immobilier
  const rentDueMap = new Map<string, RentDue>()
  for (const rd of rentDues) {
    rentDueMap.set(rd.id, rd)
  }

  // Filtrer les dépenses selon l'année (et le mois si spécifié)
  const filteredExpenses = expenses.filter((e) => {
    if (!e.date) return false
    const [expYear, expMonth] = e.date.split("-").map(Number)
    if (expYear !== year) return false
    if (month && expMonth !== month) return false
    return true
  })

  // Filtrer les paiements reçus selon la date de paiement (paid_at)
  const filteredPayments = payments.filter((p) => {
    if (!p.paid_at) return false
    const datePart = p.paid_at.split("T")[0]
    const [pYear, pMonth] = datePart.split("-").map(Number)
    if (pYear !== year) return false
    if (month && pMonth !== month) return false
    return true
  })

  // Calcul du loyer perçu total en centimes
  const rentCollectedCents = filteredPayments.reduce(
    (sum, p) => sum + toCents(p.amount),
    0
  )

  // Calcul des dépenses totales en centimes
  const expensesCents = filteredExpenses.reduce(
    (sum, e) => sum + toCents(e.amount),
    0
  )

  // Bénéfice net
  const netIncomeCents = rentCollectedCents - expensesCents

  // Ratios
  const expenseRatio =
    rentCollectedCents > 0
      ? Math.round((expensesCents / rentCollectedCents) * 1000) / 10
      : 0
  const profitMargin =
    rentCollectedCents > 0
      ? Math.round((netIncomeCents / rentCollectedCents) * 1000) / 10
      : 0

  // 1. Répartition par catégorie de dépenses
  const catSums = new Map<ExpenseCategory, { cents: number; count: number }>()
  for (const cat of Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]) {
    catSums.set(cat, { cents: 0, count: 0 })
  }

  for (const exp of filteredExpenses) {
    const current = catSums.get(exp.category) ?? { cents: 0, count: 0 }
    catSums.set(exp.category, {
      cents: current.cents + toCents(exp.amount),
      count: current.count + 1,
    })
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(catSums.entries())
    .map(([category, { cents, count }]) => {
      const percentage =
        expensesCents > 0 ? Math.round((cents / expensesCents) * 1000) / 10 : 0
      return {
        category,
        meta: EXPENSE_CATEGORIES[category],
        totalCents: cents,
        totalAmount: fromCents(cents),
        percentage,
        count,
      }
    })
    .filter((b) => b.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents)

  // 2. Répartition par bien immobilier
  const propMap = new Map<string, Property>()
  for (const p of properties) {
    propMap.set(p.id, p)
  }

  const propStats = new Map<
    string,
    { name: string; rentCents: number; expCents: number }
  >()
  for (const p of properties) {
    propStats.set(p.id, { name: p.name, rentCents: 0, expCents: 0 })
  }
  // Cas pour les dépenses non rattachées à un bien particulier (dépenses générales)
  propStats.set("general", {
    name: "Frais généraux (non rattachés)",
    rentCents: 0,
    expCents: 0,
  })

  // Dépenses par bien
  for (const exp of filteredExpenses) {
    const key = exp.property_id && propStats.has(exp.property_id) ? exp.property_id : "general"
    const current = propStats.get(key)!
    current.expCents += toCents(exp.amount)
  }

  // Paiements par bien (si rent_dues fourni avec lease)
  // On peut mapper payment -> rent_due
  // Note: si le lease ou rent_due n'est pas fourni, le loyer reste au total global
  for (const p of filteredPayments) {
    const due = rentDueMap.get(p.rent_due_id)
    if (due) {
      // Trouver la propriété associée via le lease s'il est résolu
      // (Si non résolu, on ne peut pas ventiler les loyers par bien précisément)
    }
  }

  const propertyBreakdown: PropertyNetYield[] = Array.from(propStats.entries())
    .map(([propertyId, data]) => {
      const netCents = data.rentCents - data.expCents
      return {
        propertyId,
        propertyName: data.name,
        rentCollectedCents: data.rentCents,
        rentCollectedAmount: fromCents(data.rentCents),
        expensesCents: data.expCents,
        expensesAmount: fromCents(data.expCents),
        netIncomeCents: netCents,
        netIncomeAmount: fromCents(netCents),
        netYieldRatio:
          data.rentCents > 0
            ? Math.round((netCents / data.rentCents) * 1000) / 10
            : 0,
      }
    })
    .filter((pb) => pb.expensesCents > 0 || pb.rentCollectedCents > 0)
    .sort((a, b) => b.expensesCents - a.expensesCents)

  // 3. Répartition mensuelle (12 mois de l'année)
  const monthlyBreakdown: MonthlyNetYield[] = []
  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, "0")
    const monthKey = `${year}-${mStr}`

    // Dépenses de ce mois
    const mExpCents = expenses
      .filter((e) => {
        if (!e.date) return false
        const [eY, eM] = e.date.split("-").map(Number)
        return eY === year && eM === m
      })
      .reduce((sum, e) => sum + toCents(e.amount), 0)

    // Paiements de ce mois
    const mPayCents = payments
      .filter((p) => {
        if (!p.paid_at) return false
        const datePart = p.paid_at.split("T")[0]
        const [pY, pM] = datePart.split("-").map(Number)
        return pY === year && pM === m
      })
      .reduce((sum, p) => sum + toCents(p.amount), 0)

    const mNetCents = mPayCents - mExpCents

    monthlyBreakdown.push({
      month: m,
      monthKey,
      monthLabel: MONTH_NAMES[m - 1],
      rentCollectedCents: mPayCents,
      rentCollectedAmount: fromCents(mPayCents),
      expensesCents: mExpCents,
      expensesAmount: fromCents(mExpCents),
      netIncomeCents: mNetCents,
      netIncomeAmount: fromCents(mNetCents),
    })
  }

  return {
    year,
    month,
    rentCollectedCents,
    rentCollectedAmount: fromCents(rentCollectedCents),
    expensesCents,
    expensesAmount: fromCents(expensesCents),
    netIncomeCents,
    netIncomeAmount: fromCents(netIncomeCents),
    expenseRatio,
    profitMargin,
    categoryBreakdown,
    propertyBreakdown,
    monthlyBreakdown,
  }
}
