"use client"

import * as React from "react"
import { useState, useMemo, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Search,
  Check,
  MoreHorizontal,
  CreditCard,
  Receipt,
  Send,
  Eye,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowUpDown,
  Filter,
  X,
  Mail,
} from "lucide-react"
import { format } from "date-fns"
import { StatusBadge } from "@/components/app/status-badge"
import { PaymentSheet } from "@/components/app/payment-sheet"
import { ManualReminderDialog } from "@/components/app/manual-reminder-dialog"
import { bulkPayDuesAction } from "./actions"
import { sendQuittanceEmailAction } from "@/lib/email/actions"
import { formatMoney, formatDate, parseISODate } from "@/lib/format"
import type { EnrichedDueOverview, DueStatus } from "@/lib/data/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface LoyersTableProps {
  dues: EnrichedDueOverview[]
  currency: string
  currentPeriod: string
  initialStatusFilter?: string
}

type TabKey = "tous" | "impaye" | "partiel" | "paye" | "a_venir"

function defaultDueComparator(a: EnrichedDueOverview, b: EnrichedDueOverview): number {
  const getRank = (status: DueStatus) => {
    if (status === "impaye" || status === "partiel") return 0
    if (status === "a_venir") return 1
    return 2 // 'paye'
  }

  const rankA = getRank(a.status)
  const rankB = getRank(b.status)

  if (rankA !== rankB) {
    return rankA - rankB
  }

  // Impayés & partiels : retard décroissant, puis plus gros solde
  if (rankA === 0) {
    if (b.days_late !== a.days_late) {
      return b.days_late - a.days_late
    }
    return b.balance - a.balance
  }

  // À venir : échéance la plus proche en premier
  if (rankA === 1) {
    return a.due_date.localeCompare(b.due_date)
  }

  // Payés : dernier paiement le plus récent
  return (b.last_paid_at || "").localeCompare(a.last_paid_at || "")
}

