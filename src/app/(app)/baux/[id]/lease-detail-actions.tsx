"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Pencil,
  CalendarX,
  Trash2,
  Loader2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  terminateLeaseAction,
  deleteLeaseAction,
  adjustLeaseRentAction,
} from "../actions"
import { formatMoney, formatPeriod, todayISO, toPeriod, addMonthsToPeriod } from "@/lib/format"
import type { Lease } from "@/lib/data"

interface LeaseDetailActionsProps {
  lease: Lease
  hasPayments: boolean
  currency: string
}

export function LeaseDetailActions({
  lease,
  hasPayments,
  currency,
}: LeaseDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Terminate Dialog
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [terminationDate, setTerminationDate] = useState(todayISO())

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Adjust Rent Dialog
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [newRent, setNewRent] = useState<number>(lease.rent_amount)
  const [newCharges, setNewCharges] = useState<number>(lease.charges_amount)

  // Available periods to apply from: current month, next month, in 2 months
  const currentPeriod = toPeriod(todayISO())
  const [effectivePeriod, setEffectivePeriod] = useState<string>(currentPeriod)

  const availablePeriods = [
    currentPeriod,
    addMonthsToPeriod(currentPeriod, 1),
    addMonthsToPeriod(currentPeriod, 2),
  ]

  const isTerminated = lease.status === "termine"

  const handleTerminate = () => {
    startTransition(async () => {
      const res = await terminateLeaseAction(lease.id, terminationDate)
      if (res.ok) {
        toast.success("Bail terminé avec succès.")
        setTerminateOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de terminer ce bail.")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteLeaseAction(lease.id)
      if (res.ok) {
        toast.success("Bail supprimé.")
        setDeleteOpen(false)
        router.push("/baux")
      } else {
        toast.error(res.error || "Impossible de supprimer ce bail.")
        setDeleteOpen(false)
      }
    })
  }

  const handleAdjustRent = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await adjustLeaseRentAction(
        lease.id,
        newRent,
        newCharges,
        effectivePeriod
      )
      if (res.ok) {
        toast.success(
          `Loyer mis à jour · ${res.updatedDuesCount || 0} échéance(s) modifiée(s).`
        )
        setAdjustOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Impossible de modifier les montants.")
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Imprimer / Télécharger le contrat de bail (PDF) */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1.5 text-xs font-medium text-[#1F5C45] dark:text-[#6FCB9F] hover:bg-[#1F5C45]/10 border-[#1F5C45]/30 shadow-xs"
        >
          <a
            href={`/api/documents/lease/${lease.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer className="w-3.5 h-3.5" />
            Contrat de bail (PDF)
          </a>
        </Button>

        {/* Modifier le loyer & charges (Dialog) */}
        {!isTerminated && (
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
                <Pencil className="w-3.5 h-3.5" />
                Modifier le loyer
              </Button>
            } />
            <DialogContent className="max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Modifier le loyer et les charges
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ajustez les montants de la location. Vous choisissez à partir de quel mois appliquer ces nouveaux montants.
                </DialogDescription>
              </DialogHeader>

              <form id="adjust-rent-form" onSubmit={handleAdjustRent} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adjust-rent" className="text-xs font-medium text-foreground">
                      Loyer hors charges ({currency})
                    </Label>
                    <Input
                      id="adjust-rent"
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={newRent}
                      onChange={(e) => setNewRent(Number(e.target.value))}
                      className="h-9 text-sm num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adjust-charges" className="text-xs font-medium text-foreground">
                      Provision sur charges ({currency})
                    </Label>
                    <Input
                      id="adjust-charges"
                      type="number"
                      min="0"
                      step="any"
                      value={newCharges}
                      onChange={(e) => setNewCharges(Number(e.target.value))}
                      className="h-9 text-sm num"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adjust-period" className="text-xs font-medium text-foreground">
                    Appliquer à partir de quel mois ?
                  </Label>
                  <Select
                    items={Object.fromEntries(availablePeriods.map((p) => [p, formatPeriod(p)]))}
                    value={effectivePeriod}
                    onValueChange={(val) => { if (val) setEffectivePeriod(val); }}
                  >
                    <SelectTrigger id="adjust-period" className="h-9 text-xs">
                      <SelectValue>
                        {(val: string | null) => (val ? formatPeriod(val) : "")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((p) => (
                        <SelectItem key={p} value={p} label={formatPeriod(p)} className="text-xs capitalize">
                          {formatPeriod(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    Seules les échéances de ce mois et des suivants qui n&apos;ont encore aucun paiement enregistré seront mises à jour. Les échéances passées ou déjà réglées restent intactes.
                  </p>
                </div>
              </form>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setAdjustOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  form="adjust-rent-form"
                  disabled={isPending}
                  className="font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Mise à jour...
                    </>
                  ) : (
                    "Appliquer la modification"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Terminer le bail (AlertDialog) */}
        {!isTerminated && (
          <AlertDialog open={terminateOpen} onOpenChange={setTerminateOpen}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setTerminateOpen(true)}
              className="gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
            >
              <CalendarX className="w-3.5 h-3.5" />
              Terminer le bail
            </Button>
            <AlertDialogContent className="max-w-[460px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base flex items-center gap-2">
                  <CalendarX className="w-5 h-5 text-amber-500" />
                  Mettre fin au contrat de location
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Indiquez la date de sortie effective des lieux. Le statut du bail passera à « terminé » et aucune échéance ultérieure non réglée ne sera conservée.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="term-date" className="text-xs font-medium text-foreground">
                  Date de fin de bail
                </Label>
                <Input
                  id="term-date"
                  type="date"
                  value={terminationDate}
                  min={lease.start_date}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending} className="text-xs">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending || !terminationDate}
                  onClick={(e) => {
                    e.preventDefault()
                    handleTerminate()
                  }}
                  className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Clôture...
                    </>
                  ) : (
                    "Confirmer la fin du bail"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Supprimer le bail */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setDeleteOpen(true)}
            className="gap-1.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </Button>
          <AlertDialogContent className="max-w-[460px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">
                {hasPayments ? "Suppression impossible" : "Supprimer ce bail ?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                {hasPayments ? (
                  "Ce bail possède déjà des paiements enregistrés dans votre comptabilité. Pour préserver l'historique comptable et légal, il ne peut pas être supprimé. Vous pouvez plutôt le terminer avec sa date de sortie."
                ) : (
                  "Êtes-vous sûr de vouloir supprimer définitivement ce bail ? Les échéances de loyers générées sans paiement seront également supprimées. Cette action est irréversible."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} className="text-xs">
                {hasPayments ? "Fermer" : "Annuler"}
              </AlertDialogCancel>
              {!hasPayments && (
                <AlertDialogAction
                  disabled={isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer définitivement"
                  )}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
