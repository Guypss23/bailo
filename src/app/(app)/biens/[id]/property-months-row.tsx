"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatMoney,
  formatPeriod,
  formatMonthShort,
  toPeriod,
  todayISO,
  addMonthsToPeriod,
} from "@/lib/format"
import { MONTH_INITIALS } from "@/lib/domain/annual-grid"
import type { Lease, RentDueOverview } from "@/lib/data/types"

export interface PropertyMonthsRowProps {
  leases: Lease[]
  dues: RentDueOverview[]
  currency: string
}

export function PropertyMonthsRow({
  leases,
  dues,
  currency,
}: PropertyMonthsRowProps) {
  const currentPeriod = toPeriod(todayISO())

  // Generate the last 12 month periods from (current - 11 months) to current
  const monthPeriods: string[] = []
  for (let i = 11; i >= 0; i--) {
    monthPeriods.push(addMonthsToPeriod(currentPeriod, -i))
  }

  // Pre-filter dues for this property's leases
  const leaseIds = new Set(leases.map((l) => l.id))
  const propertyDues = dues.filter((d) => leaseIds.has(d.lease_id))
  const duesByPeriod = new Map<string, RentDueOverview>()
  for (const d of propertyDues) {
    duesByPeriod.set(d.period, d)
  }

  let totalDue12 = 0
  let totalPaid12 = 0
  let occupiedMonths = 0

  const items = monthPeriods.map((period) => {
    const due = duesByPeriod.get(period) || null
    const date = new Date(period)
    const monthIndex = date.getMonth()
    const initial = MONTH_INITIALS[monthIndex]

    // Check if any lease covered this period
    const activeLease = leases.find((l) => {
      const start = toPeriod(l.start_date)
      if (period < start) return false
      if (l.end_date) {
        const end = toPeriod(l.end_date)
        if (period > end) return false
      }
      return true
    })

    const isVacant = !activeLease && !due

    if (!isVacant) {
      occupiedMonths++
      if (due) {
        totalDue12 += due.total_amount
        totalPaid12 += due.paid_amount
      } else if (activeLease) {
        totalDue12 += activeLease.rent_amount + activeLease.charges_amount
      }
    }

    return {
      period,
      initial,
      due,
      isVacant,
      status: due ? due.status : isVacant ? "vacant" : "a_venir",
    }
  })

  const recoveryRate =
    totalDue12 > 0 ? Math.round((totalPaid12 / totalDue12) * 100) : 100

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Row of 12 Pastilles */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {items.map((item) => {
            let pastilleStyle = "bg-muted text-muted-foreground border-border"
            let labelText = "À venir"

            if (item.isVacant) {
              pastilleStyle =
                "border-dashed border-border text-muted-foreground/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.06)_2px,rgba(255,255,255,0.06)_4px)]"
              labelText = "Vacant (non loué)"
            } else if (item.status === "paye") {
              pastilleStyle =
                "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
              labelText = `Payé (${formatMoney(item.due?.paid_amount || 0, currency)})`
            } else if (item.status === "partiel") {
              pastilleStyle =
                "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold"
              labelText = `Partiel (${formatMoney(item.due?.paid_amount || 0, currency)} / ${formatMoney(item.due?.total_amount || 0, currency)})`
            } else if (item.status === "impaye") {
              pastilleStyle =
                "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold"
              labelText = `Impayé (${formatMoney(item.due?.total_amount || 0, currency)})`
            }

            return (
              <Tooltip key={item.period}>
                <TooltipTrigger
                  render={
                    <div
                      aria-label={`${formatPeriod(item.period)} : ${labelText}`}
                      className={`h-9 rounded-lg border text-xs flex flex-col items-center justify-center font-mono cursor-default transition-transform hover:scale-105 ${pastilleStyle}`}
                    >
                      <span className="font-semibold text-xs">{item.initial}</span>
                    </div>
                  }
                />
                <TooltipContent side="top" className="text-xs p-2.5">
                  <p className="font-bold capitalize text-foreground">
                    {formatPeriod(item.period)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {labelText}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* 12 Months Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/60 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Encaissé (12 mois) : </span>
              <strong className="text-emerald-700 dark:text-emerald-400 num font-bold">
                {formatMoney(totalPaid12, currency)}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">Taux : </span>
              <strong className="text-foreground num font-bold">
                {recoveryRate} %
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            {occupiedMonths} mois occupé{occupiedMonths > 1 ? "s" : ""} sur 12
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
