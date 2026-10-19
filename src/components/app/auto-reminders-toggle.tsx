"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Bell, Loader2 } from "lucide-react"
import { toggleAutoRemindersAction } from "@/lib/email/actions"

export interface AutoRemindersToggleProps {
  leaseId: string
  initialValue: boolean
}

export function AutoRemindersToggle({
  leaseId,
  initialValue,
}: AutoRemindersToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    startTransition(async () => {
      const res = await toggleAutoRemindersAction(leaseId, checked)
      if (res.success) {
        toast.success(
          checked
            ? "Relances et quittances automatiques activées pour ce bail."
            : "Relances automatiques désactivées pour ce bail."
        )
      } else {
        // Revert on error
        setEnabled(!checked)
        toast.error(res.error || "Impossible de mettre à jour le bail.")
      }
    })
  }

  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3 min-w-0 pr-4">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Bell className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor={`auto-reminders-${leaseId}`}
            className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
          >
            Relances et quittances automatiques
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Génère l&apos;avis d&apos;échéance avant terme, les rappels amiables et fermes en cas d&apos;impayé, et transmet la quittance PDF dès réception du solde complet.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center">
        <input
          id={`auto-reminders-${leaseId}`}
          type="checkbox"
          checked={enabled}
          disabled={isPending}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
        />
      </div>
    </div>
  )
}
