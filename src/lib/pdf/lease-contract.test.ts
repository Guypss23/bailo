import { describe, it, expect } from "vitest"
import { renderLeaseContractToBuffer } from "./lease-contract"
import type { Lease, Tenant, Property, Profile } from "@/lib/data/types"

describe("src/lib/pdf/lease-contract - Génération du Contrat de Bail officiel", () => {
  const dummyProfile: Profile = {
    id: "user-1",
    full_name: "Jean Dupont",
    company_name: "SCI Immobilière du Gabon",
    address: "Boulevard Triomphal",
    city: "Libreville",
    phone: "+241 01 02 03 04",
    currency: "XAF",
    reminder_days_after_due: 5,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyProperty: Property = {
    id: "prop-1",
    owner_id: "user-1",
    name: "Villa Sablière",
    type: "maison",
    address_line1: "Quartier Sablière",
    address_line2: "Face clinique",
    postal_code: "BP 500",
    city: "Libreville",
    country: "GA",
    surface_m2: 180,
    notes: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyTenant: Tenant = {
    id: "tenant-1",
    owner_id: "user-1",
    first_name: "Arnaud",
    last_name: "Mba",
    email: "arnaud.mba@example.com",
    phone: "+241 07 20 30 40",
    notes: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyLease: Lease = {
    id: "lease-1",
    owner_id: "user-1",
    property_id: "prop-1",
    tenant_id: "tenant-1",
    status: "actif",
    start_date: "2026-01-01",
    end_date: null,
    rent_amount: 450000,
    charges_amount: 50000,
    deposit_amount: 500000,
    due_day: 5,
    payment_method: "virement",
    notes: "Climatisation révisée",
    created_at: "2026-01-01T00:00:00Z",
  }

  it("génère avec succès un binaire PDF conforme pour le contrat de bail", async () => {
    const buffer = await renderLeaseContractToBuffer({
      lease: dummyLease,
      tenant: dummyTenant,
      property: dummyProperty,
      profile: dummyProfile,
    })

    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(1000)
    // Vérifier l'en-tête standard PDF (%PDF-)
    const pdfHeader = buffer.subarray(0, 5).toString("utf-8")
    expect(pdfHeader).toBe("%PDF-")
  })
})
