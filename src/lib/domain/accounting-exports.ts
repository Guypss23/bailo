import type {
  Lease,
  Tenant,
  Property,
  Payment,
  RentDueOverview,
} from "@/lib/data/types"
import { toCents, fromCents, formatDate } from "@/lib/format"
import { paymentMethodLabels } from "@/lib/validations/lease"
import { buildAnnualGrid, MONTH_SHORT_LABELS } from "./annual-grid"
import ExcelJS from "exceljs"

export interface ProratedPayment {
  rentShare: number
  chargesShare: number
}

/**
 * Ventile un paiement entre le loyer hors charges et les provisions sur charges,
 * au prorata des montants appelés sur l'échéance.
 * Tous les calculs s'effectuent en centimes entiers pour garantir que la somme
 * des parts soit strictement égale au montant payé (aucun centime perdu).
 */
export function proratePayment(
  paymentAmount: number,
  dueRentAmount: number,
  dueChargesAmount: number,
  dueTotalAmount?: number
): ProratedPayment {
  const total = dueTotalAmount ?? (dueRentAmount + dueChargesAmount)
  const paymentCents = toCents(paymentAmount)

  if (total <= 0 || paymentCents <= 0) {
    return { rentShare: 0, chargesShare: 0 }
  }

  if (dueChargesAmount <= 0) {
    return { rentShare: paymentAmount, chargesShare: 0 }
  }

  if (dueRentAmount <= 0) {
    return { rentShare: 0, chargesShare: paymentAmount }
  }

  // Calcul au centime de la quote-part loyer
  const rentCents = Math.round((paymentCents * dueRentAmount) / total)
  const chargesCents = paymentCents - rentCents

  return {
    rentShare: fromCents(rentCents),
    chargesShare: fromCents(chargesCents),
  }
}

/**
 * Formate un nombre pour les fichiers CSV français (virgule décimale, pas de séparateur de milliers).
 */
export function formatCsvNumber(amount: number): string {
  return amount.toFixed(2).replace(".", ",")
}

/**
 * Formate une date (YYYY-MM-DD ou ISO) en format français JJ/MM/AAAA.
 */
export function formatDateCsv(dateStr: string): string {
  if (!dateStr) return ""
  const datePart = dateStr.slice(0, 10)
  const [year, month, day] = datePart.split("-")
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

/**
 * Échappe un champ CSV selon la norme RFC 4180 / Excel français :
 * entouré de guillemets si le champ contient ';', '"', ou saut de ligne.
 */
export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Assemble des lignes en un flux CSV encodé en UTF-8 avec BOM.
 */
export function generateCsv(rows: (string | number | null | undefined)[][]): string {
  const content = rows.map((row) => row.map(escapeCsvField).join(";")).join("\r\n")
  return `\uFEFF${content}`
}

export interface AccountingDataOptions {
  year: number
  payments: Payment[]
  dues: RentDueOverview[]
  leases: Lease[]
  tenants: Tenant[]
  properties: Property[]
  currency?: string
}

export interface PropertyAnnualSummary {
  propertyId: string
  propertyName: string
  rentCollected: number
  chargesCollected: number
  totalCollected: number
  paidMonthsCount: number
  unpaidBalance: number
}

/**
 * Calcule le récapitulatif comptable et fiscal annuel par bien immobilier.
 * Base : date de paiement dans l'année civile (paid_at), car ce sont les loyers
 * effectivement encaissés qui se déclarent.
 */
export function computePropertiesAnnualSummary(
  options: AccountingDataOptions
): PropertyAnnualSummary[] {
  const { year, payments, dues, leases, properties } = options
  const yearStr = String(year)

  const duesMap = new Map<string, RentDueOverview>(dues.map((d) => [d.id, d]))
  const leasesMap = new Map<string, Lease>(leases.map((l) => [l.id, l]))
  const propertiesMap = new Map<string, Property>(properties.map((p) => [p.id, p]))

  // 1. Initialiser le récap pour chaque bien
  const summaryByProp = new Map<string, PropertyAnnualSummary>()
  for (const prop of properties) {
    summaryByProp.set(prop.id, {
      propertyId: prop.id,
      propertyName: prop.name,
      rentCollected: 0,
      chargesCollected: 0,
      totalCollected: 0,
      paidMonthsCount: 0,
      unpaidBalance: 0,
    })
  }

  // 2. Agréger les encaissements dont paid_at tombe dans l'année civile
  const yearPayments = payments.filter((p) => p.paid_at.startsWith(yearStr))
  for (const p of yearPayments) {
    const due = duesMap.get(p.rent_due_id)
    if (!due) continue
    const lease = leasesMap.get(due.lease_id)
    if (!lease) continue
    const propSummary = summaryByProp.get(lease.property_id)
    if (!propSummary) continue

    const { rentShare, chargesShare } = proratePayment(
      p.amount,
      due.rent_amount,
      due.charges_amount,
      due.total_amount
    )

    propSummary.rentCollected = fromCents(toCents(propSummary.rentCollected) + toCents(rentShare))
    propSummary.chargesCollected = fromCents(toCents(propSummary.chargesCollected) + toCents(chargesShare))
    propSummary.totalCollected = fromCents(toCents(propSummary.totalCollected) + toCents(p.amount))
  }

  // 3. Agréger les mois soldés et les impayés sur les échéances de l'année
  const yearDues = dues.filter((d) => d.period.startsWith(yearStr))
  for (const due of yearDues) {
    const lease = leasesMap.get(due.lease_id)
    if (!lease) continue
    const propSummary = summaryByProp.get(lease.property_id)
    if (!propSummary) continue

    if (due.status === "paye") {
      propSummary.paidMonthsCount += 1
    }
    if (due.balance > 0) {
      propSummary.unpaidBalance = fromCents(toCents(propSummary.unpaidBalance) + toCents(due.balance))
    }
  }

  return Array.from(summaryByProp.values()).sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, "fr")
  )
}

