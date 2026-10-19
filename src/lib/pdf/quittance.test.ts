import { describe, it, expect } from "vitest"
import { renderDocumentToBuffer } from "./quittance"
import type { RentDueOverview, Lease, Tenant, Property, Profile } from "@/lib/data/types"

describe("src/lib/pdf/quittance - Génération de PDF", () => {
  const dummyProfile: Profile = {
    id: "user-1",
    full_name: "Jean Dupont",
    company_name: null,
    address: "10 rue de la République",
    city: "Libreville",
    phone: "+241 01 02 03 04",
    currency: "XAF",
    reminder_days_after_due: 5,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyProperty: Property = {
    id: "prop-1",
    owner_id: "user-1",
    name: "Résidence Okoumé - Apt 4B",
    type: "appartement",
    address_line1: "Boulevard Triomphal",
    address_line2: null,
    postal_code: "BP 123",
    city: "Libreville",
    country: "GA",
    surface_m2: 65,
    notes: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyTenant: Tenant = {
    id: "tenant-1",
    owner_id: "user-1",
    first_name: "Marc",
    last_name: "Ndong",
    email: "marc.ndong@example.com",
    phone: "+241 07 11 22 33",
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
    rent_amount: 350000,
    charges_amount: 50000,
    deposit_amount: 400000,
    due_day: 5,
    payment_method: "virement",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
  }

  const dummyPaidDue: RentDueOverview = {
    id: "due-paid-1",
    owner_id: "user-1",
    lease_id: "lease-1",
    property_id: "prop-1",
    tenant_id: "tenant-1",
    period: "2026-10-01",
    due_date: "2026-10-05",
    rent_amount: 350000,
    charges_amount: 50000,
    total_amount: 400000,
    note: null,
    created_at: "2026-10-01T00:00:00Z",
    paid_amount: 400000,
    balance: 0,
    status: "paye",
    days_late: 0,
    last_paid_at: "2026-10-04T10:00:00Z",
  }

  const dummyPartialDue: RentDueOverview = {
    id: "due-partial-1",
    owner_id: "user-1",
    lease_id: "lease-1",
    property_id: "prop-1",
    tenant_id: "tenant-1",
    period: "2026-10-01",
    due_date: "2026-10-05",
    rent_amount: 350000,
    charges_amount: 50000,
    total_amount: 400000,
    note: null,
    created_at: "2026-10-01T00:00:00Z",
    paid_amount: 200000,
    balance: 200000,
    status: "partiel",
    days_late: 0,
    last_paid_at: "2026-10-06T15:30:00Z",
  }

  it("génère un buffer PDF valide pour une quittance de loyer soldée", async () => {
    const buffer = await renderDocumentToBuffer({
      due: dummyPaidDue,
      lease: dummyLease,
      tenant: dummyTenant,
      property: dummyProperty,
      profile: dummyProfile,
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)
    // Vérifie le header magique PDF standard (%PDF-)
    const pdfHeader = buffer.subarray(0, 5).toString("utf-8")
    expect(pdfHeader).toBe("%PDF-")
  })

  it("génère un buffer PDF valide pour un reçu de paiement partiel", async () => {
    const buffer = await renderDocumentToBuffer({
      due: dummyPartialDue,
      lease: dummyLease,
      tenant: dummyTenant,
      property: dummyProperty,
      profile: dummyProfile,
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)
    const pdfHeader = buffer.subarray(0, 5).toString("utf-8")
    expect(pdfHeader).toBe("%PDF-")
  })

  it("ne contient aucun slash '/' dans la séparation des milliers dans le PDF généré", async () => {
    const zlib = await import("zlib")
    const buffer = await renderDocumentToBuffer({
      due: dummyPaidDue,
      lease: dummyLease,
      tenant: dummyTenant,
      property: dummyProperty,
      profile: dummyProfile,
    })

    const strBuf = buffer.toString("latin1")
    const streamMatches = strBuf.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g) || []
    let fullDecompressedText = ""

    for (const match of streamMatches) {
      const raw = match.replace(/^stream[\r\n]+/, "").replace(/[\r\n]+endstream$/, "")
      try {
        const decompressed = zlib.inflateSync(Buffer.from(raw, "latin1")).toString("utf8")
        fullDecompressedText += decompressed + "\n"
      } catch {
        // non-flate stream, ignore
      }
    }

    // Le caractère '/' a pour code ASCII 0x2f ('2f' en hex).
    // Vérifie qu'il n'y a aucun '2f' (slash) devant les '000' dans les flux de texte
    expect(fullDecompressedText).not.toMatch(/2f.*?303030/i)
    // Et vérifie que l'espace standard 0x20 (<20>) sépare bien les milliers (ex: <343030> ... <20> ... <303030>)
    expect(fullDecompressedText).toMatch(/343030.*?20.*?303030/i)
  })
})
