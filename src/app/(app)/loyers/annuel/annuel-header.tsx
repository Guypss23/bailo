"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  Coins,
  Percent,
  Clock,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney } from "@/lib/format"
import type { Property } from "@/lib/data/types"
import type { AnnualGridData } from "@/lib/domain/annual-grid"

export interface AnnuelHeaderProps {
  year: number
  kpis: AnnualGridData["kpis"]
  currency: string
  properties: Property[]
  activePropertyFilter: string
  viewMode: "montants" | "statuts"
  onViewModeChange: (mode: "montants" | "statuts") => void
}

export function AnnuelHeader({
  year,
  kpis,
  currency,
  properties,
  activePropertyFilter,
  viewMode,
  onViewModeChange,
}: AnnuelHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const isCurrentYear = year === currentYear

  const navigateToYear = (targetYear: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("annee", String(targetYear))
    router.push(`/loyers/annuel?${params.toString()}`)
  }

  const propertyItems = React.useMemo(() => {
    const map: Record<string, string> = { all: "Tous les biens" }
    for (const p of properties) {
      map[p.id] = p.name
    }
    return map
  }, [properties])

  const [selectedPropId, setSelectedPropId] = React.useState(activePropertyFilter || "all")

  React.useEffect(() => {
    setSelectedPropId(activePropertyFilter || "all")
  }, [activePropertyFilter])

  const handlePropertyFilterChange = (propId: string | null) => {
    const nextVal = propId || "all"
    setSelectedPropId(nextVal)
    const params = new URLSearchParams(searchParams.toString())
    if (!propId || propId === "all") {
      params.delete("bien")
    } else {
      params.set("bien", propId)
    }
    router.push(`/loyers/annuel?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Suivi annuel des loyers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Grille 12 mois pour repérer en un clin d’œil les retards et le total annuel encaissé.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick "Cette année" button */}
          {!isCurrentYear && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToYear(currentYear)}
              className="h-8 text-xs gap-1.5 border-dashed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Cette année
            </Button>
          )}

          {/* Year Selector */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateToYear(year - 1)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Année précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold px-3 num font-mono text-foreground">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateToYear(year + 1)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Année suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View Mode Toggle: Montants / Statuts */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("montants")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "montants"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Montants
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("statuts")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "statuts"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Statuts
            </button>
          </div>

          {/* Property Filter */}
          <div className="w-48 sm:w-56">
            <Select
              items={propertyItems}
              value={selectedPropId}
              onValueChange={handlePropertyFilterChange}
            >
              <SelectTrigger className="h-8 text-xs bg-card w-full justify-between gap-2">
                <SelectValue placeholder="Tous les biens">
                  {(val: string | null) => (val && propertyItems[val]) ? propertyItems[val] : "Tous les biens"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="Tous les biens" className="text-xs">
                  Tous les biens
                </SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id} label={p.name} className="text-xs truncate">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link to Monthly View */}
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/loyers">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              Vue mensuelle
            </Link>
          </Button>

          {/* Menu Exporter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-medium border-border hover:bg-accent"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Exporter</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Exports comptables {year}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/api/exports/payments_csv?annee=${year}`
                }}
                className="text-xs cursor-pointer py-2"
              >
                <FileText className="w-4 h-4 mr-2 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    Paiements de l&apos;année (CSV)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Ventilation loyer et charges au prorata
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/api/exports/properties_csv?annee=${year}`
                }}
                className="text-xs cursor-pointer py-2"
              >
                <Building2 className="w-4 h-4 mr-2 text-[#C98A0B] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    Récapitulatif par bien (CSV)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Pour la déclaration de revenus fonciers
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/api/exports/annual_excel?annee=${year}`
                }}
                className="text-xs cursor-pointer py-2"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#1E8A5A] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    Classeur Excel (.xlsx)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Grille, paiements et récapitulatif
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Encaissé */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Encaissé {year}
            </p>
            <p className="text-base sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 num mt-1">
              {formatMoney(kpis.totalPaid, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sur l&apos;exercice</p>
          </CardContent>
        </Card>

        {/* Attendu */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total attendu
            </p>
            <p className="text-base sm:text-xl font-bold text-foreground num mt-1">
              {formatMoney(kpis.totalDue, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Loyers exigibles</p>
          </CardContent>
        </Card>

        {/* Taux de recouvrement */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Recouvrement
                </p>
                <span className="text-xs font-bold text-foreground num">
                  {kpis.recoveryRate} %
                </span>
              </div>
              <p className="text-base sm:text-xl font-bold text-foreground num mt-1">
                {kpis.recoveryRate} %
              </p>
            </div>
            <div className="mt-2">
              <Progress value={kpis.recoveryRate} className="h-1.5 bg-muted/60" />
            </div>
          </CardContent>
        </Card>

        {/* Échéances impayées */}
        <Card className="border-border bg-card/75">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Impayés & Partiels
            </p>
            <p
              className={`text-base sm:text-xl font-bold num mt-1 ${
                kpis.unpaidCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }`}
            >
              {kpis.unpaidCount} {kpis.unpaidCount <= 1 ? "mois" : "mois"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpis.unpaidCount > 0 ? "À régulariser" : "Aucun impayé"}
            </p>
          </CardContent>
        </Card>

        {/* Retard moyen */}
        <Card className="border-border bg-card/75 col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Retard moyen
            </p>
            <p className="text-base sm:text-xl font-bold text-foreground num mt-1">
              {kpis.avgLateDays} j
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sur les loyers en retard</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
