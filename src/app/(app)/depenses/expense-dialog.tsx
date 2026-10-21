"use client"

import * as React from "react"
import { useTransition } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { todayISO } from "@/lib/format"
import { EXPENSE_CATEGORIES } from "@/lib/domain/expenses"
import type { ExpenseCategory } from "@/lib/data/types"
import { paymentMethodLabels, paymentMethods } from "@/lib/validations/lease"
import type { Expense, Property } from "@/lib/data/types"
import { createExpenseAction, updateExpenseAction } from "./actions"
import { Loader2 } from "lucide-react"

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: Property[]
  expenseToEdit?: Expense | null
  currency?: string
}

export function ExpenseDialog({
  open,
  onOpenChange,
  properties,
  expenseToEdit,
  currency = "XAF",
}: ExpenseDialogProps) {
  const [isPending, startTransition] = useTransition()

  // Form states
  const [propertyId, setPropertyId] = React.useState<string>("none")
  const [category, setCategory] = React.useState<ExpenseCategory>("eau_electricite")
  const [description, setDescription] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [date, setDate] = React.useState(todayISO())
  const [paymentMethod, setPaymentMethod] = React.useState<string>("especes")
  const [notes, setNotes] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  // Initialize or reset form when dialog opens or expenseToEdit changes
  React.useEffect(() => {
    if (expenseToEdit) {
      setPropertyId(expenseToEdit.property_id || "none")
      setCategory(expenseToEdit.category)
      setDescription(expenseToEdit.description)
      setAmount(String(expenseToEdit.amount))
      setDate(expenseToEdit.date)
      setPaymentMethod(expenseToEdit.payment_method || "especes")
      setNotes(expenseToEdit.notes || "")
    } else {
      setPropertyId("none")
      setCategory("eau_electricite")
      setDescription("")
      setAmount("")
      setDate(todayISO())
      setPaymentMethod("especes")
      setNotes("")
    }
    setFieldErrors({})
  }, [expenseToEdit, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const numAmount = Number(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setFieldErrors({ amount: "Veuillez entrer un montant valide supérieur à 0." })
      return
    }

    if (!description.trim()) {
      setFieldErrors({ description: "La description est requise." })
      return
    }

    const payload = {
      property_id: propertyId === "none" ? null : propertyId,
      category,
      description: description.trim(),
      amount: numAmount,
      date,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
      ...(expenseToEdit ? { id: expenseToEdit.id } : {}),
    }

    startTransition(async () => {
      try {
        const res = expenseToEdit
          ? await updateExpenseAction(payload)
          : await createExpenseAction(payload)

        if (!res.success) {
          if (res.fieldErrors) {
            setFieldErrors(res.fieldErrors)
          }
          toast.error(res.error || "Une erreur est survenue.")
          return
        }

        toast.success(
          expenseToEdit
            ? "Dépense mise à jour avec succès."
            : "Nouvelle dépense enregistrée."
        )
        onOpenChange(false)
      } catch (err: any) {
        toast.error(err.message || "Erreur de connexion.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expenseToEdit ? "Modifier la dépense" : "Ajouter une dépense ou facture"}
          </DialogTitle>
          <DialogDescription>
            Saisissez les factures (SEEG, vidange fosse, travaux) pour déduire ces coûts de vos loyers et calculer votre rendement réel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Bien rattaché */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-property">Bien immobilier rattaché</Label>
            <Select value={propertyId} onValueChange={(val) => setPropertyId(val ?? "none")}>
              <SelectTrigger id="expense-property">
                <SelectValue placeholder="Sélectionnez un bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Frais généraux (non rattaché à un bien spécifique)</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.city ? `(${p.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Catégorie de la dépense *</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory((val as ExpenseCategory) || "eau_electricite")}
            >
              <SelectTrigger id="expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.category && (
              <p className="text-xs text-destructive">{fieldErrors.category}</p>
            )}
          </div>

          {/* Description & Montant (2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">Montant ({currency}) *</Label>
              <Input
                id="expense-amount"
                type="number"
                step="any"
                min="1"
                placeholder="Ex: 50 000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-base"
                required
              />
              {fieldErrors.amount && (
                <p className="text-xs text-destructive">{fieldErrors.amount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expense-date">Date de paiement *</Label>
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              {fieldErrors.date && (
                <p className="text-xs text-destructive">{fieldErrors.date}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-desc">Description de la dépense *</Label>
            <Input
              id="expense-desc"
              placeholder="Ex: Recharge Edan SEEG compteur cour, Vidange fosse..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          {/* Mode de paiement */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-method">Mode de règlement</Label>
            <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val ?? "especes")}>
              <SelectTrigger id="expense-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {paymentMethodLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarques / Référence */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-notes">Notes / Référence facture (optionnel)</Label>
            <Textarea
              id="expense-notes"
              rows={2}
              placeholder="Ex: Facture N° 4589, artisan Jean (plomberie)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#1F5C45] hover:bg-[#184936] text-white"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {expenseToEdit ? "Enregistrer les modifications" : "Ajouter la dépense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
