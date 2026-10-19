/**
 * Converts numbers and currency amounts into formal French words.
 * Conforms to French grammatical agreement rules (vingts, cents, mille, etc.).
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
]

const TENS = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingt",
  "quatre-vingt-dix",
]

/**
 * Converts a number between 0 and 99 into French words.
 * @param n number 0..99
 * @param isEnd whether this is the final word in the full number (affects "quatre-vingts")
 */
function convert0To99(n: number, isEnd = false): string {
  if (n < 20) {
    return UNITS[n]
  }

  // 20 - 69
  if (n < 70) {
    const tens = Math.floor(n / 10)
    const rem = n % 10
    if (rem === 0) return TENS[tens]
    if (rem === 1) return `${TENS[tens]} et un`
    return `${TENS[tens]}-${UNITS[rem]}`
  }

  // 70 - 79
  if (n < 80) {
    const rem = n - 60
    if (rem === 11) return "soixante et onze"
    return `soixante-${UNITS[rem]}`
  }

  // 80 - 89
  if (n < 90) {
    const rem = n - 80
    if (rem === 0) {
      return isEnd ? "quatre-vingts" : "quatre-vingt"
    }
    // 81: "quatre-vingt-un" (jamais de "et" pour 81)
    return `quatre-vingt-${UNITS[rem]}`
  }

  // 90 - 99
  const rem = n - 80
  return `quatre-vingt-${UNITS[rem]}`
}

/**
 * Converts a number between 0 and 999 into French words.
 */
function convert0To999(n: number, isEnd = false): string {
  if (n < 100) {
    return convert0To99(n, isEnd)
  }

  const hundreds = Math.floor(n / 100)
  const rem = n % 100

  let hundredsStr = ""
  if (hundreds === 1) {
    hundredsStr = "cent"
  } else {
    // Accord de cent : prend un 's' s'il n'est suivi d'aucun autre chiffre et est à la fin
    hundredsStr = rem === 0 && isEnd ? `${UNITS[hundreds]} cents` : `${UNITS[hundreds]} cent`
  }

  if (rem === 0) {
    return hundredsStr
  }

  return `${hundredsStr} ${convert0To99(rem, isEnd)}`
}

/**
 * Converts any non-negative integer into French words.
 */
export function integerToFrenchWords(n: number): string {
  if (n === 0) return "zéro"

  let num = Math.floor(Math.abs(n))
  const parts: string[] = []

  // Billions (milliards)
  const billions = Math.floor(num / 1_000_000_000)
  if (billions > 0) {
    parts.push(
      billions === 1
        ? "un milliard"
        : `${convert0To999(billions)} milliards`
    )
    num %= 1_000_000_000
  }

  // Millions
  const millions = Math.floor(num / 1_000_000)
  if (millions > 0) {
    parts.push(
      millions === 1
        ? "un million"
        : `${convert0To999(millions)} millions`
    )
    num %= 1_000_000
  }

  // Thousands (mille - toujours invariable, pas de "un mille")
  const thousands = Math.floor(num / 1_000)
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("mille")
    } else {
      parts.push(`${convert0To999(thousands)} mille`)
    }
    num %= 1_000
  }

  // Remainder (0 to 999)
  if (num > 0) {
    // isEnd is true since this is the last chunk
    parts.push(convert0To999(num, true))
  }

  return parts.join(" ")
}

export interface CurrencyLabels {
  mainSingular: string
  mainPlural: string
  subSingular: string
  subPlural: string
}

const CURRENCY_DICTIONARY: Record<string, CurrencyLabels> = {
  EUR: {
    mainSingular: "euro",
    mainPlural: "euros",
    subSingular: "centime",
    subPlural: "centimes",
  },
  XAF: {
    mainSingular: "franc CFA",
    mainPlural: "francs CFA",
    subSingular: "centime",
    subPlural: "centimes",
  },
  XOF: {
    mainSingular: "franc CFA",
    mainPlural: "francs CFA",
    subSingular: "centime",
    subPlural: "centimes",
  },
  MAD: {
    mainSingular: "dirham",
    mainPlural: "dirhams",
    subSingular: "centime",
    subPlural: "centimes",
  },
  CHF: {
    mainSingular: "franc suisse",
    mainPlural: "francs suisses",
    subSingular: "centime",
    subPlural: "centimes",
  },
  CAD: {
    mainSingular: "dollar canadien",
    mainPlural: "dollars canadiens",
    subSingular: "cent",
    subPlural: "cents",
  },
}

/**
 * Converts a monetary amount to formal French words.
 * Example: 870 -> "huit cent soixante-dix euros"
 * Example: 1150.50 -> "mille cent cinquante euros et cinquante centimes"
 */
export function amountToFrenchWords(
  amount: number,
  currencyCode: string = "EUR"
): string {
  const currency = CURRENCY_DICTIONARY[currencyCode] || CURRENCY_DICTIONARY.EUR

  // Handle rounding to 2 decimals to prevent floating inaccuracies
  const rounded = Math.round(amount * 100) / 100
  const integerPart = Math.floor(rounded)
  const centsPart = Math.round((rounded - integerPart) * 100)

  const integerWords = integerToFrenchWords(integerPart)
  const mainLabel = integerPart <= 1 ? currency.mainSingular : currency.mainPlural

  if (centsPart === 0) {
    return `${integerWords} ${mainLabel}`
  }

  const centsWords = integerToFrenchWords(centsPart)
  const subLabel = centsPart <= 1 ? currency.subSingular : currency.subPlural

  return `${integerWords} ${mainLabel} et ${centsWords} ${subLabel}`
}
