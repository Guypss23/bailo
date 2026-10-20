"use client"

import * as React from "react"
import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  Receipt,
  Sparkles,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatMoney, formatPeriod, todayISO } from "@/lib/format"
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/lease"
import {
  recordPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
} from "@/app/(app)/loyers/actions"
import { recordTenantCascadePaymentAction } from "@/app/(app)/locataires/actions"
import { useRouter, useSearchParams } from "next/navigation"
import type { EnrichedDueOverview, Payment } from "@/lib/data/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import { StatusBadge } from "@/components/app/status-badge"
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

export interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  due: EnrichedDueOverview | null
  currency: string
  initialMode?: "record" | "view_payments"
}

function computeDefaultPaidAt(due: EnrichedDueOverview | null): string {
  if (!due) return todayISO()
  const today = todayISO()
  // Si l'échéance concerne le mois en cours, pré-remplir avec la date du jour
  if (today.slice(0, 7) === due.period.slice(0, 7)) {
    return today
  }
  // Sinon (mois passé ou futur), pré-remplir avec le 1er jour du mois sélectionné ('YYYY-MM-01')
  return due.period
}

export function PaymentSheet({
  open,
  onOpenChange,
  due,
  currency,
  initialMode = "record",
}: PaymentSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get("onboarding") === "1"
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [isPending, startTransition] = useTransition()

  // Form state
  const [amountInput, setAmountInput] = useState<string>("")
  const [paidAt, setPaidAt] = useState<string>(() => computeDefaultPaidAt(due))
  const [method, setMethod] = useState<string>("virement")
  const [reference, setReference] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [useCascade, setUseCascade] = useState<boolean>(true)
  const [showAdvancePayment, setShowAdvancePayment] = useState<boolean>(false)

  // Editing state for existing payment
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>("")
  const [editPaidAt, setEditPaidAt] = useState<string>("")
  const [editMethod, setEditMethod] = useState<string>("virement")
  const [editRef, setEditRef] = useState<string>("")

  // Delete confirmation
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)

  // Initialize values when `due` changes or sheet opens
  useEffect(() => {
    if (due) {
      setAmountInput(due.balance > 0 ? String(due.balance) : "")
      setPaidAt(computeDefaultPaidAt(due))
      setMethod(due.lease?.payment_method ?? "virement")
      setReference("")
      setNote("")
      setEditingPaymentId(null)
      setShowAdvancePayment(false)
      setUseCascade(true)
    }
  }, [due, open])

  if (!due) return null

  const parsedAmount = Number(amountInput) || 0
  const isOverpaying = parsedAmount > due.balance
  const overpayDiff = parsedAmount - due.balance
  const canSubmit = parsedAmount > 0 && !isPending

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    startTransition(async () => {
      // Si apurement légal actif, dépassement de solde ou échéance virtuelle : ventilation cascade
      if (useCascade || isOverpaying || due.id.startsWith("virtual-")) {
        const res = await recordTenantCascadePaymentAction({
          tenant_id: due.tenant?.id || due.tenant_id || due.lease?.tenant_id || undefined,
          lease_id: due.lease_id || due.lease?.id,
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

        toast.success(`Règlement de ${formatMoney(parsedAmount, currency)} enregistré`, {
          description: `Ventilé automatiquement sur ${res.count} échéance(s) (apurement légal).`,
          duration: 5000,
        })

        onOpenChange(false)
        if (isOnboarding) {
          router.push("/tableau-de-bord")
        }
        return
      }

      // Mode classique (sur cette seule échéance)
      const res = await recordPaymentAction({
        rent_due_id: due.id,
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

      const recordedPayment = res.payment
      toast.success(`Paiement de ${formatMoney(parsedAmount, currency)} enregistré`, {
        action: {
          label: "Annuler",
          onClick: async () => {
            const delRes = await deletePaymentAction(recordedPayment.id)
            if (delRes.success) {
              toast.info("Paiement annulé.")
            } else {
              toast.error(delRes.error)
            }
          },
        },
        duration: 5000,
      })

      onOpenChange(false)
      if (isOnboarding) {
        router.push("/tableau-de-bord")
      }
    })
  }

  const handleStartEdit = (p: Payment) => {
    setEditingPaymentId(p.id)
    setEditAmount(String(p.amount))
    setEditPaidAt(p.paid_at)
    setEditMethod(p.method)
    setEditRef(p.reference || "")
  }

  const handleSaveEdit = (paymentId: string) => {
    const num = Number(editAmount)
    if (!num || num <= 0) {
      toast.error("Le montant doit être supérieur à 0.")
      return
    }

    startTransition(async () => {
      const res = await updatePaymentAction({
        id: paymentId,
        rent_due_id: due.id,
        amount: num,
        paid_at: editPaidAt,
        method: editMethod,
        reference: editRef.trim() || null,
      })

      if (!res.success) {
        toast.error(res.error)
      } else {
        toast.success("Paiement mis à jour.")
        setEditingPaymentId(null)
      }
    })
  }

  const handleConfirmDelete = () => {
    if (!paymentToDelete) return

    startTransition(async () => {
      const res = await deletePaymentAction(paymentToDelete.id)
      if (res.success) {
        toast.success("Paiement supprimé.")
        setPaymentToDelete(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={`flex flex-col gap-0 p-0 ${
            isDesktop
              ? "sm:max-w-md w-full border-l border-border bg-card"
              : "max-h-[88vh] rounded-t-2xl border-t border-border bg-card overflow-hidden"
          }`}
        >
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border/80 text-left bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-base font-semibold text-foreground tracking-tight">
                {due.balance > 0 ? "Encaisser un loyer" : "Détail de l'échéance"}
              </SheetTitle>
              <StatusBadge status={due.status} />
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <span className="block font-medium text-foreground">
                {due.tenant ? `${due.tenant.first_name} ${due.tenant.last_name}` : "Locataire"}
              </span>
              <span className="block truncate">
                {due.property ? due.property.name : "Bien"} · Période :{" "}
                <span className="capitalize font-medium text-foreground">
                  {formatPeriod(due.period)}
                </span>
              </span>
            </SheetDescription>
          </SheetHeader>

          {/* Body with scrolling */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Financial Overview Card */}
            <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Total dû</p>
                <p className="text-sm font-semibold text-foreground num mt-1">
                  {formatMoney(due.total_amount, currency)}
                </p>
              </div>
              <div className="border-x border-border/60 px-2">
                <p className="text-[11px] font-medium text-muted-foreground">Déjà perçu</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 num mt-1">
                  {formatMoney(due.paid_amount, currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Reste à payer</p>
                <p
                  className={`text-sm font-semibold num mt-1 ${
                    due.balance > 0
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatMoney(due.balance, currency)}
                </p>
              </div>
            </div>

            {/* Téléchargement de la quittance ou du reçu si paiement existant */}
            {due.paid_amount > 0 && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full text-xs font-medium border-border h-9"
              >
                <a href={`/api/documents/${due.id}`} download>
                  <Receipt className={`w-3.5 h-3.5 mr-1.5 ${due.status === "paye" ? "text-primary" : "text-[#C98A0B]"}`} />
                  {due.status === "paye"
                    ? "Télécharger la quittance de loyer (PDF)"
                    : "Télécharger le reçu de paiement partiel (PDF)"}
                </a>
              </Button>
            )}

            {/* Saisie d'un nouveau paiement (si reste > 0 ou si versement d'avance) */}
            {due.balance > 0 || showAdvancePayment ? (
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-amount" className="text-xs font-medium text-foreground">
                      Montant encaissé *
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {due.balance > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setAmountInput(String(due.balance))}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            Solde total ({formatMoney(due.balance, currency)})
                          </button>
                          <span className="text-muted-foreground text-[10px]">·</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setAmountInput("")}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Autre montant
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="payment-amount"
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder={due.balance > 0 ? String(due.balance) : "Ex: 70000"}
                      className="h-10 text-base num"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">
                      {currency}
                    </span>
                  </div>

                  {/* Overpayment cascade info */}
                  {isOverpaying && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/[0.08] border border-primary/20 text-xs mt-1.5 leading-relaxed">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-primary">
                          Ventilation en cascade automatique
                        </p>
                        <p className="text-muted-foreground">
                          Ce versement dépasse le solde de ce mois de{" "}
                          <strong className="num text-foreground font-semibold">
                            {formatMoney(overpayDiff, currency)}
                          </strong>
                          . Le surplus sera automatiquement affecté aux échéances suivantes ou créé en avance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option Apurement légal en cascade */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <div className="space-y-0.5 pr-2">
                    <Label htmlFor="cascade-toggle" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Apurement légal en cascade
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Solde en priorité les dettes les plus anciennes et cascade le surplus.
                    </p>
                  </div>
                  <input
                    id="cascade-toggle"
                    type="checkbox"
                    checked={useCascade}
                    onChange={(e) => setUseCascade(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="payment-date" className="text-xs font-medium text-foreground">
                      Date du règlement *
                    </Label>
                    <Input
                      id="payment-date"
                      type="date"
                      required
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="payment-method" className="text-xs font-medium text-foreground">
                      Mode de paiement *
                    </Label>
                    <Select
                      items={paymentMethodLabels}
                      value={method}
                      onValueChange={(val) => {
                        if (val) setMethod(val)
                      }}
                    >
                      <SelectTrigger id="payment-method" className="h-9 text-xs">
                        <SelectValue>
                          {(val: string | null) => (val && paymentMethodLabels[val as keyof typeof paymentMethodLabels]) || val}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m} value={m} label={paymentMethodLabels[m]} className="text-xs">
                            {paymentMethodLabels[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-ref" className="text-xs font-medium text-foreground">
                    Référence (optionnel)
                  </Label>
                  <Input
                    id="payment-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: Virement VIR-84920, Chèque n°492..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-note" className="text-xs font-medium text-foreground">
                    Note interne (optionnel)
                  </Label>
                  <Input
                    id="payment-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex: Reçu en mains propres..."
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-10 mt-2 text-sm font-medium"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1.5" />
                  )}
                  {isOverpaying
                    ? `Enregistrer et ventiler (${formatMoney(parsedAmount, currency)})`
                    : "Enregistrer l'encaissement"}
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Loyer intégralement réglé
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                    Cette échéance n&apos;a plus aucun solde à percevoir.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancePayment(true)}
                  className="w-full text-xs font-medium gap-1.5 h-9"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Enregistrer un versement d&apos;avance
                </Button>
              </div>
            )}

            {/* Historique des paiements déjà enregistrés */}
            <div className="pt-2 border-t border-border/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paiements enregistrés ({due.payments.length})
                </h4>
              </div>

              {due.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center italic">
                  Aucun paiement enregistré pour cette échéance.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {due.payments.map((p) => {
                    const isEditing = editingPaymentId === p.id

                    if (isEditing) {
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-primary/50 bg-background space-y-2.5"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[11px]">Montant</Label>
                              <Input
                                type="number"
                                step="any"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="h-8 text-xs num mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px]">Date</Label>
                              <Input
                                type="date"
                                value={editPaidAt}
                                onChange={(e) => setEditPaidAt(e.target.value)}
                                className="h-8 text-xs mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[11px]">Mode</Label>
                              <Select
                                items={paymentMethodLabels}
                                value={editMethod}
                                onValueChange={(val) => {
                                  if (val) setEditMethod(val)
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs mt-1">
                                  <SelectValue>
                                    {(val: string | null) => (val && paymentMethodLabels[val as keyof typeof paymentMethodLabels]) || val}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentMethods.map((m) => (
                                    <SelectItem key={m} value={m} label={paymentMethodLabels[m]} className="text-xs">
                                      {paymentMethodLabels[m]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[11px]">Réf.</Label>
                              <Input
                                value={editRef}
                                onChange={(e) => setEditRef(e.target.value)}
                                placeholder="Réf..."
                                className="h-8 text-xs mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPaymentId(null)}
                              className="h-7 text-xs"
                            >
                              Annuler
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleSaveEdit(p.id)}
                              className="h-7 text-xs"
                            >
                              {isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Sauvegarder"
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border border-border bg-background hover:bg-muted/10 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground num">
                              {formatMoney(p.amount, currency)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              · {p.paid_at}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span>{paymentMethodLabels[p.method] ?? p.method}</span>
                            {p.reference && (
                              <span className="font-mono text-[10px] text-foreground/80">
                                ({p.reference})
                              </span>
                            )}
                          </p>
                          {p.note && (
                            <p className="text-[11px] text-muted-foreground/80 italic">
                              {p.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(p)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Modifier ce paiement"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPaymentToDelete(p)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Supprimer ce paiement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(paymentToDelete)}
        onOpenChange={(o) => {
          if (!o) setPaymentToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le paiement de{" "}
              <strong className="num text-foreground">
                {paymentToDelete ? formatMoney(paymentToDelete.amount, currency) : ""}
              </strong>{" "}
              enregistré le {paymentToDelete?.paid_at} ? Le solde restant de l&apos;échéance
              sera recalculé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