/**
 * Génère le fichier CSV « Paiements de l'année ».
 */
export function generatePaymentsCsv(options: AccountingDataOptions): string {
  const { year, payments, dues, leases, tenants, properties } = options
  const yearStr = String(year)

  const duesMap = new Map<string, RentDueOverview>(dues.map((d) => [d.id, d]))
  const leasesMap = new Map<string, Lease>(leases.map((l) => [l.id, l]))
  const tenantsMap = new Map<string, Tenant>(tenants.map((t) => [t.id, t]))
  const propertiesMap = new Map<string, Property>(properties.map((p) => [p.id, p]))

  // Filtrer les paiements enregistrés dans l'année et trier par date chronologique
  const yearPayments = payments
    .filter((p) => p.paid_at.startsWith(yearStr))
    .sort((a, b) => a.paid_at.localeCompare(b.paid_at))

  const headers = [
    "Date",
    "Locataire",
    "Bien",
    "Période",
    "Montant",
    "Dont loyer",
    "Dont charges",
    "Mode",
    "Référence",
  ]

  const rows: (string | number)[][] = [headers]

  for (const p of yearPayments) {
    const due = duesMap.get(p.rent_due_id)
    const lease = due ? leasesMap.get(due.lease_id) : undefined
    const tenant = lease ? tenantsMap.get(lease.tenant_id) : undefined
    const property = lease ? propertiesMap.get(lease.property_id) : undefined

    const tenantName = tenant
      ? `${tenant.last_name} ${tenant.first_name}`.trim()
      : "Inconnu"
    const propertyName = property?.name || "Inconnu"

    const periodStr = due
      ? `${due.period.slice(5, 7)}/${due.period.slice(0, 4)}`
      : ""

    const { rentShare, chargesShare } = proratePayment(
      p.amount,
      due?.rent_amount ?? 0,
      due?.charges_amount ?? 0,
      due?.total_amount
    )

    const methodLabel = paymentMethodLabels[p.method] || p.method

    rows.push([
      formatDateCsv(p.paid_at),
      tenantName,
      propertyName,
      periodStr,
      formatCsvNumber(p.amount),
      formatCsvNumber(rentShare),
      formatCsvNumber(chargesShare),
      methodLabel,
      p.reference || "",
    ])
  }

  return generateCsv(rows)
}

/**
 * Génère le fichier CSV « Récapitulatif par bien ».
 */
