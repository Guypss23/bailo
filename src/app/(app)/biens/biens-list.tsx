"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Building2,
  Home,
  Store,
  Car,
  Bed,
  Layers,
  Search,
  Plus,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  Archive,
} from "lucide-react"
import { PropertyDialog } from "./property-dialog"
import { StatusBadge } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { EmptyState } from "@/components/app/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { propertyTypeLabels } from "@/lib/validations/property"
import type { Property, Lease, Tenant, DueStatus } from "@/lib/data"

export interface PropertyListItem {
  property: Property
  activeLease?: Lease | null
  tenant?: Tenant | null
  currentDueStatus?: DueStatus | null
}

interface BiensListProps {
  items: PropertyListItem[]
  currency?: string
}

type FilterTab = "tous" | "occupes" | "vacants" | "archives"

const typeIcons: Record<string, React.ElementType> = {
  appartement: Building2,
  maison: Home,
  studio: Building2,
  chambre: Bed,
  local_commercial: Store,
  parking: Car,
  autre: Layers,
}

export function BiensList({ items, currency = "XAF" }: BiensListProps) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<FilterTab>("tous")

  // Filter items based on tab and search
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const isArchived = Boolean(item.property.archived_at)
      const isOccupied = Boolean(item.activeLease)

      // Tab filter
      if (tab === "archives") {
        if (!isArchived) return false
      } else {
        // tous, occupes, vacants exclude archived items
        if (isArchived) return false

        if (tab === "occupes" && !isOccupied) return false
        if (tab === "vacants" && isOccupied) return false
      }

      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase()
        const matchName = item.property.name.toLowerCase().includes(query)
        const matchCity = item.property.city.toLowerCase().includes(query)
        const matchAddress = item.property.address_line1.toLowerCase().includes(query)
        const matchTenant = item.tenant
          ? `${item.tenant.first_name} ${item.tenant.last_name}`.toLowerCase().includes(query)
          : false

        return matchName || matchCity || matchAddress || matchTenant
      }

      return true
    })
  }, [items, tab, search])

  // Global empty state (user has zero properties recorded)
  if (items.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-8">
          <EmptyState
            icon={Building2}
            title="Ajoutez votre premier bien"
            description="Commencez par ajouter votre premier logement, local commercial ou parking pour suivre vos baux et encaissements."
            action={<PropertyDialog />}
          />
        </CardContent>
      </Card>
    )
  }

  const counts = {
    tous: items.filter((i) => !i.property.archived_at).length,
    occupes: items.filter((i) => !i.property.archived_at && Boolean(i.activeLease)).length,
    vacants: items.filter((i) => !i.property.archived_at && !i.activeLease).length,
    archives: items.filter((i) => Boolean(i.property.archived_at)).length,
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/80 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setTab("tous")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "tous"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tous <span className="ml-1 text-[11px] text-muted-foreground num">({counts.tous})</span>
          </button>
          <button
            onClick={() => setTab("occupes")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "occupes"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Occupés <span className="ml-1 text-[11px] text-muted-foreground num">({counts.occupes})</span>
          </button>
          <button
            onClick={() => setTab("vacants")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab === "vacants"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Vacants <span className="ml-1 text-[11px] text-muted-foreground num">({counts.vacants})</span>
          </button>
          {counts.archives > 0 && (
            <button
              onClick={() => setTab("archives")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
                tab === "archives"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Archivés <span className="ml-1 text-[11px] text-muted-foreground num">({counts.archives})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, ville...)"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filtered Empty State */}
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-3">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">
              Aucun bien trouvé
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Aucun résultat ne correspond à la recherche « ${search} ».`
                : "Aucun bien dans cette catégorie pour le moment."}
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
        /* Grid of Cards (3 cols desktop, 2 cols tablet, 1 col mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const prop = item.property
            const Icon = typeIcons[prop.type] || Building2
            const isOccupied = Boolean(item.activeLease)
            const isArchived = Boolean(prop.archived_at)

            const totalRent = item.activeLease
              ? item.activeLease.rent_amount + item.activeLease.charges_amount
              : null

            return (
              <Link
                key={prop.id}
                href={`/biens/${prop.id}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[10px]"
              >
                <Card
                  className={cn(
                    "h-full flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                    isArchived && "opacity-70 bg-muted/20"
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top Row: Name and Type Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {prop.name}
                          </h2>
                          {isArchived && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 text-muted-foreground border-muted-foreground/40"
                            >
                              Archivé
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>{propertyTypeLabels[prop.type]}</span>
                          {prop.surface_m2 && (
                            <>
                              <span>·</span>
                              <span className="num">{prop.surface_m2} m²</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Address on 2 lines */}
                    <div className="text-xs text-muted-foreground space-y-0.5 leading-relaxed pt-1 border-t border-border/40">
                      <p className="truncate text-foreground/90 font-medium">
                        {prop.address_line1}
                        {prop.address_line2 ? `, ${prop.address_line2}` : ""}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {prop.postal_code ? `${prop.postal_code} ` : ""}
                        {prop.city} ({prop.country})
                      </p>
                    </div>

                    {/* Footer: Tenant / Vacant, Rent CC, StatusBadge */}
                    <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
                      {/* Left: Tenant or Vacant */}
                      <div className="min-w-0 flex items-center gap-1.5">
                        {isOccupied && item.tenant ? (
                          <>
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate max-w-[120px]">
                              {item.tenant.first_name} {item.tenant.last_name}
                            </span>
                          </>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 font-medium"
                          >
                            Vacant
                          </Badge>
                        )}
                      </div>

                      {/* Right: Rent CC & Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        {totalRent !== null ? (
                          <span className="font-semibold text-foreground num">
                            <Money amount={totalRent} currency={currency} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}

                        {/* Current month StatusBadge or "—" */}
                        {item.currentDueStatus ? (
                          <StatusBadge status={item.currentDueStatus} />
                        ) : (
                          <span className="text-muted-foreground px-1.5" title="Aucune échéance ce mois">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
