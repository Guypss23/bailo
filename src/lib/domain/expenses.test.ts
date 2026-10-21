import { describe, it, expect } from "vitest"
import { calculateNetYield, EXPENSE_CATEGORIES } from "./expenses"
import type { Expense, Payment, Property } from "@/lib/data/types"

describe("src/lib/domain/expenses - Calcul du rendement net et ventilation", () => {
  const dummyProperties: Property[] = [
    {
      id: "prop-1",
      owner_id: "owner-1",
      name: "Villa Sablière",
      type: "maison",
      address_line1: "Sablière",
      address_line2: null,
      postal_code: "",
      city: "Libreville",
      country: "GA",
      surface_m2: 250,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "prop-2",
      owner_id: "owner-1",
      name: "Studio Angondjé",
      type: "studio",
      address_line1: "Angondjé",
      address_line2: null,
      postal_code: "",
      city: "Akanda",
      country: "GA",
      surface_m2: 35,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ]

  const dummyExpenses: Expense[] = [
    {
      id: "exp-1",
      owner_id: "owner-1",
      property_id: "prop-1",
      category: "eau_electricite",
      description: "Recharge compteur Edan",
      amount: 30000,
      date: "2026-10-05",
      payment_method: "mobile_money",
      receipt_url: null,
      notes: null,
      created_at: "2026-10-05T10:00:00Z",
    },
    {
      id: "exp-2",
      owner_id: "owner-1",
      property_id: "prop-1",
      category: "vidange_assainissement",
      description: "Vidange fosse septique",
      amount: 70000,
      date: "2026-10-12",
      payment_method: "especes",
      receipt_url: null,
      notes: null,
      created_at: "2026-10-12T10:00:00Z",
    },
    {
      id: "exp-3",
      owner_id: "owner-1",
      property_id: "prop-2",
      category: "reparations_travaux",
      description: "Réparation climatiseur",
      amount: 50000,
      date: "2026-09-15",
      payment_method: "mobile_money",
      receipt_url: null,
      notes: null,
      created_at: "2026-09-15T10:00:00Z",
    },
  ]

  const dummyPayments: Payment[] = [
    {
      id: "pay-1",
      owner_id: "owner-1",
      rent_due_id: "due-1",
      paid_at: "2026-10-02T10:00:00Z",
      amount: 400000,
      method: "virement",
      reference: "VIR-OCT",
      note: null,
      created_at: "2026-10-02T10:00:00Z",
    },
    {
      id: "pay-2",
      owner_id: "owner-1",
      rent_due_id: "due-2",
      paid_at: "2026-09-02T10:00:00Z",
      amount: 400000,
      method: "virement",
      reference: "VIR-SEP",
      note: null,
      created_at: "2026-09-02T10:00:00Z",
    },
  ]

  it("calcule avec précision le rendement net pour un mois précis (Octobre 2026)", () => {
    const summary = calculateNetYield({
      year: 2026,
      month: 10,
      expenses: dummyExpenses,
      payments: dummyPayments,
      properties: dummyProperties,
    })

    // En octobre 2026:
    // Loyers perçus = 400 000 FCFA
    // Dépenses = 30 000 (Edan) + 70 000 (Vidange) = 100 000 FCFA
    // Bénéfice net = 300 000 FCFA
    expect(summary.rentCollectedAmount).toBe(400000)
    expect(summary.expensesAmount).toBe(100000)
    expect(summary.netIncomeAmount).toBe(300000)
    expect(summary.netIncomeCents).toBe(30000000)

    // Ratios:
    // Taux de charge = (100 000 / 400 000) * 100 = 25%
    // Marge nette = (300 000 / 400 000) * 100 = 75%
    expect(summary.expenseRatio).toBe(25)
    expect(summary.profitMargin).toBe(75)

    // Catégories:
    // Vidange (70 000, 70%) puis SEEG (30 000, 30%)
    expect(summary.categoryBreakdown.length).toBe(2)
    expect(summary.categoryBreakdown[0].category).toBe("vidange_assainissement")
    expect(summary.categoryBreakdown[0].totalAmount).toBe(70000)
    expect(summary.categoryBreakdown[0].percentage).toBe(70)
    expect(summary.categoryBreakdown[1].category).toBe("eau_electricite")
    expect(summary.categoryBreakdown[1].totalAmount).toBe(30000)
    expect(summary.categoryBreakdown[1].percentage).toBe(30)
  })

  it("calcule avec précision l'année entière 2026", () => {
    const summary = calculateNetYield({
      year: 2026,
      expenses: dummyExpenses,
      payments: dummyPayments,
      properties: dummyProperties,
    })

    // Sur toute l'année 2026:
    // Loyers perçus = 400 000 + 400 000 = 800 000 FCFA
    // Dépenses = 30 000 + 70 000 + 50 000 = 150 000 FCFA
    // Bénéfice net = 650 000 FCFA
    expect(summary.rentCollectedAmount).toBe(800000)
    expect(summary.expensesAmount).toBe(150000)
    expect(summary.netIncomeAmount).toBe(650000)

    // 12 mois dans monthlyBreakdown
    expect(summary.monthlyBreakdown.length).toBe(12)
    // Septembre: loyer 400 000, dépenses 50 000, net 350 000
    const sep = summary.monthlyBreakdown[8]
    expect(sep.month).toBe(9)
    expect(sep.rentCollectedAmount).toBe(400000)
    expect(sep.expensesAmount).toBe(50000)
    expect(sep.netIncomeAmount).toBe(350000)

    // Octobre: loyer 400 000, dépenses 100 000, net 300 000
    const oct = summary.monthlyBreakdown[9]
    expect(oct.month).toBe(10)
    expect(oct.rentCollectedAmount).toBe(400000)
    expect(oct.expensesAmount).toBe(100000)
    expect(oct.netIncomeAmount).toBe(300000)
  })

  it("gère les cas sans loyers ou sans dépenses sans division par zéro", () => {
    const emptySummary = calculateNetYield({
      year: 2025,
      expenses: [],
      payments: [],
      properties: [],
    })

    expect(emptySummary.rentCollectedAmount).toBe(0)
    expect(emptySummary.expensesAmount).toBe(0)
    expect(emptySummary.netIncomeAmount).toBe(0)
    expect(emptySummary.expenseRatio).toBe(0)
    expect(emptySummary.profitMargin).toBe(0)
    expect(emptySummary.categoryBreakdown).toEqual([])
  })
})
