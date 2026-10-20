"use client"

import * as React from "react"
import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import { formatMoney, formatPeriod, todayISO } from "@/lib/format"
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/lease"
import { recordTenantCascadePaymentAction } from "@/app/(app)/locataires/actions"
import { simulateCascadePayment } from "@/lib/domain/cascade-payment"
import type { Tenant, Lease, Property, RentDueOverview } from "@/lib/data/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export interface TenantPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant
  leases: Lease[]
  propertiesMap: Record<string, Property>
  dueOverviews: RentDueOverview[]
  currency: string
}

export function TenantPaymentDialog({
  open,
  onOpenChange,
  tenant,
  leases,
  propertiesMap,
  dueOverviews,
  currency,
}: TenantPaymentDialogProps) {
  const [isPending, startTransition] = useTransition()

  // Find active leases
  const activeLeases = useMemo(
    () => leases.filter((l) => l.status === "actif"),
    [leases]
  )
  const defaultLease = activeLeases[0] || leases[0]

  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(
    defaultLease?.id || ""
  )
  const [amountInput, setAmountInput] = useState<string>("")
  const [paidAt, setPaidAt] = useState<string>(todayISO())
  const [method, setMethod] = useState<string>(
    defaultLease?.payment_method || "mobile_money"
  )
  const [reference, setReference] = useState<string>("")
  const [note, setNote] = useState<string>("")

  // Update selected lease if default changes or on open
  React.useEffect(() => {
    if (defaultLease && !selectedLeaseId) {
      setSelectedLeaseId(defaultLease.id)
      setMethod(defaultLease.payment_method || "mobile_money")
    }
  }, [defaultLease, selectedLeaseId, open])

  const selectedLease = useMemo(
    () => leases.find((l) => l.id === selectedLeaseId) || defaultLease,
    [leases, selectedLeaseId, defaultLease]
  )

  const selectedProperty = selectedLease
    ? propertiesMap[selectedLease.property_id]
    : null

  // Dues for selected lease
  const leaseDues = useMemo(() => {
    if (!selectedLease) return []
    return dueOverviews.filter((d) => d.lease_id === selectedLease.id)
  }, [dueOverviews, selectedLease])

  // Total balance currently due on this lease
  const totalDebt = useMemo(() => {
    return leaseDues.reduce((acc, d) => acc + (d.balance > 0 ? d.balance : 0), 0)
  }, [leaseDues])

  const parsedAmount = Number(amountInput) || 0
  const canSubmit = parsedAmount > 0 && Boolean(selectedLease) && !isPending

  // Real-time cascade simulation
  const simulation = useMemo(() => {
    if (!selectedLease || parsedAmount <= 0) return null
    return simulateCascadePayment(selectedLease, leaseDues, parsedAmount)
  }, [selectedLease, leaseDues, parsedAmount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selectedLease) return

    startTransition(async () => {
      const res = await recordTenantCascadePaymentAction({
        tenant_id: tenant.id,
        lease_id: selectedLease.id,
        amount: parsedAmount,
        paid_at: paidAt,
        method,
        reference: reference.trim() || null,
        note: note.trim() || null,
      })

      if (!res.success) {
        toast.error(res.error)
        return
      }

      toast.success(
        `Règlement de ${formatMoney(parsedAmount, currency)} enregistré avec succès`,
        {
          description: `Ventilé automatiquement sur ${res.count} échéance(s).`,
        }
      )

      // Reset and close
      setAmountInput("")
      setReference("")
      setNote("")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Encaisser un règlement global
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apurement automatique en cascade pour{" "}
                <strong className="text-foreground">
                  {tenant.first_name} {tenant.last_name}
                </strong>
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Sélection du bail si plusieurs */}
          {leases.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="tenant-lease" className="text-xs font-medium text-foreground">
                Bail / Logement concerné *
              </Label>
              <Select
                value={selectedLeaseId}
                onValueChange={(val) => {
                  setSelectedLeaseId(val)
                  const l = leases.find((item) => item.id === val)
                  if (l?.payment_method) setMethod(l.payment_method)
                }}
              >
                <SelectTrigger id="tenant-lease" className="h-9 text-xs">
                  <SelectValue placeholder="Sélectionner un bail" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((l) => {
                    const prop = propertiesMap[l.property_id]
                    return (
                      <SelectItem key={l.id} value={l.id} className="text-xs">
                        {prop?.name ?? "Logement"} — Loyer{" "}
                        {formatMoney(l.rent_amount + l.charges_amount, currency)}
                        {l.status === "actif" ? " (Actif)" : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : selectedProperty ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
              <span className="text-muted-foreground">Logement :</span>
              <span className="font-semibold text-foreground">
                {selectedProperty.name} (Loyer mensuel :{" "}
                {formatMoney(
                  (selectedLease?.rent_amount ?? 0) + (selectedLease?.charges_amount ?? 0),
                  currency
                )}
                )
              </span>
            </div>
          ) : null}

          {/* Récapitulatif de la dette totale */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Reliquat total actuellement dû
              </p>
              <p className="text-xs text-muted-foreground">
                Dettes cumulées sur les échéances antérieures
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-base font-bold num ${
                  totalDebt > 0 ? "text-destructive" : "text-[#1E8A5A]"
                }`}
              >
                {formatMoney(totalDebt, currency)}
              </p>
              {totalDebt > 0 ? (
                <button
                  type="button"
                  onClick={() => setAmountInput(String(totalDebt))}
                  className="text-[11px] font-medium text-primary hover:underline block ml-auto mt-0.5"
                >
                  Solder la totalité
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground">À jour</span>
              )}
            </div>
          </div>

          {/* Saisie du montant et de la date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cascade-amount" className="text-xs font-medium text-foreground">
                Montant total reçu *
              </Label>
              <div className="relative">
                <Input
                  id="cascade-amount"
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Ex: 70000"
                  className="h-10 text-base num pr-14"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">
                  {currency}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cascade-date" className="text-xs font-medium text-foreground">
                Date du règlement *
              </Label>
              <Input
                id="cascade-date"
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Mode de règlement & Référence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cascade-method" className="text-xs font-medium text-foreground">
                Mode de règlement *
              </Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="cascade-method" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {paymentMethodLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cascade-reference" className="text-xs font-medium text-foreground">
                Référence / N° de transaction
              </Label>
              <Input
                id="cascade-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Airtel Money 074... ou VIR-123"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Simulation en direct de la ventilation (Cascade) */}
          {simulation && simulation.allocations.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ventilation automatique calculée ({simulation.allocations.length} mois) :
                </span>
                <span className="num font-bold text-foreground">
                  {formatMoney(parsedAmount, currency)}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {simulation.allocations.map((alloc, idx) => (
                  <div
                    key={alloc.period + idx}
                    className="flex items-center justify-between p-2 rounded-md bg-background border border-border/60 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          {formatPeriod(alloc.period)}
                        </span>
                        {alloc.isNewDue && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 h-4 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          >
                            Avance créée
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Dû initial : {formatMoney(alloc.previousBalance, currency)}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <p className="font-bold text-foreground num">
                        +{formatMoney(alloc.amount, currency)}
                      </p>
                      {alloc.isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E8A5A]">
                          <CheckCircle2 className="w-3 h-3" />
                          Soldé
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#C98A0B]">
                          Reste {formatMoney(alloc.remainingBalanceAfter, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Solde restant après imputation */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Nouveau reliquat après ce versement :</span>
                <span
                  className={`font-bold num ${
                    Math.max(0, totalDebt - parsedAmount) > 0
                      ? "text-destructive"
                      : "text-[#1E8A5A]"
                  }`}
                >
                  {formatMoney(Math.max(0, totalDebt - parsedAmount), currency)}
                </span>
              </div>
            </div>
          )}

          {/* Note interne */}
          <div className="space-y-1.5">
            <Label htmlFor="cascade-note" className="text-xs font-medium text-foreground">
              Note interne (optionnelle)
            </Label>
            <Input
              id="cascade-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Reçu en espèces à l'agence ou reçu partiel convenu"
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="text-xs font-semibold gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Ventilation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Valider l&apos;encaissement
                  {parsedAmount > 0 && ` (${formatMoney(parsedAmount, currency)})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