export function LoyersTable({
  dues,
  currency,
  currentPeriod,
  initialStatusFilter = "tous",
}: LoyersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Active status tab (synchronized with URL ?statut=...)
  const activeTab: TabKey = useMemo(() => {
    const s = searchParams.get("statut") || initialStatusFilter
    if (s === "impaye" || s === "partiel" || s === "paye" || s === "a_venir") {
      return s
    }
    return "tous"
  }, [searchParams, initialStatusFilter])

  // Search filter
  const [searchQuery, setSearchQuery] = useState("")

  // Selection state for bulk payment
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  // Payment sheet modal state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeDue, setActiveDue] = useState<EnrichedDueOverview | null>(null)
  const [sheetMode, setSheetMode] = useState<"record" | "view_payments">("record")

  const isOnboarding = searchParams?.get("onboarding") === "1"

  // Auto-open payment sheet for first pending due if in onboarding flow
  useEffect(() => {
    if (isOnboarding && dues.length > 0 && !sheetOpen && !activeDue) {
      const targetDue = dues.find((d) => d.status !== "paye") || dues[0]
      if (targetDue) {
        setActiveDue(targetDue)
        setSheetMode("record")
        setSheetOpen(true)
      }
    }
  }, [isOnboarding, dues, sheetOpen, activeDue])

  // Manual reminder dialog state
  const [reminderDue, setReminderDue] = useState<EnrichedDueOverview | null>(null)
  const [isSendingQuittanceId, setIsSendingQuittanceId] = useState<string | null>(null)

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      tous: dues.length,
      impaye: dues.filter((d) => d.status === "impaye").length,
      partiel: dues.filter((d) => d.status === "partiel").length,
      paye: dues.filter((d) => d.status === "paye").length,
      a_venir: dues.filter((d) => d.status === "a_venir").length,
    }
  }, [dues])

  // Filter and sort items
  const filteredDues = useMemo(() => {
    let result = [...dues]

    // 1. Status Tab filter
    if (activeTab !== "tous") {
      result = result.filter((d) => d.status === activeTab)
    }

    // 2. Text Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((d) => {
        const tenantName = d.tenant
          ? `${d.tenant.first_name} ${d.tenant.last_name}`.toLowerCase()
          : ""
        const propertyName = d.property ? d.property.name.toLowerCase() : ""
        const propertyCity = d.property ? d.property.city.toLowerCase() : ""
        return (
          tenantName.includes(q) ||
          propertyName.includes(q) ||
          propertyCity.includes(q)
        )
      })
    }

    // 3. Default sort
    return result.sort(defaultDueComparator)
  }, [dues, activeTab, searchQuery])

  // Handle Tab Change with URL reflection
  const handleTabChange = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "tous") {
      params.delete("statut")
    } else {
      params.set("statut", tab)
    }
    router.push(`/loyers?${params.toString()}`)
  }

  // Selection handlers
  const payableDues = useMemo(
    () => filteredDues.filter((d) => d.balance > 0),
    [filteredDues]
  )
  const isAllSelected =
    payableDues.length > 0 && payableDues.every((d) => selectedIds.has(d.id))

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(payableDues.map((d) => d.id)))
    }
  }

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Selected total amount
  const selectedDuesList = useMemo(
    () => dues.filter((d) => selectedIds.has(d.id) && d.balance > 0),
    [dues, selectedIds]
  )
  const selectedTotal = useMemo(
    () => selectedDuesList.reduce((acc, d) => acc + d.balance, 0),
    [selectedDuesList]
  )

  // Open Payment Sheet helper
  const openPaymentModal = (
    due: EnrichedDueOverview,
    mode: "record" | "view_payments" = "record"
  ) => {
    setActiveDue(due)
    setSheetMode(mode)
    setSheetOpen(true)
  }

  // Send quittance email handler
  const handleSendQuittanceEmail = async (due: EnrichedDueOverview) => {
    if (!due.tenant?.email) {
      toast.error("Le locataire n'a pas d'adresse e-mail renseignée.")
      return
    }
    setIsSendingQuittanceId(due.id)
    try {
      const res = await sendQuittanceEmailAction(due.id)
      if (res.success) {
        toast.success(
          `Quittance enregistrée dans la boîte d'envoi locale pour ${due.tenant.first_name} ${due.tenant.last_name}.`
        )
      } else {
        toast.error(res.error || "Impossible d'envoyer la quittance.")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setIsSendingQuittanceId(null)
    }
  }

  // Execute bulk payment
  const handleConfirmBulkPay = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    startTransition(async () => {
      const res = await bulkPayDuesAction({ due_ids: ids })
      if (res.success) {
        toast.success(
          `${res.count} loyers marqués comme payés (${formatMoney(res.totalAmount, currency)})`
        )
        setSelectedIds(new Set())
        setBulkConfirmOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter Controls: Tabs & Search Input */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
          {/* Status Tabs with Counts */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(
              [
                { key: "tous", label: "Tous", count: counts.tous, highlight: false },
                { key: "impaye", label: "Impayés", count: counts.impaye, highlight: counts.impaye > 0 },
                { key: "partiel", label: "Partiels", count: counts.partiel, highlight: counts.partiel > 0 },
                { key: "paye", label: "Payés", count: counts.paye, highlight: false },
                { key: "a_venir", label: "À venir", count: counts.a_venir, highlight: false },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full num font-mono ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                        : tab.highlight
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par locataire ou bien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                  <th className="w-10 px-4 py-3 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Tout sélectionner"
                      disabled={payableDues.length === 0}
                    />
                  </th>
                  <th className="px-4 py-3">Locataire & Bien</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3 text-right">Dû</th>
                  <th className="px-4 py-3 text-right">Payé</th>
                  <th className="px-4 py-3 text-right">Reste</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Aucun loyer correspondant
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery
                          ? "Essayez d'ajuster votre recherche."
                          : "Aucune échéance pour ce statut sur ce mois."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDues.map((due) => {
                    const isSelected = selectedIds.has(due.id)
                    const canPay = due.balance > 0
                    const initials = due.tenant
                      ? `${due.tenant.first_name[0] || ""}${due.tenant.last_name[0] || ""}`.toUpperCase()
                      : "??"

                    return (
                      <tr
                        key={due.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleRow(due.id)}
                            disabled={!canPay}
                            aria-label={`Sélectionner ${due.tenant?.last_name || "échéance"}`}
                          />
                        </td>

                        {/* Tenant & Property */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 text-[10px] font-bold border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              {due.tenant ? (
                                <Link
                                  href={`/locataires/${due.tenant.id}`}
                                  className="font-medium text-foreground hover:underline truncate block max-w-[200px]"
                                >
                                  {due.tenant.first_name} {due.tenant.last_name}
                                </Link>
                              ) : (
                                <span className="font-medium text-muted-foreground">
                                  Locataire inconnu
                                </span>
                              )}
                              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                {due.property ? due.property.name : "Bien inconnu"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Due Date & Late Notice */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground">
                              {formatDate(due.due_date)}
                            </span>
                            {due.days_late > 0 && due.balance > 0 ? (
                              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                en retard de {due.days_late} j
                              </p>
                            ) : null}
                            {due.last_reminded_at && (
                              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <Send className="w-3 h-3 text-amber-600 shrink-0" />
                                Relancé le {format(parseISODate(due.last_reminded_at), "dd/MM")}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Dû */}
                        <td className="px-4 py-3 text-right font-medium text-foreground num">
                          {formatMoney(due.total_amount, currency)}
                        </td>

                        {/* Payé */}
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 num">
                          {formatMoney(due.paid_amount, currency)}
                        </td>

                        {/* Reste */}
                        <td className="px-4 py-3 text-right font-semibold num">
                          <span
                            className={
                              due.balance > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }
                          >
                            {formatMoney(due.balance, currency)}
                          </span>
                        </td>

                        {/* Statut Badge */}
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={due.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {canPay ? (
                              <Button
                                size="sm"
                                onClick={() => openPaymentModal(due, "record")}
                                className="h-7 text-xs px-2.5 font-medium"
                              >
                                Encaisser
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPaymentModal(due, "view_payments")}
                                className="h-7 text-xs px-2 text-muted-foreground"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Voir
                              </Button>
                            )}

                            {/* Dropdown ⋯ */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-56">
                                {canPay && (
                                  <DropdownMenuItem
                                    onClick={() => openPaymentModal(due, "record")}
                                    className="text-xs cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 mr-2" />
                                    Encaissement partiel
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => openPaymentModal(due, "view_payments")}
                                  className="text-xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-2" />
                                  Voir les paiements ({due.payments.length})
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {/* Télécharger la quittance ou le reçu */}
                                {due.paid_amount > 0 ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const link = document.createElement("a")
                                      link.href = `/api/documents/${due.id}`
                                      link.download = ""
                                      link.click()
                                    }}
                                    className="text-xs cursor-pointer"
                                  >
                                    <Receipt className={`w-3.5 h-3.5 mr-2 ${due.status === "paye" ? "text-primary" : "text-[#C98A0B]"}`} />
                                    {due.status === "paye" ? "Télécharger la quittance" : "Télécharger le reçu"}
                                  </DropdownMenuItem>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <div className="w-full">
                                          <DropdownMenuItem
                                            disabled
                                            className="text-xs opacity-50 cursor-not-allowed"
                                          >
                                            <Receipt className="w-3.5 h-3.5 mr-2" />
                                            Quittance indisponible
                                          </DropdownMenuItem>
                                        </div>
                                      }
                                    />
                                    <TooltipContent side="left" className="text-xs">
                                      Exige au moins un paiement enregistré
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Envoyer la quittance par e-mail */}
                                {due.status === "paye" && (
                                  due.tenant?.email ? (
                                    <DropdownMenuItem
                                      onClick={() => handleSendQuittanceEmail(due)}
                                      disabled={isSendingQuittanceId === due.id}
                                      className="text-xs cursor-pointer"
                                    >
                                      {isSendingQuittanceId === due.id ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                      ) : (
                                        <Mail className="w-3.5 h-3.5 mr-2 text-primary" />
                                      )}
                                      Envoyer la quittance par e-mail
                                    </DropdownMenuItem>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <div className="w-full">
                                            <DropdownMenuItem
                                              disabled
                                              className="text-xs opacity-50 cursor-not-allowed"
                                            >
                                              <Mail className="w-3.5 h-3.5 mr-2" />
                                              Envoyer la quittance par e-mail
                                            </DropdownMenuItem>
                                          </div>
                                        }
                                      />
                                      <TooltipContent side="left" className="text-xs">
                                        Le locataire n&apos;a pas d&apos;adresse e-mail renseignée
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                )}

                                {/* Envoyer une relance */}
                                {canPay && (
                                  due.tenant?.email ? (
                                    <DropdownMenuItem
                                      onClick={() => setReminderDue(due)}
                                      className="text-xs cursor-pointer text-amber-700 dark:text-amber-400"
                                    >
                                      <Send className="w-3.5 h-3.5 mr-2" />
                                      Envoyer une relance
                                    </DropdownMenuItem>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <div className="w-full">
                                            <DropdownMenuItem
                                              disabled
                                              className="text-xs opacity-50 cursor-not-allowed"
                                            >
                                              <Send className="w-3.5 h-3.5 mr-2" />
                                              Envoyer une relance
                                            </DropdownMenuItem>
                                          </div>
                                        }
                                      />
                                      <TooltipContent side="left" className="text-xs">
                                        Le locataire n&apos;a pas d&apos;adresse e-mail renseignée
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="block md:hidden space-y-3">
          {filteredDues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Aucun loyer trouvé</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Modifiez vos filtres ou sélectionnez un autre mois.
              </p>
            </div>
          ) : (
            filteredDues.map((due) => {
              const canPay = due.balance > 0
              const isSelected = selectedIds.has(due.id)

              return (
                <div
                  key={due.id}
                  className={`rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs ${
                    isSelected ? "ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  {/* Top: Locataire, Bien, Statut */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(due.id)}
                        disabled={!canPay}
                        aria-label="Sélectionner pour paiement groupé"
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {due.tenant
                            ? `${due.tenant.first_name} ${due.tenant.last_name}`
                            : "Locataire inconnu"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {due.property ? due.property.name : "Bien"} · Échéance au{" "}
                          {formatDate(due.due_date)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={due.status} />
                  </div>

                  {/* Late Warning */}
                  {due.days_late > 0 && due.balance > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Loyer en retard de {due.days_late} jours
                    </div>
                  )}

                  {/* Relance Badge */}
                  {due.last_reminded_at && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-1 rounded-md">
                      <Send className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Relancé le {format(parseISODate(due.last_reminded_at), "dd/MM")}
                    </div>
                  )}

                  {/* Financial Details */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Reste à payer</p>
                      <p className="text-lg font-bold text-foreground num">
                        {formatMoney(due.balance, currency)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-0.5">
                      <p>
                        Dû : <span className="num font-medium">{formatMoney(due.total_amount, currency)}</span>
                      </p>
                      <p>
                        Payé : <span className="num font-medium text-emerald-600 dark:text-emerald-400">{formatMoney(due.paid_amount, currency)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {canPay ? (
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(due, "record")}
                        className="flex-1 h-9 text-xs font-medium"
                      >
                        Encaisser
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentModal(due, "view_payments")}
                        className="flex-1 h-9 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Voir les paiements
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        {canPay && (
                          <DropdownMenuItem
                            onClick={() => openPaymentModal(due, "record")}
                            className="text-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-2" />
                            Encaissement partiel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openPaymentModal(due, "view_payments")}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Historique paiements
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {due.paid_amount > 0 ? (
                          <DropdownMenuItem
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = `/api/documents/${due.id}`
                              link.download = ""
                              link.click()
                            }}
                            className="text-xs cursor-pointer"
                          >
                            <Receipt className={`w-3.5 h-3.5 mr-2 ${due.status === "paye" ? "text-primary" : "text-[#C98A0B]"}`} />
                            {due.status === "paye" ? "Télécharger la quittance" : "Télécharger le reçu"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled className="text-xs opacity-50">
                            <Receipt className="w-3.5 h-3.5 mr-2" />
                            Quittance (non payé)
                          </DropdownMenuItem>
                        )}
                        {/* Envoyer la quittance par e-mail */}
                        {due.status === "paye" && (
                          due.tenant?.email ? (
                            <DropdownMenuItem
                              onClick={() => handleSendQuittanceEmail(due)}
                              disabled={isSendingQuittanceId === due.id}
                              className="text-xs cursor-pointer"
                            >
                              {isSendingQuittanceId === due.id ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 mr-2 text-primary" />
                              )}
                              Envoyer la quittance par e-mail
                            </DropdownMenuItem>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <div className="w-full">
                                    <DropdownMenuItem
                                      disabled
                                      className="text-xs opacity-50 cursor-not-allowed"
                                    >
                                      <Mail className="w-3.5 h-3.5 mr-2" />
                                      Envoyer la quittance par e-mail
                                    </DropdownMenuItem>
                                  </div>
                                }
                              />
                              <TooltipContent side="left" className="text-xs">
                                Le locataire n&apos;a pas d&apos;adresse e-mail renseignée
                              </TooltipContent>
                            </Tooltip>
                          )
                        )}

                        {/* Envoyer une relance */}
                        {canPay && (
                          due.tenant?.email ? (
                            <DropdownMenuItem
                              onClick={() => setReminderDue(due)}
                              className="text-xs cursor-pointer text-amber-700 dark:text-amber-400"
                            >
                              <Send className="w-3.5 h-3.5 mr-2" />
                              Envoyer une relance
                            </DropdownMenuItem>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <div className="w-full">
                                    <DropdownMenuItem
                                      disabled
                                      className="text-xs opacity-50 cursor-not-allowed"
                                    >
                                      <Send className="w-3.5 h-3.5 mr-2" />
                                      Envoyer une relance
                                    </DropdownMenuItem>
                                  </div>
                                }
                              />
                              <TooltipContent side="left" className="text-xs">
                                Le locataire n&apos;a pas d&apos;adresse e-mail renseignée
                              </TooltipContent>
                            </Tooltip>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Floating Bulk Action Bar (Desktop & Mobile) */}
        {selectedDuesList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-3 rounded-2xl bg-foreground text-background shadow-2xl border border-foreground/10">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {selectedDuesList.length}
                </span>
                <div className="text-xs">
                  <span className="font-semibold block sm:inline">
                    {selectedDuesList.length}{" "}
                    {selectedDuesList.length === 1 ? "loyer sélectionné" : "loyers sélectionnés"}
                  </span>
                  <span className="text-background/70 block sm:inline sm:ml-2 num">
                    Total : <strong>{formatMoney(selectedTotal, currency)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setBulkConfirmOpen(true)}
                  className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Marquer comme payés
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-7 w-7 text-background/60 hover:text-background hover:bg-background/10"
                  title="Désélectionner tout"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Sheet */}
        <PaymentSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          due={activeDue}
          currency={currency}
          initialMode={sheetMode}
        />

        {/* Bulk Payment Confirmation Dialog */}
        <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Marquer {selectedDuesList.length} loyers comme payés ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Cette action va créer un paiement daté d&apos;aujourd&apos;hui pour le solde
                  restant de chaque échéance sélectionnée, selon le mode de règlement habituel
                  du bail.
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Nombre d&apos;échéances :</span>
                    <span className="font-bold">{selectedDuesList.length}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Montant total à encaisser :</span>
                    <span className="font-bold num text-emerald-600 dark:text-emerald-400">
                      {formatMoney(selectedTotal, currency)}
                    </span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmBulkPay}
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                Confirmer l&apos;encaissement groupé
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Manual Reminder Dialog */}
        <ManualReminderDialog
          due={reminderDue}
          open={!!reminderDue}
          onOpenChange={(open) => !open && setReminderDue(null)}
          currency={currency}
        />
      </div>
    </TooltipProvider>
  )
}
