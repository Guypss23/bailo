"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  Search,
  Users,
  Building2,
  Phone,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { StatusBadge } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { TenantDialog } from "./tenant-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { DueStatus } from "@/lib/data"

export interface TenantTableRow {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  archived_at: string | null
  active_property_id: string | null
  active_property_name: string | null
  balance_due: number
  current_month_status: DueStatus | null
  has_unpaid: boolean
}

interface TenantsTableProps {
  data: TenantTableRow[]
  currency: string
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] || ""
  const l = lastName.trim()[0] || ""
  return (f + l).toUpperCase() || "?"
}

export function TenantsTable({ data, currency }: TenantsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "full_name", desc: false },
  ])
  const [search, setSearch] = useState("")
  const [onlyUnpaid, setOnlyUnpaid] = useState(false)
  const [tab, setTab] = useState<"tous" | "actifs" | "archives">("actifs")

  // Filter data by tab, unpaid filter, and text search
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Tab filter
      if (tab === "actifs" && row.archived_at !== null) return false
      if (tab === "archives" && row.archived_at === null) return false

      // 2. Unpaid filter
      if (onlyUnpaid && row.balance_due <= 0) return false

      // 3. Search query
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesName = row.full_name.toLowerCase().includes(query)
        const matchesEmail = row.email?.toLowerCase().includes(query) || false
        const matchesPhone = row.phone?.toLowerCase().includes(query) || false
        const matchesProp =
          row.active_property_name?.toLowerCase().includes(query) || false

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesProp) {
          return false
        }
      }

      return true
    })
  }, [data, tab, onlyUnpaid, search])

  // Counts for tabs and filter
  const counts = useMemo(() => {
    const actifs = data.filter((r) => r.archived_at === null).length
    const archives = data.filter((r) => r.archived_at !== null).length
    const unpaid = data.filter((r) => r.balance_due > 0).length
    return { tous: data.length, actifs, archives, unpaid }
  }, [data])

  const columns = useMemo<ColumnDef<TenantTableRow>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="flex items-center gap-1.5 font-semibold text-xs text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Locataire
              {isSorted === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 text-primary" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="w-3.5 h-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
              )}
            </button>
          )
        },
        cell: ({ row }) => {
          const tenant = row.original
          const initials = getInitials(tenant.first_name, tenant.last_name)
          const isArchived = Boolean(tenant.archived_at)

          return (
            <Link
              href={`/locataires/${tenant.id}`}
              className="group flex items-center gap-3 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md"
            >
              <Avatar size="sm" className="bg-primary/10 text-primary font-bold text-xs">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {tenant.full_name}
                  </span>
                  {isArchived && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1 text-muted-foreground"
                    >
                      Archivé
                    </Badge>
                  )}
                </div>
                {tenant.email && (
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {tenant.email}
                  </p>
                )}
              </div>
            </Link>
          )
        },
      },
      {
        accessorKey: "phone",
        header: () => <span className="text-xs font-semibold">Téléphone</span>,
        cell: ({ row }) => {
          const phone = row.original.phone
          if (!phone) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="text-xs text-muted-foreground hover:text-foreground font-mono inline-flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-muted-foreground" />
              {phone}
            </a>
          )
        },
      },
      {
        accessorKey: "active_property_name",
        header: () => <span className="text-xs font-semibold">Bien loué</span>,
        cell: ({ row }) => {
          const propName = row.original.active_property_name
          const propId = row.original.active_property_id
          if (!propName || !propId) {
            return (
              <Badge
                variant="secondary"
                className="text-[11px] font-normal bg-muted text-muted-foreground"
              >
                Sans bail actif
              </Badge>
            )
          }
          return (
            <Link
              href={`/biens/${propId}`}
              className="text-xs font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 max-w-[200px] truncate"
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{propName}</span>
            </Link>
          )
        },
      },
      {
        accessorKey: "balance_due",
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <div className="text-right">
              <button
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="inline-flex items-center gap-1.5 font-semibold text-xs text-foreground hover:text-primary transition-colors cursor-pointer ml-auto"
              >
                Solde dû
                {isSorted === "asc" ? (
                  <ArrowUp className="w-3.5 h-3.5 text-primary" />
                ) : isSorted === "desc" ? (
                  <ArrowDown className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                )}
              </button>
            </div>
          )
        },
        cell: ({ row }) => {
          const balance = row.original.balance_due
          if (balance <= 0) {
            return (
              <div className="text-right">
                <span className="text-xs text-muted-foreground num font-medium">
                  0 {currency}
                </span>
              </div>
            )
          }
          return (
            <div className="text-right">
              <span className="text-xs font-bold text-destructive num bg-destructive/10 px-2 py-0.5 rounded">
                <Money amount={balance} currency={currency} />
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "current_month_status",
        header: () => (
          <div className="text-center">
            <span className="text-xs font-semibold">Ce mois</span>
          </div>
        ),
        cell: ({ row }) => {
          const status = row.original.current_month_status
          return (
            <div className="flex justify-center">
              {status ? (
                <StatusBadge status={status} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          return (
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Link href={`/locataires/${row.original.id}`}>
                  Voir <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          )
        },
      },
    ],
    [currency]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Global empty state: zero tenants created in Bailo
  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Ajoutez votre premier locataire
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Enregistrez vos locataires pour leur rattacher un bail, suivre leurs paiements et générer leurs quittances.
            </p>
          </div>
          <div className="pt-2">
            <TenantDialog />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs and Impayés toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setTab("actifs")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
                tab === "actifs"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Actifs{" "}
              <span className="ml-1 text-[11px] text-muted-foreground num">
                ({counts.actifs})
              </span>
            </button>
            <button
              onClick={() => setTab("tous")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
                tab === "tous"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tous{" "}
              <span className="ml-1 text-[11px] text-muted-foreground num">
                ({counts.tous})
              </span>
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
                Archivés{" "}
                <span className="ml-1 text-[11px] text-muted-foreground num">
                  ({counts.archives})
                </span>
              </button>
            )}
          </div>

          {/* Filter "Avec impayés" */}
          <Button
            type="button"
            variant={onlyUnpaid ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyUnpaid(!onlyUnpaid)}
            className={cn(
              "h-8 text-xs font-medium gap-1.5 transition-colors",
              onlyUnpaid && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Avec impayés
            {counts.unpaid > 0 && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] num",
                  onlyUnpaid
                    ? "bg-white/20 text-white"
                    : "bg-destructive/10 text-destructive font-bold"
                )}
              >
                {counts.unpaid}
              </span>
            )}
          </Button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, bien, tél...)"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filtered Empty State */}
      {filteredData.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-3">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">
              Aucun locataire trouvé
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || onlyUnpaid
                ? "Aucun résultat ne correspond à vos filtres actuels."
                : "Aucun locataire dans cette section pour le moment."}
            </p>
            {(search || onlyUnpaid) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setOnlyUnpaid(false)
                }}
                className="text-xs"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet View: TanStack Table (hidden on mobile < 768px) */}
          <div className="hidden md:block border border-border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-border bg-muted/20">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="py-2.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View: List of Cards (visible only on mobile < 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredData.map((tenant) => {
              const initials = getInitials(tenant.first_name, tenant.last_name)
              const isArchived = Boolean(tenant.archived_at)

              return (
                <Link
                  key={tenant.id}
                  href={`/locataires/${tenant.id}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <Card className="border-border transition-colors hover:border-primary/50">
                    <CardContent className="p-4 space-y-3">
                      {/* Top Header: Avatar, Name & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar size="default" className="bg-primary/10 text-primary font-bold text-xs shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {tenant.full_name}
                            </p>
                            {tenant.active_property_name ? (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{tenant.active_property_name}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Sans bail actif
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Current month status */}
                        <div className="shrink-0">
                          {tenant.current_month_status ? (
                            <StatusBadge status={tenant.current_month_status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>

                      {/* Contact row if email/phone present */}
                      {(tenant.phone || tenant.email) && (
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {tenant.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3" />
                              {tenant.phone}
                            </span>
                          )}
                          {tenant.email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{tenant.email}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Solde dû and link */}
                      <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Solde dû :</span>
                        {tenant.balance_due > 0 ? (
                          <span className="font-bold text-destructive num bg-destructive/10 px-2 py-0.5 rounded">
                            <Money amount={tenant.balance_due} currency={currency} />
                          </span>
                        ) : (
                          <span className="font-medium text-foreground num">
                            0 {currency}
                          </span>
                        )}
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
