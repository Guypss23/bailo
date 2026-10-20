"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  CalendarRange,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GenerateMonthlyReceiptsDialog } from "@/components/app/generate-monthly-receipts-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  formatMoney,
  formatPeriod,
  todayISO,
  toPeriod,
  addMonthsToPeriod,
  parseISODateParts,
} from "@/lib/format"
import type { EnrichedDueOverview, Lease, Tenant, Property } from "@/lib/data/types"
import { TenantPaymentDialog } from "@/components/app/tenant-payment-dialog"

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export interface LoyersHeaderProps {
  currentPeriod: string // 'YYYY-MM-01'
  dues: EnrichedDueOverview[]
  currency: string
  activeStatusFilter?: string
  leases?: Lease[]
  tenants?: Tenant[]
  properties?: Property[]
}

export function LoyersHeader({
  currentPeriod,
  dues,
  currency,
  activeStatusFilter,
  leases = [],
  tenants = [],
  properties = [],
}: LoyersHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const todayPeriod = toPeriod(todayISO())
  const isCurrentMonth = currentPeriod === todayPeriod

  const { year: currentYear, month: currentMonthNum } = parseISODateParts(currentPeriod)
  const [pickerYear, setPickerYear] = useState<number>(currentYear)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Compute 4 Indicators
  const totalDue = dues.reduce((acc, d) => acc + d.total_amount, 0)
  const totalPaid = dues.reduce((acc, d) => acc + d.paid_amount, 0)
  const totalBalance = dues.reduce((acc, d) => acc + d.balance, 0)
  const recoveryRate = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 100

  const countPaid = dues.filter((d) => d.status === "paye").length
  const countUnpaid = dues.filter((d) => d.status === "impaye" || d.status === "partiel").length

  const navigateToMonth = (targetPeriod: string) => {
    const moisParam = targetPeriod.substring(0, 7) // 'YYYY-MM'
    const params = new URLSearchParams(searchParams.toString())
    params.set("mois", moisParam)
    router.push(`/loyers?${params.toString()}`)
    setPickerOpen(false)
  }

  const prevPeriod = addMonthsToPeriod(currentPeriod, -1)
  const nextPeriod = addMonthsToPeriod(currentPeriod, 1)

  return (
    <div className="space-y-5">
      {/* Top Bar: Title & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Loyers du mois
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Suivi des encaissements et gestion des règlements.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Action pour générer les quittances du mois */}
          <GenerateMonthlyReceiptsDialog dues={dues} currentPeriod={currentPeriod} />

          {/* Quick "Ce mois-ci" reset button */}
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToMonth(todayPeriod)}
              className="h-8 text-xs gap-1.5 border-dashed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ce mois-ci
            </Button>
          )}

          {/* Month Selector with Popover */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateToMonth(prevPeriod)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold capitalize tracking-tight hover:bg-muted/50"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    {formatPeriod(currentPeriod)}
                  </Button>
                }
              />
              <PopoverContent className="w-64 p-3" align="center">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {pickerYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => {
                    const monthIndex = idx + 1
                    const monthStr = String(monthIndex).padStart(2, "0")
                    const target = `${pickerYear}-${monthStr}-01`
                    const isSelected = target === currentPeriod

                    return (
                      <Button
                        key={name}
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        onClick={() => navigateToMonth(target)}
                        className={`h-8 text-xs font-medium ${
                          isSelected ? "bg-primary text-primary-foreground font-semibold" : ""
                        }`}
                      >
                        {name.slice(0, 4)}
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateToMonth(nextPeriod)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lien vers le suivi annuel */}
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/loyers/annuel">
              <CalendarRange className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              Suivi annuel
            </Link>
          </Button>

          {/* Règlement global / Apurement en cascade */}
          {tenants.length > 0 && (
            <Button
              size="sm"
              onClick={() => setPaymentDialogOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Encaisser un règlement</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Indicators / KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Attendu */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Attendu
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground num mt-1">
              {formatMoney(totalDue, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {dues.length} {dues.length <= 1 ? "échéance exigible" : "échéances exigibles"}
            </p>
          </CardContent>
        </Card>

        {/* Encaissé */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Encaissé
            </p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 num mt-1">
              {formatMoney(totalPaid, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {countPaid} {countPaid <= 1 ? "loyer intégralement réglé" : "loyers réglés"}
            </p>
          </CardContent>
        </Card>

        {/* Reste à percevoir */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Reste à percevoir
            </p>
            <p
              className={`text-lg sm:text-2xl font-bold num mt-1 ${
                totalBalance > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
              }`}
            >
              {formatMoney(totalBalance, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {countUnpaid > 0
                ? `${countUnpaid} en retard ou incomplet`
                : "Aucun impayé"}
            </p>
          </CardContent>
        </Card>

        {/* Taux de recouvrement */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recouvrement
                </p>
                <span className="text-xs font-bold text-foreground num">
                  {recoveryRate} %
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground num mt-1">
                {recoveryRate} %
              </p>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={recoveryRate} className="h-2 bg-muted/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogue d'encaissement global avec cascade */}
      {tenants.length > 0 && (
        <TenantPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          tenants={tenants}
          leases={leases}
          propertiesMap={Object.fromEntries(properties.map((p) => [p.id, p]))}
          dueOverviews={dues}
          currency={currency}
        />
      )}
    </div>
  )
}
