import { describe, it, expect } from "vitest"
import {
  createExpense,
  getExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
} from "./expenses"
import { ValidationError, NotFoundError } from "./errors"

describe("src/lib/data/expenses - Couche de données Dépenses & Travaux", () => {
  const ownerA = "owner-exp-test-a"
  const ownerB = "owner-exp-test-b"

  it("crée une dépense avec succès et valide le montant positif", async () => {
    const expense = await createExpense(ownerA, {
      property_id: null,
      category: "eau_electricite",
      description: "Recharge compteur Edan SEEG",
      amount: 25000,
      date: "2026-10-15",
      payment_method: "mobile_money",
      receipt_url: null,
      notes: "Achat unité Edan pour parties communes",
    })

    expect(expense.id).toBeDefined()
    expect(expense.owner_id).toBe(ownerA)
    expect(expense.category).toBe("eau_electricite")
    expect(expense.amount).toBe(25000)
    expect(expense.payment_method).toBe("mobile_money")

    // Montant <= 0 doit lever une ValidationError
    await expect(
      createExpense(ownerA, {
        property_id: null,
        category: "autre",
        description: "Test invalide",
        amount: 0,
        date: "2026-10-15",
        payment_method: "especes",
        receipt_url: null,
        notes: null,
      })
    ).rejects.toThrow(ValidationError)
  })

  it("liste et filtre les dépenses par propriétaire, catégorie, et date", async () => {
    const exp1 = await createExpense(ownerA, {
      property_id: null,
      category: "vidange_assainissement",
      description: "Vidange fosse septique",
      amount: 80000,
      date: "2026-09-10",
      payment_method: "especes",
      receipt_url: null,
      notes: null,
    })

    const exp2 = await createExpense(ownerA, {
      property_id: null,
      category: "reparations_travaux",
      description: "Remplacement robinetterie",
      amount: 35000,
      date: "2026-10-05",
      payment_method: "mobile_money",
      receipt_url: null,
      notes: null,
    })

    // Dépense propriétaire B qui ne doit pas fuiter
    await createExpense(ownerB, {
      property_id: null,
      category: "autre",
      description: "Dépense tierce",
      amount: 10000,
      date: "2026-10-05",
      payment_method: "especes",
      receipt_url: null,
      notes: null,
    })

    // Liste totale pour ownerA
    const allA = await listExpenses(ownerA)
    expect(allA.some((e) => e.id === exp1.id)).toBe(true)
    expect(allA.some((e) => e.id === exp2.id)).toBe(true)
    expect(allA.every((e) => e.owner_id === ownerA)).toBe(true)

    // Filtrage par catégorie
    const vidanges = await listExpenses(ownerA, { category: "vidange_assainissement" })
    expect(vidanges.some((e) => e.id === exp1.id)).toBe(true)
    expect(vidanges.some((e) => e.id === exp2.id)).toBe(false)

    // Filtrage par mois
    const octExpenses = await listExpenses(ownerA, { year: 2026, month: 10 })
    expect(octExpenses.some((e) => e.id === exp2.id)).toBe(true)
    expect(octExpenses.some((e) => e.id === exp1.id)).toBe(false)
  })

  it("met à jour et supprime une dépense", async () => {
    const created = await createExpense(ownerA, {
      property_id: null,
      category: "impots_taxes",
      description: "CFPB Taxe foncière",
      amount: 50000,
      date: "2026-08-01",
      payment_method: "cheque",
      receipt_url: null,
      notes: null,
    })

    const updated = await updateExpense(ownerA, created.id, {
      amount: 55000,
      notes: "Quittance mairie reçue",
    })
    expect(updated.amount).toBe(55000)
    expect(updated.notes).toBe("Quittance mairie reçue")

    await deleteExpense(ownerA, created.id)
    const afterDelete = await getExpense(ownerA, created.id)
    expect(afterDelete).toBeNull()

    // Tentative de suppression d'une dépense inexistante
    await expect(deleteExpense(ownerA, "non-existent-id")).rejects.toThrow(NotFoundError)
  })
})
