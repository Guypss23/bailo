import { describe, it, expect } from "vitest"
import { buildTenantStatement } from "./statement"
import type { Tenant, Lease, Property, RentDueOverview, Payment } from "../data/types"

describe("Statement of Account (Relevé de compte chronologique)", () => {
  const dummyTenant: Tenant = {
    id: "tenant-arnaud",
    owner_id: "owner-1",
    first_name: "Arnaud",
    last_name: "Ndong",
    email: "arnaud@example.com",
    phone: "+241 77 00 00 00",
    notes: null,
    archived_at: null,
    created_at: "2025-11-01T00:00:00Z",
  }

  const dummyLease: Lease = {
    id: "lease-1",
    owner_id: "owner-1",
    property_id: "prop-1",
    tenant_id: "tenant-arnaud",
    status: "actif",
    start_date: "2025-11-01",
    end_date: null,
    rent_amount: 50000,
    charges_amount: 0,
    deposit_amount: 50000,
    due_day: 5,
    payment_method: "mobile_money",
    notes: null,
    created_at: "2025-11-01T00:00:00Z",
  }

  const dummyProperty: Property = {
    id: "prop-1",
    owner_id: "owner-1",
    name: "Studio Akébé",
    type: "studio",
    address_line1: "Akébé Plaine",
    address_line2: null,
    postal_code: "",
    city: "Libreville",
    country: "GA",
    surface_m2: 25,
    notes: null,
    archived_at: null,
    created_at: "2025-11-01T00:00:00Z",
  }

  it("calculates exact running balance and preserves deposit dates matching Arnaud's statement (130 000 FCFA remaining)", () => {
    // 10 dues (Nov 2025 to Aug 2026, 50 000 each)
    const periods = [
      { period: "2025-11-01", due_date: "2025-11-15" },
      { period: "2025-12-01", due_date: "2025-12-10" },
      { period: "2026-01-01", due_date: "2026-01-05" },
      { period: "2026-02-01", due_date: "2026-02-05" },
      { period: "2026-03-01", due_date: "2026-03-05" },
      { period: "2026-04-01", due_date: "2026-04-05" },
      { period: "2026-05-01", due_date: "2026-05-05" },
      { period: "2026-06-01", due_date: "2026-06-05" },
      { period: "2026-07-01", due_date: "2026-07-05" },
      { period: "2026-08-01", due_date: "2026-08-05" },
    ]

    const dues: RentDueOverview[] = periods.map((p, idx) => ({
      id: `due-${idx + 1}`,
      owner_id: "owner-1",
      lease_id: "lease-1",
      property_id: "prop-1",
      tenant_id: "tenant-arnaud",
      period: p.period,
      due_date: p.due_date,
      rent_amount: 50000,
      charges_amount: 0,
      total_amount: 50000,
      paid_amount: 0,
      balance: 50000,
      last_paid_at: null,
      status: "impaye",
      days_late: 0,
      note: null,
      created_at: "2025-11-01T00:00:00Z",
    }))

    // 7 irregular payments from Arnaud's real sheet
    const payments: Payment[] = [
      {
        id: "pay-1",
        owner_id: "owner-1",
        rent_due_id: "due-1", // Nov paid on 19 Dec
        paid_at: "2025-12-19",
        amount: 50000,
        method: "mobile_money",
        reference: "Airtel 101",
        note: null,
        created_at: "2025-12-19T00:00:00Z",
      },
      {
        id: "pay-2",
        owner_id: "owner-1",
        rent_due_id: "due-2", // Dec & part Jan paid on 07 Jan
        paid_at: "2026-01-07",
        amount: 70000,
        method: "mobile_money",
        reference: "Airtel 102",
        note: null,
        created_at: "2026-01-07T00:00:00Z",
      },
      {
        id: "pay-3",
        owner_id: "owner-1",
        rent_due_id: "due-4",
        paid_at: "2026-02-07",
        amount: 50000,
        method: "mobile_money",
        reference: "Airtel 103",
        note: null,
        created_at: "2026-02-07T00:00:00Z",
      },
      {
        id: "pay-4",
        owner_id: "owner-1",
        rent_due_id: "due-5",
        paid_at: "2026-03-07",
        amount: 40000,
        method: "mobile_money",
        reference: "Airtel 104",
        note: null,
        created_at: "2026-03-07T00:00:00Z",
      },
      {
        id: "pay-5",
        owner_id: "owner-1",
        rent_due_id: "due-6", // 70k paid on 29 March (avril advance)
        paid_at: "2026-03-29",
        amount: 70000,
        method: "mobile_money",
        reference: "Airtel 105",
        note: null,
        created_at: "2026-03-29T00:00:00Z",
      },
      {
        id: "pay-6",
        owner_id: "owner-1",
        rent_due_id: "due-8",
        paid_at: "2026-06-05",
        amount: 40000,
        method: "mobile_money",
        reference: "Airtel 106",
        note: null,
        created_at: "2026-06-05T00:00:00Z",
      },
      {
        id: "pay-7",
        owner_id: "owner-1",
        rent_due_id: "due-10",
        paid_at: "2026-08-05",
        amount: 50000,
        method: "mobile_money",
        reference: "Airtel 107",
        note: null,
        created_at: "2026-08-05T00:00:00Z",
      },
    ]

    const statement = buildTenantStatement({
      tenant: dummyTenant,
      lease: dummyLease,
      property: dummyProperty,
      dues,
      payments,
    })

    // Total billed: 10 * 50 000 = 500 000 FCFA
    expect(statement.totalBilled).toBe(500000)

    // Total paid: 50k + 70k + 50k + 40k + 70k + 40k + 50k = 370 000 FCFA
    expect(statement.totalPaid).toBe(370000)

    // Current remaining balance = 500 000 - 370 000 = 130 000 FCFA!
    expect(statement.currentBalance).toBe(130000)

    // Verify deposit dates are preserved for payments
    const marchPayment = statement.entries.find((e) => e.id === "payment-pay-5")
    expect(marchPayment).toBeDefined()
    expect(marchPayment?.date).toBe("2026-03-29")
    expect(marchPayment?.actualDepositDate).toBe("2026-03-29")
    expect(marchPayment?.receivedAmount).toBe(70000)

    // Verify chronological order
    for (let i = 1; i < statement.entries.length; i++) {
      expect(statement.entries[i].date >= statement.entries[i - 1].date).toBe(true)
    }
  })
})
