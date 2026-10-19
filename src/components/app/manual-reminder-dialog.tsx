"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Send, Loader2, Mail } from "lucide-react"
import type { EnrichedDueOverview } from "@/lib/data/types"
import { formatMoney, formatPeriod, formatDate } from "@/lib/format"
import { sendManualReminderAction } from "@/lib/email/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface ManualReminderDialogProps {
  due: EnrichedDueOverview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency?: string
}

export function ManualReminderDialog({
  due,
  open,
  onOpenChange,
  currency = "XAF",
}: ManualReminderDialogProps) {
  const [isPending, startTransition] = useTransition()

  const tenant = due?.tenant
  const tenantName = tenant
    ? `${tenant.first_name} ${tenant.last_name}`.trim()
    : "Locataire"
  const tenantEmail = tenant?.email || ""
  const periodLabel = due ? formatPeriod(due.period) : ""
  const remainingAmount = due ? formatMoney(due.balance, currency) : ""
  const dueDateFormatted = due ? formatDate(due.due_date) : ""

  const defaultSubject = `Rappel de paiement - Loyer de ${periodLabel}`
  const defaultBody = `Bonjour ${tenantName},

Sauf erreur ou retard d'acheminement de notre part, nous constatons que le règlement de votre loyer pour la période de ${periodLabel} (${remainingAmount}) dont l'échéance était fixée au ${dueDateFormatted} ne nous est pas parvenu.

Nous vous remercions de bien vouloir procéder à sa régularisation dès que possible.

Si votre virement a déjà été effectué, merci de ne pas tenir compte de ce rappel.

Bien cordialement,`

  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)

  // Reset text when due changes
  React.useEffect(() => {
    if (due) {
      setSubject(`Rappel de paiement - Loyer de ${formatPeriod(due.period)}`)
      setBody(`Bonjour ${tenantName},

Sauf erreur ou retard d'acheminement de notre part, nous constatons que le règlement de votre loyer pour la période de ${formatPeriod(due.period)} (${formatMoney(due.balance, currency)}) dont l'échéance était fixée au ${formatDate(due.due_date)} ne nous est pas parvenu.

Nous vous remercions de bien vouloir procéder à sa régularisation dès que possible.

Si votre virement a déjà été effectué, merci de ne pas tenir compte de ce rappel.

Bien cordialement,`)
    }
  }, [due, tenantName, currency])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!due) return

    startTransition(async () => {
      const res = await sendManualReminderAction({
        dueId: due.id,
        subject,
        message: body,
      })

      if (res.success) {
        toast.success(`Relance enregistrée dans la boîte d'envoi pour ${tenantName}.`)
        onOpenChange(false)
      } else {
        toast.error(res.error || "Impossible d'envoyer la relance.")
      }
    })
  }

  if (!due) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Envoyer une relance de paiement
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Aperçu du message qui sera déposé dans la boîte d&apos;envoi locale pour{" "}
              <strong className="text-foreground">{tenantName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {/* Destinataire */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground">Destinataire :</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {tenantEmail}
              </span>
            </div>

            {/* Objet */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-subject" className="text-xs font-medium">
                Objet de l&apos;e-mail
              </Label>
              <Input
                id="reminder-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Corps du message */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-body" className="text-xs font-medium">
                Message personnalisé
              </Label>
              <textarea
                id="reminder-body"
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Envoyer la relance
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
