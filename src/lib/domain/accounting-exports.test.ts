import { describe, it, expect } from "vitest"
import {
  proratePayment,
  formatCsvNumber,
  formatDateCsv,
  escapeCsvField,
  generateCsv,
  computePropertiesAnnualSummary,
  generatePaymentsCsv,
  generatePropertiesSummaryCsv,
  generateAnnualExcelWorkbook,
} from "./accounting-exports"
import type {
  Lease,
  Tenant,
  Property,
  Payment,
  RentDueOverview,
} from "@/lib/data/types"

describe("src/lib/domain/accounting-exports - Exports comptables et fiscaux", () => {
  describe("proratePayment (Ventilation loyer / charges au centime)", () => {
    it("ventile à 100% le loyer lorsque les charges sont nulles", () => {
      const res = proratePayment(100, 100, 0, 100)
      expect(res.rentShare).toBe(100)
      expect(res.chargesShare).toBe(0)
    })

    it("ventile à 100% les charges lorsque le loyer est nul", () => {
      const res = proratePayment(50, 0, 50, 50)
      expect(res.rentShare).toBe(0)
      expect(res.chargesShare).toBe(50)
    })

    it("ventile au prorata exact sur un paiement complet (ex: 80 000 loyer + 20 000 charges)", () => {
      const res = proratePayment(100000, 80000, 20000, 100000)
      expect(res.rentShare).toBe(80000)
      expect(res.chargesShare).toBe(20000)
      expect(res.rentShare + res.chargesShare).toBe(100000)
    })

    it("ventile au prorata exact sur un paiement partiel (ex: 50 000 sur 100 000)", () => {
      const res = proratePayment(50000, 80000, 20000, 100000)
      expect(res.rentShare).toBe(40000)
      expect(res.chargesShare).toBe(10000)
      expect(res.rentShare + res.chargesShare).toBe(50000)
    })

    it("arrondit au centime sans aucune dérive sur les divisions non entières", () => {
      // Échéance : 700€ loyer + 300€ charges = 1 000€ (ratio 70% / 30%)
      // Paiement partiel de 333,33€
      const res = proratePayment(333.33, 700, 300, 1000)
      // 333,33 * 0,7 = 233,331 -> arrondi à 233,33€
      // Charges : 333,33 - 233,33 = 100,00€
      expect(res.rentShare).toBe(233.33)
      expect(res.chargesShare).toBe(100.0)
      expect(Number((res.rentShare + res.chargesShare).toFixed(2))).toBe(333.33)
    })

    it("gère les paiements nuls ou négatifs de façon sécurisée", () => {
      const zero = proratePayment(0, 500, 100, 600)
      expect(zero.rentShare).toBe(0)
      expect(zero.chargesShare).toBe(0)

      const negative = proratePayment(-50, 500, 100, 600)
      expect(negative.rentShare).toBe(0)
      expect(negative.chargesShare).toBe(0)
    })
  })

  describe("Formatage CSV français (séparateur point-virgule, virgule décimale, UTF-8 BOM)", () => {
    it("formate les montants avec une virgule décimale et 2 décimales", () => {
      expect(formatCsvNumber(1234.5)).toBe("1234,50")
      expect(formatCsvNumber(80000)).toBe("80000,00")
      expect(formatCsvNumber(0)).toBe("0,00")
    })

    it("formate les dates en JJ/MM/AAAA", () => {
      expect(formatDateCsv("2026-10-05")).toBe("05/10/2026")
      expect(formatDateCsv("2026-03-12T14:30:00Z")).toBe("12/03/2026")
      expect(formatDateCsv("")).toBe("")
    })

    it("échappe correctement les champs contenant des points-virgules, guillemets ou retours à la ligne", () => {
      expect(escapeCsvField("Simple")).toBe("Simple")
      expect(escapeCsvField("Avec;point-virgule")).toBe('"Avec;point-virgule"')
      expect(escapeCsvField('Avec "guillemets"')).toBe('"Avec ""guillemets"""')
      expect(escapeCsvField("Ligne 1\nLigne 2")).toBe('"Ligne 1\nLigne 2"')
      expect(escapeCsvField(null)).toBe("")
      expect(escapeCsvField(undefined)).toBe("")
    })

    it("génère un flux CSV préfixé du BOM UTF-8 (\\uFEFF) et séparé par des points-virgules", () => {
      const csv = generateCsv([
        ["En-tête 1", "En-tête 2"],
        ["Valeur 1", "Valeur 2"],
      ])

      expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM UTF-8
      expect(csv).toContain("En-tête 1;En-tête 2\r\nValeur 1;Valeur 2")
    })
  })

  describe("Génération des exports CSV et Excel", () => {
    const dummyProperty1: Property = {
      id: "prop-1",
      owner_id: "user-1",
      name: "Appartement Centre",
      type: "appartement",
      address_line1: "10 rue Principale",
      address_line2: null,
      postal_code: "BP 100",
      city: "Libreville",
      country: "GA",
      surface_m2: 50,
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    const dummyTenant1: Tenant = {
      id: "tenant-1",
      owner_id: "user-1",
      first_name: "Alain",
      last_name: "Bongo",
      email: "alain@example.com",
      phone: "+241 01 02 03 04",
      notes: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    const dummyLease1: Lease = {
      id: "lease-1",
      owner_id: "user-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status: "actif",
      start_date: "2026-01-01",
      end_date: null,
      rent_amount: 80000,
      charges_amount: 20000,
      deposit_amount: 100000,
      due_day: 5,
      payment_method: "virement",
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    }

    const dummyDues: RentDueOverview[] = [
      {
        id: "due-1",
        owner_id: "user-1",
        lease_id: "lease-1",
        property_id: "prop-1",
        tenant_id: "tenant-1",
        period: "2026-01-01",
        due_date: "2026-01-05",
        rent_amount: 80000,
        charges_amount: 20000,
        total_amount: 100000,
        paid_amount: 100000,
        balance: 0,
        status: "paye",
        days_late: 0,
        last_paid_at: "2026-01-04T10:00:00Z",
        note: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "due-2",
        owner_id: "user-1",
        lease_id: "lease-1",
        property_id: "prop-1",
        tenant_id: "tenant-1",
        period: "2026-02-01",
        due_date: "2026-02-05",
        rent_amount: 80000,
        charges_amount: 20000,
        total_amount: 100000,
        paid_amount: 50000,
        balance: 50000,
        status: "partiel",
        days_late: 5,
        last_paid_at: "2026-02-10T12:00:00Z",
        note: null,
        created_at: "2026-02-01T00:00:00Z",
      },
    ]

    const dummyPayments: Payment[] = [
      {
        id: "pay-1",
        owner_id: "user-1",
        rent_due_id: "due-1",
        paid_at: "2026-01-04T10:00:00Z",
        amount: 100000,
        method: "virement",
        reference: "VIR-001",
        note: null,
        created_at: "2026-01-04T10:00:00Z",
      },
      {
        id: "pay-2",
        owner_id: "user-1",
        rent_due_id: "due-2",
        paid_at: "2026-02-10T12:00:00Z",
        amount: 50000,
        method: "mobile_money",
        reference: "MM-002",
        note: null,
        created_at: "2026-02-10T12:00:00Z",
      },
      // Paiement reçu l'année d'après (2027) : ne doit PAS être compté en 2026
      {
        id: "pay-future",
        owner_id: "user-1",
        rent_due_id: "due-2",
        paid_at: "2027-01-15T08:00:00Z",
        amount: 50000,
        method: "especes",
        reference: null,
        note: null,
        created_at: "2027-01-15T08:00:00Z",
      },
    ]

    it("calcule correctement le récapitulatif par bien basé sur les encaissements de l'année civile", () => {
      const summaries = computePropertiesAnnualSummary({
        year: 2026,
        properties: [dummyProperty1],
        tenants: [dummyTenant1],
        leases: [dummyLease1],
        dues: dummyDues,
        payments: dummyPayments,
      })

      expect(summaries.length).toBe(1)
      const prop1 = summaries[0]
      expect(prop1.propertyName).toBe("Appartement Centre")
      // Encaissé en 2026 : pay-1 (100 000 -> 80 000 loyer + 20 000 charges) + pay-2 (50 000 -> 40 000 loyer + 10 000 charges)
      expect(prop1.rentCollected).toBe(120000)
      expect(prop1.chargesCollected).toBe(30000)
      expect(prop1.totalCollected).toBe(150000)
      // Mois soldés en 2026 : due-1 est payé, due-2 est partiel => 1 mois soldé
      expect(prop1.paidMonthsCount).toBe(1)
      // Impayé restant sur 2026 : 50 000 sur due-2
      expect(prop1.unpaidBalance).toBe(50000)
    })

    it("génère le CSV des paiements avec séparateur point-virgule et ventilation", () => {
      const csv = generatePaymentsCsv({
        year: 2026,
        properties: [dummyProperty1],
        tenants: [dummyTenant1],
        leases: [dummyLease1],
        dues: dummyDues,
        payments: dummyPayments,
      })

      expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM
      expect(csv).toContain("Date;Locataire;Bien;Période;Montant;Dont loyer;Dont charges;Mode;Référence")
      expect(csv).toContain("04/01/2026;Bongo Alain;Appartement Centre;01/2026;100000,00;80000,00;20000,00;Virement bancaire;VIR-001")
      expect(csv).toContain("10/02/2026;Bongo Alain;Appartement Centre;02/2026;50000,00;40000,00;10000,00;Mobile Money (Airtel / Moov);MM-002")
      // Ne doit pas contenir le paiement de 2027
      expect(csv).not.toContain("15/01/2027")
    })

    it("génère le CSV du récapitulatif par bien avec la ligne de TOTAL", () => {
      const csv = generatePropertiesSummaryCsv({
        year: 2026,
        properties: [dummyProperty1],
        tenants: [dummyTenant1],
        leases: [dummyLease1],
        dues: dummyDues,
        payments: dummyPayments,
      })

      expect(csv.charCodeAt(0)).toBe(0xfeff)
      expect(csv).toContain("Bien;Loyers hors charges encaissés;Charges encaissées;Total encaissé;Nombre de mois soldés;Impayés restants")
      expect(csv).toContain("Appartement Centre;120000,00;30000,00;150000,00;1;50000,00")
      expect(csv).toContain("TOTAL;120000,00;30000,00;150000,00;1;50000,00")
    })

    it("génère un classeur Excel valide contenant les 3 onglets (Grille, Paiements, Récap)", async () => {
      const buffer = await generateAnnualExcelWorkbook({
        year: 2026,
        properties: [dummyProperty1],
        tenants: [dummyTenant1],
        leases: [dummyLease1],
        dues: dummyDues,
        payments: dummyPayments,
        currency: "XAF",
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(2000)

      // Vérifie que le classeur est relisible par ExcelJS et contient les 3 onglets
      const ExcelJS = await import("exceljs")
      const testWorkbook = new ExcelJS.Workbook()
      await testWorkbook.xlsx.load(buffer as any)

      expect(testWorkbook.worksheets.length).toBe(3)
      expect(testWorkbook.worksheets[0].name).toBe("Grille annuelle")
      expect(testWorkbook.worksheets[1].name).toBe("Paiements")
      expect(testWorkbook.worksheets[2].name).toBe("Récapitulatif par bien")

      // Vérifie les volets figés
      expect(testWorkbook.worksheets[0].views[0].state).toBe("frozen")
      expect(testWorkbook.worksheets[1].views[0].state).toBe("frozen")
      expect(testWorkbook.worksheets[2].views[0].state).toBe("frozen")
    })
  })
})