export function generatePropertiesSummaryCsv(options: AccountingDataOptions): string {
  const summaries = computePropertiesAnnualSummary(options)

  const headers = [
    "Bien",
    "Loyers hors charges encaissés",
    "Charges encaissées",
    "Total encaissé",
    "Nombre de mois soldés",
    "Impayés restants",
  ]

  const rows: (string | number)[][] = [headers]

  let totalRent = 0
  let totalCharges = 0
  let totalAll = 0
  let totalMonths = 0
  let totalUnpaid = 0

  for (const item of summaries) {
    totalRent = fromCents(toCents(totalRent) + toCents(item.rentCollected))
    totalCharges = fromCents(toCents(totalCharges) + toCents(item.chargesCollected))
    totalAll = fromCents(toCents(totalAll) + toCents(item.totalCollected))
    totalMonths += item.paidMonthsCount
    totalUnpaid = fromCents(toCents(totalUnpaid) + toCents(item.unpaidBalance))

    rows.push([
      item.propertyName,
      formatCsvNumber(item.rentCollected),
      formatCsvNumber(item.chargesCollected),
      formatCsvNumber(item.totalCollected),
      item.paidMonthsCount,
      formatCsvNumber(item.unpaidBalance),
    ])
  }

  // Ligne de totalisation
  rows.push([
    "TOTAL",
    formatCsvNumber(totalRent),
    formatCsvNumber(totalCharges),
    formatCsvNumber(totalAll),
    totalMonths,
    formatCsvNumber(totalUnpaid),
  ])

  return generateCsv(rows)
}

/**
 * Génère le classeur Excel (.xlsx) complet avec 3 onglets :
 * 1. Grille annuelle (pivot 12 mois avec statut et mise en forme conditionnelle)
 * 2. Paiements (journal des encaissements de l'année civile)
 * 3. Récapitulatif par bien (déclaration de revenus fonciers)
 */
