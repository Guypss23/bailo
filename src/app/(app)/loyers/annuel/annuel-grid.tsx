"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Ban,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react"
import { PaymentSheet } from "@/components/app/payment-sheet"
import {
  formatMoney,
  formatPeriod,
  formatDate,
  todayISO,
  toPeriod,
} from "@/lib/format"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  type AnnualGridData,
  type AnnualGridRow,
  type AnnualGridMonthCell,
  MONTH_SHORT_LABELS,
  MONTH_INITIALS,
} from "@/lib/domain/annual-grid"
import type { EnrichedDueOverview, DueStatus } from "@/lib/data/types"

export interface AnnuelGridProps {
  data: AnnualGridData
  currency: string
  viewMode: "montants" | "statuts"
}

export function AnnuelGrid({ data, currency, viewMode }: AnnuelGridProps) {
  const currentPeriod = toPeriod(todayISO())
  const currentYear = new Date().getFullYear()
  const isCurrentYear = data.year === currentYear
  const currentMonthIndex = isCurrentYear ? new Date().getMonth() : -1

  // PaymentSheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeDue, setActiveDue] = useState<EnrichedDueOverview | null>(null)

  const handleCellClick = (cell: AnnualGridMonthCell) => {
    if (cell.due) {
      setActiveDue(cell.due)
      setSheetOpen(true)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {data.rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">
              Aucun bail actif pour cette sélection
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Aucun bail n&apos;a été trouvé pour l&apos;année {data.year} avec ce filtre.
              Modifiez vos critères ou consultez les loyers mensuels.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table with isolated horizontal scrolling */}
            <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto relative">
                <table className="w-full text-xs text-left border-collapse min-w-[960px]">
                  {/* Header Row */}
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      {/* Sticky First Column: Locataire & Bien */}
                      <th
                        scope="col"
                        className="sticky left-0 z-20 bg-muted/95 backdrop-blur-xs px-4 py-3 min-w-[200px] max-w-[240px] font-semibold text-foreground border-r border-border"
                      >
                        Locataire & Bien
                      </th>

                      {/* 12 Months Columns */}
                      {MONTH_SHORT_LABELS.map((monthLabel, idx) => {
                        const isCurrentMonthCol = idx === currentMonthIndex
                        return (
                          <th
                            key={monthLabel}
                            scope="col"
                            className={`px-2 py-3 text-center min-w-[68px] font-semibold ${
                              isCurrentMonthCol
                                ? "bg-primary/10 text-primary font-bold border-x border-primary/20"
                                : ""
                            }`}
                          >
                            <span className="block">{monthLabel}</span>
                          </th>
                        )
                      })}

                      {/* Total Payé */}
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 min-w-[100px] border-l border-border"
                      >
                        Total payé
                      </th>

                      {/* Reste Dû */}
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-semibold text-amber-700 dark:text-amber-400 min-w-[90px] pr-4"
                      >
                        Reste dû
                      </th>
                    </tr>
                  </thead>

                  {/* Body Rows: One row per lease */}
                  <tbody className="divide-y divide-border/60">
                    {data.rows.map((row) => {
                      const tenantName = row.tenant
                        ? `${row.tenant.first_name} ${row.tenant.last_name}`
                        : "Locataire"
                      const propertyName = row.property ? row.property.name : "Bien"

                      return (
                        <tr
                          key={row.lease.id}
                          className="hover:bg-muted/15 transition-colors group"
                        >
                          {/* Sticky Row Header */}
                          <th
                            scope="row"
                            className="sticky left-0 z-20 bg-card group-hover:bg-muted/30 transition-colors px-4 py-2.5 font-normal border-r border-border"
                          >
                            <div className="space-y-0.5">
                              <Link
                                href={`/baux/${row.lease.id}`}
                                className="font-semibold text-foreground hover:underline block truncate max-w-[210px]"
                                title={tenantName}
                              >
                                {tenantName}
                              </Link>
                              <p
                                className="text-[11px] text-muted-foreground truncate max-w-[210px]"
                                title={propertyName}
                              >
                                {propertyName}
                              </p>
                            </div>
                          </th>

                          {/* 12 Months Cells */}
                          {row.cells.map((cell) => {
                            const isCurrentMonthCol =
                              cell.monthIndex === currentMonthIndex
                            const ariaLabel = cell.isOutOfLease
                              ? `${tenantName}, ${cell.monthLabel} ${data.year}, hors période de bail`
                              : `${tenantName}, ${cell.monthLabel} ${data.year}, ${
                                  cell.status === "paye"
                                    ? "payé"
                                    : cell.status === "partiel"
                                    ? "partiel"
                                    : cell.status === "impaye"
                                    ? "impayé"
                                    : "à venir"
                                }, ${formatMoney(cell.paidAmount, currency)} sur ${formatMoney(
                                  cell.totalAmount,
                                  currency
                                )}`

                            if (cell.isOutOfLease) {
                              return (
                                <td
                                  key={cell.period}
                                  aria-label={ariaLabel}
                                  className={`p-1 text-center border-r border-border/40 ${
                                    isCurrentMonthCol
                                      ? "bg-primary/5 border-x border-primary/20"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className="h-10 w-full rounded-md border border-dashed border-border/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.04)_4px,rgba(0,0,0,0.04)_8px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.04)_4px,rgba(255,255,255,0.04)_8px)] flex items-center justify-center text-muted-foreground/30 cursor-default"
                                    title="Hors période de bail"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </div>
                                </td>
                              )
                            }

                            // Interactive cell styles based on status
                            let cellBg =
                              "bg-muted/20 text-muted-foreground border-border/60 hover:bg-muted/40"
                            let statusText = "À venir"

                            if (cell.status === "paye") {
                              cellBg =
                                "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                              statusText = "Payé"
                            } else if (cell.status === "partiel") {
                              cellBg =
                                "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                              statusText = "Partiel"
                            } else if (cell.status === "impaye") {
                              cellBg =
                                "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                              statusText = "Impayé"
                            }

                            return (
                              <td
                                key={cell.period}
                                className={`p-1 text-center border-r border-border/40 ${
                                  isCurrentMonthCol
                                    ? "bg-primary/5 border-x border-primary/20"
                                    : ""
                                }`}
                              >
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <button
                                        type="button"
                                        onClick={() => handleCellClick(cell)}
                                        aria-label={ariaLabel}
                                        className={`w-full h-10 rounded-md border flex flex-col items-center justify-center relative overflow-hidden transition-all text-[11px] font-medium focus:outline-hidden focus:ring-2 focus:ring-primary ${cellBg}`}
                                      >
                                        {viewMode === "montants" ? (
                                          <span className="num font-semibold truncate px-1">
                                            {cell.paidAmount > 0
                                              ? formatMoney(cell.paidAmount, currency)
                                              : cell.status === "a_venir"
                                              ? "—"
                                              : "0"}
                                          </span>
                                        ) : (
                                          <span className="flex items-center justify-center">
                                            {cell.status === "paye" ? (
                                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            ) : cell.status === "partiel" ? (
                                              <Clock className="w-3.5 h-3.5" />
                                            ) : cell.status === "impaye" ? (
                                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                            ) : (
                                              <span className="text-[10px] text-muted-foreground">
                                                —
                                              </span>
                                            )}
                                          </span>
                                        )}

                                        {/* Partial progress line at the bottom */}
                                        {cell.status === "partiel" && (
                                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-200/50 dark:bg-amber-900/50">
                                            <div
                                              className="h-full bg-amber-600 dark:bg-amber-400"
                                              style={{
                                                width: `${Math.round(
                                                  cell.paidRatio * 100
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        )}
                                      </button>
                                    }
                                  />
                                  <TooltipContent side="top" className="text-xs p-3 space-y-1.5 max-w-xs">
                                    <div className="font-semibold text-foreground flex items-center justify-between border-b border-border/60 pb-1">
                                      <span className="capitalize">{formatPeriod(cell.period)}</span>
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                        {statusText}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5 text-muted-foreground text-[11px]">
                                      <div className="flex justify-between">
                                        <span>Dû :</span>
                                        <span className="num font-semibold text-foreground">
                                          {formatMoney(cell.totalAmount, currency)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Payé :</span>
                                        <span className="num font-semibold text-emerald-600 dark:text-emerald-400">
                                          {formatMoney(cell.paidAmount, currency)}
                                        </span>
                                      </div>
                                      {cell.balance > 0 && (
                                        <div className="flex justify-between">
                                          <span>Reste :</span>
                                          <span className="num font-bold text-amber-600 dark:text-amber-400">
                                            {formatMoney(cell.balance, currency)}
                                          </span>
                                        </div>
                                      )}
                                      {cell.daysLate > 0 && cell.balance > 0 && (
                                        <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold pt-0.5">
                                          <span>Retard :</span>
                                          <span>{cell.daysLate} jours</span>
                                        </div>
                                      )}
                                      {cell.lastPaidAt && (
                                        <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                                          <span>Réglement :</span>
                                          <span>{formatDate(cell.lastPaidAt)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-primary/80 pt-1 text-center font-medium">
                                      Cliquez pour encaisser ou voir le détail
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            )
                          })}

                          {/* Row Total Payé */}
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400 num border-l border-border">
                            {formatMoney(row.totalPaid, currency)}
                          </td>

                          {/* Row Reste Dû */}
                          <td className="px-3 py-2.5 text-right font-bold num pr-4">
                            <span
                              className={
                                row.totalBalance > 0
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                              }
                            >
                              {formatMoney(row.totalBalance, currency)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* Table Footer: Monthly summaries */}
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30 font-semibold text-foreground">
                      <th
                        scope="row"
                        className="sticky left-0 z-20 bg-muted/95 backdrop-blur-xs px-4 py-3 text-xs font-bold border-r border-border"
                      >
                        Total mensuel
                      </th>

                      {data.monthSummaries.map((m) => {
                        const isCurrentMonthCol =
                          m.monthIndex === currentMonthIndex
                        return (
                          <td
                            key={m.period}
                            className={`px-1 py-3 text-center border-r border-border/40 ${
                              isCurrentMonthCol
                                ? "bg-primary/10 border-x border-primary/20"
                                : ""
                            }`}
                          >
                            <p className="text-[11px] font-bold num text-emerald-700 dark:text-emerald-400 truncate">
                              {formatMoney(m.totalPaid, currency)}
                            </p>
                            <p className="text-[10px] text-muted-foreground num truncate">
                              / {formatMoney(m.totalDue, currency)}
                            </p>
                            <div className="mt-1 w-10 mx-auto h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 dark:bg-emerald-400"
                                style={{ width: `${m.recoveryRate}%` }}
                              />
                            </div>
                          </td>
                        )
                      })}

                      {/* Grand Total Payé */}
                      <td className="px-3 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 num border-l border-border">
                        {formatMoney(data.kpis.totalPaid, currency)}
                      </td>

                      {/* Grand Total Reste */}
                      <td className="px-3 py-3 text-right font-bold text-amber-700 dark:text-amber-400 num pr-4">
                        {formatMoney(
                          data.kpis.totalDue - data.kpis.totalPaid,
                          currency
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status Legend under table */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-muted-foreground border-t border-border/60">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                  Légende :
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                    <Check className="w-2 h-2 text-emerald-700 dark:text-emerald-400" />
                  </span>
                  <span>Payé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 flex items-center justify-center">
                    <Clock className="w-2 h-2 text-amber-700 dark:text-amber-400" />
                  </span>
                  <span>Partiel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-2 h-2 text-rose-700 dark:text-rose-400" />
                  </span>
                  <span>Impayé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-muted border border-border" />
                  <span>À venir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs border border-dashed border-border bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
                  <span>Hors bail</span>
                </div>
              </div>

              <p className="text-[11px] italic">
                Astuce : Cliquez sur n&apos;importe quelle case pour ouvrir le panneau
                d&apos;encaissement.
              </p>
            </div>

            {/* Mobile View: Cards with 12 pastilles */}
            <div className="block md:hidden space-y-3.5">
              {data.rows.map((row) => {
                const tenantName = row.tenant
                  ? `${row.tenant.first_name} ${row.tenant.last_name}`
                  : "Locataire"
                const propertyName = row.property ? row.property.name : "Bien"

                return (
                  <div
                    key={row.lease.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs"
                  >
                    {/* Header: Tenant & Property */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <Link
                          href={`/baux/${row.lease.id}`}
                          className="font-semibold text-sm text-foreground hover:underline"
                        >
                          {tenantName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{propertyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Encaissé {data.year}</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 num">
                          {formatMoney(row.totalPaid, currency)}
                        </p>
                      </div>
                    </div>

                    {/* 12 Pastilles: J F M A M J J A S O N D */}
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[11px] font-medium text-muted-foreground mb-2">
                        12 mois ({data.year}) :
                      </p>
                      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                        {row.cells.map((cell) => {
                          const initial = MONTH_INITIALS[cell.monthIndex]
                          let pastilleClass =
                            "bg-muted/40 text-muted-foreground border-border/40"

                          if (cell.isOutOfLease) {
                            pastilleClass =
                              "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)] text-muted-foreground/30 border-border/40 cursor-default"
                          } else if (cell.status === "paye") {
                            pastilleClass =
                              "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
                          } else if (cell.status === "partiel") {
                            pastilleClass =
                              "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold"
                          } else if (cell.status === "impaye") {
                            pastilleClass =
                              "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold"
                          }

                          return (
                            <button
                              key={cell.period}
                              type="button"
                              disabled={cell.isOutOfLease}
                              onClick={() => handleCellClick(cell)}
                              aria-label={`${cell.monthLabel} : ${
                                cell.isOutOfLease ? "Hors bail" : cell.status
                              }`}
                              className={`h-8 rounded-lg border text-xs flex items-center justify-center font-mono transition-transform active:scale-95 ${pastilleClass}`}
                            >
                              {initial}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Mobile Summary footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="text-muted-foreground">
                        Reste dû :{" "}
                        <strong
                          className={`num ${
                            row.totalBalance > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          {formatMoney(row.totalBalance, currency)}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">
                        Total dû :{" "}
                        <strong className="num text-foreground">
                          {formatMoney(row.totalDue, currency)}
                        </strong>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PaymentSheet integration */}
        <PaymentSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          due={activeDue}
          currency={currency}
          initialMode="record"
        />
      </div>
    </TooltipProvider>
  )
}
