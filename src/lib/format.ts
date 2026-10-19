import { format, addMonths } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Parses a YYYY-MM-DD string into a safe Date object at 12:00 local time
 * to prevent timezone-related date shifts.
 */
export function parseISODateParts(dateStr: string): { year: number; month: number; day: number } {
  const [yearStr, monthStr, dayStr] = dateStr.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  return { year, month, day }
}

export function parseISODate(dateStr: string): Date {
  const { year, month, day } = parseISODateParts(dateStr)
  return new Date(year, month - 1, day, 12, 0, 0)
}

/**
 * Returns today's date in 'YYYY-MM-DD' format using local time.
 */
export function todayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Formats a monetary amount into a localized string with currency symbol.
 * Defaults to XAF (Franc CFA BEAC / Gabon).
 */
export function formatMoney(amount: number, currency: string = "XAF"): string {
  const isCfa = currency === "XAF" || currency === "XOF"
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: isCfa && Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

  // Remplace l'espace insécable fine (\u202F) et l'espace insécable (\u00A0) par une espace standard (\u0020).
  // Dans les polices standard PDF (Helvetica en encodage WinAnsi 8 bits), \u202F (code 0x202F)
  // est tronqué en 0x2F qui est le caractère '/', ce qui affichait '80/000FCFA' au lieu de '80 000 FCFA'.
  return formatted.replace(/[\u202F\u00A0]/g, " ")
}

/**
 * Formats a 'YYYY-MM-01' period string into "mars 2026".
 */
export function formatPeriod(periodStr: string): string {
  const date = parseISODate(periodStr)
  return format(date, "MMMM yyyy", { locale: fr })
}

/**
 * Formats a 'YYYY-MM-01' period string into the short month name, e.g. "mars".
 */
export function formatMonthShort(periodStr: string): string {
  const date = parseISODate(periodStr)
  return format(date, "MMMM", { locale: fr })
}

/**
 * Formats a 'YYYY-MM-DD' date string into "12 mars 2026".
 */
export function formatDate(dateStr: string): string {
  const date = parseISODate(dateStr)
  return format(date, "d MMMM yyyy", { locale: fr })
}

/**
 * Converts any 'YYYY-MM-DD' string to its corresponding period 'YYYY-MM-01'.
 */
export function toPeriod(dateStr: string): string {
  const { year, month } = parseISODateParts(dateStr)
  const monthStr = String(month).padStart(2, "0")
  return `${year}-${monthStr}-01`
}

/**
 * Adds or subtracts months to a 'YYYY-MM-01' period string.
 */
export function addMonthsToPeriod(periodStr: string, count: number): string {
  const date = parseISODate(periodStr)
  const nextDate = addMonths(date, count)
  const year = nextDate.getFullYear()
  const month = String(nextDate.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

/**
 * Converts a floating point amount to integer cents (e.g. 12.34 -> 1234).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Converts integer cents back to a number with 2 decimals (e.g. 1234 -> 12.34).
 */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Formats a monetary amount into an abbreviated string (e.g. 1,2 k€ or 1,2 M FCFA).
 * Useful for chart axes and concise KPI badges.
 */
export function formatAbbreviatedMoney(amount: number, currency: string = "XAF"): string {
  const isCfa = currency === "XAF" || currency === "XOF"
  const symbol = isCfa ? "FCFA" : currency === "EUR" ? "€" : currency === "MAD" ? "DH" : currency === "CHF" ? "CHF" : currency === "CAD" ? "$" : currency

  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""

  let result: string
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })
    result = `${sign}${val} M ${symbol}`.trim()
  } else if (abs >= 1_000) {
    const val = (abs / 1_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })
    result = `${sign}${val} k${symbol === "€" ? "€" : ` ${symbol}`}`.trim()
  } else {
    result = `${sign}${abs.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${symbol}`.trim()
  }

  return result.replace(/[\u202F\u00A0]/g, " ")
}

