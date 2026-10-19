import * as React from "react"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

interface MoneyProps {
  amount: number
  currency?: string
  className?: string
}

export function Money({ amount, currency = "XAF", className }: MoneyProps) {
  return (
    <span className={cn("num font-medium", className)}>
      {formatMoney(amount, currency)}
    </span>
  )
}