export async function generateAnnualExcelWorkbook(
  options: AccountingDataOptions
): Promise<Buffer> {
  const { year, payments, dues, leases, tenants, properties, currency = "XAF" } = options
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Bailo"
  workbook.created = new Date()

  // Format monétaire pour Excel
  const isCfa = currency === "XAF" || currency === "XOF"
  const excelNumberFormat = isCfa ? `#,##0 "${currency}"` : `#,##0.00 "${currency}"`

  // Palette de styles Bailo
  const darkGreenHeader = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF1F5C45" }, // Vert bouteille
  }
  const headerFont = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  }
  const thinBorder = {
    top: { style: "thin" as const, color: { argb: "FFE2E7E3" } },
    left: { style: "thin" as const, color: { argb: "FFE2E7E3" } },
    bottom: { style: "thin" as const, color: { argb: "FFE2E7E3" } },
    right: { style: "thin" as const, color: { argb: "FFE2E7E3" } },
  }

  // ----------------------------------------------------
  // Onglet 1 : Grille annuelle
  // ----------------------------------------------------
  const sheetGrid = workbook.addWorksheet("Grille annuelle", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  })

  const gridData = buildAnnualGrid({
    year,
    leases,
    tenants,
    properties,
    dues,
    payments,
  })

  // En-têtes de la grille
  const gridHeaders = ["Bien & Locataire", ...MONTH_SHORT_LABELS, "Total payé", "Reste dû"]
  const gridHeaderRow = sheetGrid.addRow(gridHeaders)
  gridHeaderRow.height = 24
  gridHeaderRow.eachCell((cell) => {
    cell.fill = darkGreenHeader
    cell.font = headerFont
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  gridHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" }

  // Couleurs de statut pour les cellules Excel
  const statusFills = {
    paye: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFD4EDDA" } }, // vert doux
    partiel: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF3CD" } }, // ambre doux
    impaye: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF8D7DA" } }, // rouge doux
    a_venir: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE2E3E5" } }, // gris doux
    hors_bail: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF8F9FA" } },
  }
  const statusFonts = {
    paye: { color: { argb: "FF155724" }, bold: true },
    partiel: { color: { argb: "FF856404" }, bold: true },
    impaye: { color: { argb: "FF721C24" }, bold: true },
    a_venir: { color: { argb: "FF6C757D" } },
    hors_bail: { color: { argb: "FFADB5BD" } },
  }

  for (const row of gridData.rows) {
    const tenantName = row.tenant
      ? `${row.tenant.last_name} ${row.tenant.first_name}`.trim()
      : "Sans locataire"
    const propName = row.property?.name || "Bien inconnu"
    const label = `${propName} (${tenantName})`

    const rowValues: (string | number)[] = [label]

    for (const cell of row.cells) {
      if (cell.isOutOfLease) {
        rowValues.push("—")
      } else {
        rowValues.push(cell.paidAmount)
      }
    }

    rowValues.push(row.totalPaid)
    rowValues.push(row.totalBalance)

    const excelRow = sheetGrid.addRow(rowValues)
    excelRow.height = 20

    // Style de la première colonne (Bien & Locataire)
    const firstCell = excelRow.getCell(1)
    firstCell.font = { bold: true, name: "Calibri", size: 10 }
    firstCell.border = thinBorder

    // Style des 12 mois
    for (let m = 0; m < 12; m++) {
      const cellData = row.cells[m]
      const cellObj = excelRow.getCell(m + 2)
      cellObj.border = thinBorder
      cellObj.alignment = { vertical: "middle", horizontal: "right" }

      if (cellData.status in statusFills) {
        cellObj.fill = statusFills[cellData.status as keyof typeof statusFills]
        cellObj.font = { ...statusFonts[cellData.status as keyof typeof statusFonts], name: "Calibri", size: 10 }
      }

      if (!cellData.isOutOfLease) {
        cellObj.numFmt = excelNumberFormat
      }
    }

    // Colonne Total payé
    const totalPaidCell = excelRow.getCell(14)
    totalPaidCell.numFmt = excelNumberFormat
    totalPaidCell.font = { bold: true, color: { argb: "FF1E8A5A" }, name: "Calibri", size: 10 }
    totalPaidCell.border = thinBorder

    // Colonne Reste dû
    const totalBalanceCell = excelRow.getCell(15)
    totalBalanceCell.numFmt = excelNumberFormat
    totalBalanceCell.font = {
      bold: true,
      color: row.totalBalance > 0 ? { argb: "FFC2413A" } : { argb: "FF6C757D" },
      name: "Calibri",
      size: 10,
    }
    totalBalanceCell.border = thinBorder
  }

  // Largeurs de colonnes feuille 1
  sheetGrid.getColumn(1).width = 32
  for (let c = 2; c <= 13; c++) {
    sheetGrid.getColumn(c).width = 14
  }
  sheetGrid.getColumn(14).width = 16
  sheetGrid.getColumn(15).width = 16

  // ----------------------------------------------------
  // Onglet 2 : Paiements
  // ----------------------------------------------------
  const sheetPayments = workbook.addWorksheet("Paiements", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  const paymentsHeaders = [
    "Date",
    "Locataire",
    "Bien",
    "Période",
    "Montant",
    "Dont loyer",
    "Dont charges",
    "Mode de règlement",
    "Référence",
  ]
  const payHeaderRow = sheetPayments.addRow(paymentsHeaders)
  payHeaderRow.height = 24
  payHeaderRow.eachCell((cell) => {
    cell.fill = darkGreenHeader
    cell.font = headerFont
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  payHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }
  payHeaderRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" }
  payHeaderRow.getCell(3).alignment = { vertical: "middle", horizontal: "left" }

  const duesMap = new Map<string, RentDueOverview>(dues.map((d) => [d.id, d]))
  const leasesMap = new Map<string, Lease>(leases.map((l) => [l.id, l]))
  const tenantsMap = new Map<string, Tenant>(tenants.map((t) => [t.id, t]))
  const propertiesMap = new Map<string, Property>(properties.map((p) => [p.id, p]))

  const yearPayments = payments
    .filter((p) => p.paid_at.startsWith(String(year)))
    .sort((a, b) => a.paid_at.localeCompare(b.paid_at))

  let sumPayAmount = 0
  let sumPayRent = 0
  let sumPayCharges = 0

  for (const p of yearPayments) {
    const due = duesMap.get(p.rent_due_id)
    const lease = due ? leasesMap.get(due.lease_id) : undefined
    const tenant = lease ? tenantsMap.get(lease.tenant_id) : undefined
    const property = lease ? propertiesMap.get(lease.property_id) : undefined

    const tenantName = tenant ? `${tenant.last_name} ${tenant.first_name}`.trim() : "—"
    const propName = property?.name || "—"
    const periodStr = due ? `${due.period.slice(5, 7)}/${due.period.slice(0, 4)}` : "—"

    const { rentShare, chargesShare } = proratePayment(
      p.amount,
      due?.rent_amount ?? 0,
      due?.charges_amount ?? 0,
      due?.total_amount
    )

    sumPayAmount = fromCents(toCents(sumPayAmount) + toCents(p.amount))
    sumPayRent = fromCents(toCents(sumPayRent) + toCents(rentShare))
    sumPayCharges = fromCents(toCents(sumPayCharges) + toCents(chargesShare))

    const methodLabel = paymentMethodLabels[p.method] || p.method

    const pRow = sheetPayments.addRow([
      formatDateCsv(p.paid_at),
      tenantName,
      propName,
      periodStr,
      p.amount,
      rentShare,
      chargesShare,
      methodLabel,
      p.reference || "",
    ])
    pRow.height = 19
    pRow.eachCell((cell, colNumber) => {
      cell.border = thinBorder
      cell.font = { name: "Calibri", size: 10 }
      if (colNumber === 1 || colNumber === 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" }
      } else if (colNumber >= 5 && colNumber <= 7) {
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.numFmt = excelNumberFormat
      }
    })
  }

  // Ligne Total Paiements
  const payTotalRow = sheetPayments.addRow([
    "TOTAL",
    "",
    "",
    "",
    sumPayAmount,
    sumPayRent,
    sumPayCharges,
    "",
    "",
  ])
  payTotalRow.height = 22
  payTotalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, name: "Calibri", size: 10 }
    cell.border = thinBorder
    if (colNumber >= 5 && colNumber <= 7) {
      cell.numFmt = excelNumberFormat
      cell.alignment = { vertical: "middle", horizontal: "right" }
    }
  })

  // Largeurs colonnes feuille 2
  sheetPayments.getColumn(1).width = 14
  sheetPayments.getColumn(2).width = 24
  sheetPayments.getColumn(3).width = 24
  sheetPayments.getColumn(4).width = 12
  sheetPayments.getColumn(5).width = 16
  sheetPayments.getColumn(6).width = 16
  sheetPayments.getColumn(7).width = 16
  sheetPayments.getColumn(8).width = 20
  sheetPayments.getColumn(9).width = 18

  // ----------------------------------------------------
  // Onglet 3 : Récapitulatif par bien
  // ----------------------------------------------------
  const sheetSummary = workbook.addWorksheet("Récapitulatif par bien", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  const summaryHeaders = [
    "Bien immobilier",
    "Loyers HC encaissés",
    "Charges encaissées",
    "Total encaissé",
    "Nombre de mois soldés",
    "Impayés restants",
  ]
  const sumHeaderRow = sheetSummary.addRow(summaryHeaders)
  sumHeaderRow.height = 24
  sumHeaderRow.eachCell((cell) => {
    cell.fill = darkGreenHeader
    cell.font = headerFont
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  sumHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" }

  const summaries = computePropertiesAnnualSummary(options)

  let totalRecapRent = 0
  let totalRecapCharges = 0
  let totalRecapAll = 0
  let totalRecapMonths = 0
  let totalRecapUnpaid = 0

  for (const s of summaries) {
    totalRecapRent = fromCents(toCents(totalRecapRent) + toCents(s.rentCollected))
    totalRecapCharges = fromCents(toCents(totalRecapCharges) + toCents(s.chargesCollected))
    totalRecapAll = fromCents(toCents(totalRecapAll) + toCents(s.totalCollected))
    totalRecapMonths += s.paidMonthsCount
    totalRecapUnpaid = fromCents(toCents(totalRecapUnpaid) + toCents(s.unpaidBalance))

    const sRow = sheetSummary.addRow([
      s.propertyName,
      s.rentCollected,
      s.chargesCollected,
      s.totalCollected,
      s.paidMonthsCount,
      s.unpaidBalance,
    ])
    sRow.height = 20
    sRow.eachCell((cell, colNumber) => {
      cell.border = thinBorder
      cell.font = { name: "Calibri", size: 10 }
      if (colNumber === 1) {
        cell.font = { bold: true, name: "Calibri", size: 10 }
      } else if (colNumber === 5) {
        cell.alignment = { vertical: "middle", horizontal: "center" }
      } else {
        cell.alignment = { vertical: "middle", horizontal: "right" }
        cell.numFmt = excelNumberFormat
      }
    })
  }

  // Ligne de total récapitulatif
  const recapTotalRow = sheetSummary.addRow([
    "TOTAL",
    totalRecapRent,
    totalRecapCharges,
    totalRecapAll,
    totalRecapMonths,
    totalRecapUnpaid,
  ])
  recapTotalRow.height = 22
  recapTotalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, name: "Calibri", size: 10 }
    cell.border = thinBorder
    if (colNumber === 5) {
      cell.alignment = { vertical: "middle", horizontal: "center" }
    } else if (colNumber > 1) {
      cell.alignment = { vertical: "middle", horizontal: "right" }
      cell.numFmt = excelNumberFormat
    }
  })

  // Largeurs colonnes feuille 3
  sheetSummary.getColumn(1).width = 28
  sheetSummary.getColumn(2).width = 22
  sheetSummary.getColumn(3).width = 20
  sheetSummary.getColumn(4).width = 20
  sheetSummary.getColumn(5).width = 22
  sheetSummary.getColumn(6).width = 20

  // Génération du buffer Excel
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
