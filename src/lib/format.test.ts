import { describe, it, expect } from "vitest"
import {
  formatMoney,
  toCents,
  fromCents,
  formatPeriod,
  formatMonthShort,
  formatDate,
  toPeriod,
  addMonthsToPeriod,
  formatAbbreviatedMoney,
  todayISO,
  parseISODate,
} from "./format"

describe("src/lib/format", () => {
  describe("formatMoney", () => {
    it("formats CFA amount (XAF) by default with French locale", () => {
      const result = formatMoney(120000)
      const normalized = result.replace(/\u202F|\u00A0/g, " ")
      expect(normalized).toContain("120 000")
      expect(normalized).toContain("FCFA")
    })

    it("formats zero and decimals correctly", () => {
      const result = formatMoney(0)
      const normalized = result.replace(/\u202F|\u00A0/g, " ")
      expect(normalized).toContain("0")
      expect(normalized).toContain("FCFA")
    })

    it("supports other currencies like EUR, CHF, CAD, MAD", () => {
      const euro = formatMoney(1200, "EUR")
      const normalizedEuro = euro.replace(/\u202F|\u00A0/g, " ")
      expect(normalizedEuro).toBe("1 200,00 €")

      const cad = formatMoney(500, "CAD")
      expect(cad).toContain("500,00")
      expect(cad).toContain("$")
    })

    it("does not contain narrow non-breaking space (\\u202F) that turns into slash '/' in PDFs", () => {
      const result = formatMoney(80000, "XAF")
      expect(result).not.toContain("\u202F")
      expect(result).not.toContain("\u00A0")
      expect(result).not.toContain("/")
      expect(result).toBe("80 000 FCFA")
    })
  })

  describe("toCents and fromCents", () => {
    it("converts decimal money to integer cents without floating point drift", () => {
      expect(toCents(12.34)).toBe(1234)
      expect(toCents(0.1 + 0.2)).toBe(30)
      expect(toCents(750.0)).toBe(75000)
    })

    it("converts integer cents back to number", () => {
      expect(fromCents(1234)).toBe(12.34)
      expect(fromCents(30)).toBe(0.3)
      expect(fromCents(75000)).toBe(750)
    })
  })

  describe("formatPeriod and formatMonthShort", () => {
    it("formats '2026-03-01' to 'mars 2026'", () => {
      expect(formatPeriod("2026-03-01")).toBe("mars 2026")
    })

    it("formats short month 'mars'", () => {
      expect(formatMonthShort("2026-03-01")).toBe("mars")
    })
  })

  describe("formatDate", () => {
    it("formats '2026-03-12' to '12 mars 2026'", () => {
      expect(formatDate("2026-03-12")).toBe("12 mars 2026")
    })
  })

  describe("toPeriod", () => {
    it("converts any day of the month to 1st of that month", () => {
      expect(toPeriod("2026-03-25")).toBe("2026-03-01")
      expect(toPeriod("2026-11-01")).toBe("2026-11-01")
    })
  })

  describe("addMonthsToPeriod", () => {
    it("adds months correctly", () => {
      expect(addMonthsToPeriod("2026-03-01", 1)).toBe("2026-04-01")
      expect(addMonthsToPeriod("2026-11-01", 2)).toBe("2027-01-01")
    })

    it("subtracts months correctly", () => {
      expect(addMonthsToPeriod("2026-03-01", -2)).toBe("2026-01-01")
    })
  })

  describe("todayISO", () => {
    it("returns ISO date format YYYY-MM-DD", () => {
      const today = todayISO()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe("parseISODate", () => {
    it("does not shift date because of timezone", () => {
      const d = parseISODate("2026-03-01")
      expect(d.getFullYear()).toBe(2026)
      expect(d.getMonth()).toBe(2)
      expect(d.getDate()).toBe(1)
    })
  })

  describe("formatAbbreviatedMoney", () => {
    it("formats thousands and millions in EUR and XAF", () => {
      expect(formatAbbreviatedMoney(1200, "EUR")).toBe("1,2 k€")
      expect(formatAbbreviatedMoney(1500000, "EUR")).toBe("1,5 M €")
      expect(formatAbbreviatedMoney(850000, "XAF")).toBe("850 k FCFA")
      expect(formatAbbreviatedMoney(2500000, "XAF")).toBe("2,5 M FCFA")
      expect(formatAbbreviatedMoney(500, "EUR")).toBe("500 €")
    })
  })
})

