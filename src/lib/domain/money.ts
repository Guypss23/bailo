/**
 * Money calculations strictly performed in integer cents to avoid floating point issues.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function sumMoney(amounts: number[]): number {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0)
  return fromCents(totalCents)
}
