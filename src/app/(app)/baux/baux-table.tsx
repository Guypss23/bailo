"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  Plus,
  Home,
  Store,
  Car,
  Bed,
  Layers,
} from "lucide-react"
import { StatusBadge } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { LeaseStatus, DueStatus } from "@/lib/data"

export interface LeaseTableRow {
  id: string
  property_id: string
  property_name: string
  property_type: string
  tenant_id: string
  tenant_name: string
  tenant_initials: string
  status: LeaseStatus
  start_date: string
  end_date: string | null
  rent_amount: number
  charges_amount: number
  total_rent_cc: number
  current_month_status: DueStatus | null
}

interface BauxTableProps {
  leases: LeaseTableRow[]
  currency: string
}

const typeIcons: Record<string, React.ElementType> = {
  appartement: Building2,
  maison: Home,
  studio: Building2,
  chambre: Bed,
  local_commercial: Store,
  parking: Car,
  autre: Layers,
}

export function BauxTable({ leases, currency }: BauxTableProps) {
  const [tab, setTab] = useState<LeaseStatus>("actif")
  const [search, setSearch] = useState("")

  const counts = useMemo(() => {
    const actif = leases.filter((l) => l.status === "actif").length
    const termine = leases.filter((l) => l.status === "termine").length
    const brouillon = leases.filter((l) => l.status === "brouillon").length
    return { actif, termine, brouillon, total: leases.length }
  }, [leases])

  const filtered = useMemo(() => {
    return leases.filter((l) => {
      if (l.status !== tab) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTenant = l.tenant_name.toLowerCase().includes(q)
        const matchProp = l.property_name.toLowerCase().includes(q)
        if (!matchTenant && !matchProp) return false
      }
      return true
    })
  }, [leases, tab, search])

  // Global empty state: zero leases created in Bailo
  if (leases.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Aucun bail enregistré
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Le bail associe un bien et un locataire, définit le montant du loyer et la date d&apos;échéance mensuelle.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild size="sm" className="font-medium gap-1.5">
              <Link href="/baux/nouveau">
                <Plus className="w-4 h-4" />
                Créer un bail
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs: Actifs / Terminés / Brouillons */}
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          <button
            onClick={() => setTab("actif")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "actif"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Actifs{" "}
            <span className="ml-1 text-[11px] text-muted-foreground num">
              ({counts.actif})
            </span>
          </button>
          <button
            onClick={() => setTab("termine")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "termine"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Terminés{" "}
            <span className="ml-1 text-[11px] text-muted-foreground num">
              ({counts.termine})
            </span>
          </button>
          <button
            onClick={() => setTab("brouillon")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "brouillon"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Brouillons{" "}
            <span className="ml-1 text-[11px] text-muted-foreground num">
              ({counts.brouillon})
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (locataire, bien...)"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filtered Empty State */}
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">
              Aucun bail trouvé
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? "Aucun résultat ne correspond à votre recherche."
                : `Aucun bail dans l'onglet « ${
                    tab === "actif"
                      ? "Actifs"
                      : tab === "termine"
                      ? "Terminés"
                      : "Brouillons"
                  } » pour le moment.`}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="text-xs"
              >
                Effacer la recherche
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block border border-border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/20">
                  <TableHead className="text-xs">Locataire</TableHead>
                  <TableHead className="text-xs">Logement</TableHead>
                  <TableHead className="text-xs text-right">Loyer CC</TableHead>
                  <TableHead className="text-xs">Date de début</TableHead>
                  <TableHead className="text-xs">Date de fin</TableHead>
                  <TableHead className="text-xs text-center">Ce mois</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lease) => {
                  const Icon = typeIcons[lease.property_type] || Building2

                  return (
                    <TableRow
                      key={lease.id}
                      className="border-border hover:bg-muted/30 transition-colors"
                    >
                      {/* Tenant */}
                      <TableCell className="py-3">
                        <Link
                          href={`/locataires/${lease.tenant_id}`}
                          className="flex items-center gap-2.5 font-semibold text-xs text-foreground hover:text-primary transition-colors"
                        >
                          <Avatar size="sm" className="bg-primary/10 text-primary font-bold text-xs">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {lease.tenant_initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[140px]">{lease.tenant_name}</span>
                        </Link>
                      </TableCell>

                      {/* Property */}
                      <TableCell className="py-3">
                        <Link
                          href={`/biens/${lease.property_id}`}
                          className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors font-medium truncate max-w-[160px]"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{lease.property_name}</span>
                        </Link>
                      </TableCell>

                      {/* Rent CC */}
                      <TableCell className="py-3 text-right">
                        <span className="text-xs font-bold text-foreground num">
                          <Money amount={lease.total_rent_cc} currency={currency} />
                        </span>
                      </TableCell>

                      {/* Start Date */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {formatDate(lease.start_date)}
                      </TableCell>

                      {/* End Date */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {lease.end_date ? (
                          formatDate(lease.end_date)
                        ) : (
                          <span className="text-muted-foreground italic">Sans date de fin</span>
                        )}
                      </TableCell>

                      {/* Current Month Status */}
                      <TableCell className="py-3 text-center">
                        {lease.current_month_status ? (
                          <StatusBadge status={lease.current_month_status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Link href={`/baux/${lease.id}`}>
                            Consulter <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((lease) => {
              const Icon = typeIcons[lease.property_type] || Building2

              return (
                <Link
                  key={lease.id}
                  href={`/baux/${lease.id}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <Card className="border-border transition-colors hover:border-primary/50">
                    <CardContent className="p-4 space-y-3">
                      {/* Top: Property & Month Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {lease.property_name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <span className="font-medium text-foreground">{lease.tenant_name}</span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {lease.current_month_status ? (
                            <StatusBadge status={lease.current_month_status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Du {formatDate(lease.start_date)}
                        </span>
                        <span>
                          {lease.end_date ? `au ${formatDate(lease.end_date)}` : "En cours"}
                        </span>
                      </div>

                      {/* Footer: Rent CC */}
                      <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Loyer charges comprises :</span>
                        <span className="text-sm font-bold text-primary num">
                          <Money amount={lease.total_rent_cc} currency={currency} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
