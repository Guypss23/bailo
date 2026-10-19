import { describe, it, expect } from "vitest"
import {
  paymentSchema,
  updatePaymentSchema,
  bulkPaymentsSchema,
} from "@/lib/validations/payment"
import {
  createProperty,
  createTenant,
  createLease,
  generateRentDues,
  listEnrichedDueOverviews,
  createPayment,
  updatePayment,
  createBulkPayments,
  deletePayment,
} from "@/lib/data"

describe("src/lib/validations/payment", () => {
  it("validates a valid payment", () => {
    const valid = {
      rent_due_id: "due-uuid-1",
      amount: 450000,
      paid_at: "2026-10-05",
      method: "virement",
      reference: "VIR-94821",
      note: "Paiement en ligne",
    }

    const res = paymentSchema.safeParse(valid)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.amount).toBe(450000)
      expect(res.data.method).toBe("virement")
      expect(res.data.reference).toBe("VIR-94821")
      expect(res.data.note).toBe("Paiement en ligne")
    }
  })

  it("fails if amount is non-positive or zero", () => {
    const zero = {
      rent_due_id: "due-uuid-1",
      amount: 0,
      paid_at: "2026-10-05",
      method: "virement",
    }
    const negative = {
      rent_due_id: "due-uuid-1",
      amount: -100,
      paid_at: "2026-10-05",
      method: "especes",
    }

    expect(paymentSchema.safeParse(zero).success).toBe(false)
    expect(paymentSchema.safeParse(negative).success).toBe(false)
  })

  it("fails if date format is invalid", () => {
    const invalidDate = {
      rent_due_id: "due-uuid-1",
      amount: 50000,
      paid_at: "05/10/2026",
      method: "virement",
    }
    expect(paymentSchema.safeParse(invalidDate).success).toBe(false)
  })

  it("validates updatePaymentSchema and bulkPaymentsSchema", () => {
    const updateValid = {
      id: "pay-1",
      rent_due_id: "due-uuid-1",
      amount: 300000,
      paid_at: "2026-10-06",
      method: "mobile_money",
    }
    expect(updatePaymentSchema.safeParse(updateValid).success).toBe(true)

    const bulkValid = { due_ids: ["due-1", "due-2"] }
    const bulkEmpty = { due_ids: [] }
    expect(bulkPaymentsSchema.safeParse(bulkValid).success).toBe(true)
    expect(bulkPaymentsSchema.safeParse(bulkEmpty).success).toBe(false)
  })
})

describe("listEnrichedDueOverviews & payment operations", () => {
  it("enriches rent dues with tenant, property, lease, and payments in a single call", async () => {
    const owner = "owner-loyers-test-" + Date.now()

    const prop = await createProperty(owner, {
      name: "Résidence Haut de Gué-Gué",
      type: "appartement",
      address_line1: "Rue 14",
      address_line2: null,
      postal_code: "BP 100",
      city: "Libreville",
      country: "GA",
      surface_m2: 60,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(owner, {
      first_name: "Boris",
      last_name: "Kombila",
      email: "boris@example.com",
      phone: "+241 77 00 00 00",
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(owner, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-09-01",
      end_date: null,
      rent_amount: 300000,
      charges_amount: 20000,
      deposit_amount: 300000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
    })

    // Generate dues up to 2026-10-01
    await generateRentDues(owner, "2026-10-01")

    // Retrieve enriched dues for 2026-09-01
    let enriched = await listEnrichedDueOverviews(owner, { period: "2026-09-01" })
    expect(enriched).toHaveLength(1)
    expect(enriched[0].property?.name).toBe("Résidence Haut de Gué-Gué")
    expect(enriched[0].tenant?.first_name).toBe("Boris")
    expect(enriched[0].lease?.id).toBe(lease.id)
    expect(enriched[0].total_amount).toBe(320000)
    expect(enriched[0].paid_amount).toBe(0)
    expect(enriched[0].balance).toBe(320000)
    expect(enriched[0].payments).toHaveLength(0)

    // Record a partial payment
    const payment = await createPayment(owner, {
      rent_due_id: enriched[0].id,
      amount: 120000,
      paid_at: "2026-09-05",
      method: "virement",
      reference: "PART-1",
      note: "Acompte",
    })

    enriched = await listEnrichedDueOverviews(owner, { period: "2026-09-01" })
    expect(enriched[0].paid_amount).toBe(120000)
    expect(enriched[0].balance).toBe(200000)
    expect(enriched[0].status).toBe("partiel")
    expect(enriched[0].payments).toHaveLength(1)
    expect(enriched[0].payments[0].id).toBe(payment.id)

    // Update payment
    await updatePayment(owner, payment.id, {
      amount: 150000,
    })
    enriched = await listEnrichedDueOverviews(owner, { period: "2026-09-01" })
    expect(enriched[0].paid_amount).toBe(150000)
    expect(enriched[0].balance).toBe(170000)

    // Delete payment
    await deletePayment(owner, payment.id)
    enriched = await listEnrichedDueOverviews(owner, { period: "2026-09-01" })
    expect(enriched[0].paid_amount).toBe(0)
    expect(enriched[0].balance).toBe(320000)
    expect(enriched[0].payments).toHaveLength(0)
  })

  it("processes bulk payments atomically", async () => {
    const owner = "owner-bulk-test-" + Date.now()

    const prop = await createProperty(owner, {
      name: "Studio Akébé",
      type: "studio",
      address_line1: "Akébé Plaine",
      address_line2: null,
      postal_code: "BP 200",
      city: "Libreville",
      country: "GA",
      surface_m2: 30,
      notes: null,
      archived_at: null,
    })

    const tenant = await createTenant(owner, {
      first_name: "Carine",
      last_name: "Mengue",
      email: null,
      phone: null,
      notes: null,
      archived_at: null,
    })

    const lease = await createLease(owner, {
      property_id: prop.id,
      tenant_id: tenant.id,
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 150000,
      charges_amount: 10000,
      deposit_amount: 150000,
      due_day: 1,
      payment_method: "especes",
      notes: null,
    })

    await generateRentDues(owner, "2026-02-01")
    const dues = await listEnrichedDueOverviews(owner)
    expect(dues.length).toBeGreaterThanOrEqual(2)

    const due1 = dues[0]
    const due2 = dues[1]

    const bulkPayments = await createBulkPayments(owner, [
      {
        rent_due_id: due1.id,
        amount: due1.balance,
        method: "especes",
        paid_at: "2026-02-01",
        reference: "BULK-1",
      },
      {
        rent_due_id: due2.id,
        amount: due2.balance,
        method: "especes",
        paid_at: "2026-02-01",
        reference: "BULK-2",
      },
    ])

    expect(bulkPayments).toHaveLength(2)

    const afterBulk = await listEnrichedDueOverviews(owner)
    const paid1 = afterBulk.find((d) => d.id === due1.id)
    const paid2 = afterBulk.find((d) => d.id === due2.id)

    expect(paid1?.status).toBe("paye")
    expect(paid1?.balance).toBe(0)
    expect(paid2?.status).toBe("paye")
    expect(paid2?.balance).toBe(0)
  })
})
