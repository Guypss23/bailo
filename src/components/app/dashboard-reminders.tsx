"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, CheckCircle2, CreditCard, AlertCircle, Send } from "lucide-react"
import { format } from "date-fns"
import type { DashboardReminderItem } from "@/lib/domain/dashboard"
import type { EnrichedDueOverview, Payment } from "@/lib/data/types"
import { formatMoney, formatDate, parseISODate } from "@/lib/format"
import { StatusBadge } from "@/components/app/status-badge"
import { PaymentSheet } from "@/components/app/payment-sheet"
import { ManualReminderDialog } from "@/components/app/manual-reminder-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface DashboardRemindersProps {
  reminders: DashboardReminderItem[]
  payments: Payment[]
  currency: string
}

export function DashboardReminders({
  reminders,
  payments,
  currency,
}: DashboardRemindersProps) {
  const [selectedDue, setSelectedDue] = useState<EnrichedDueOverview | null>(null)
  const [reminderDue, setReminderDue] = useState<EnrichedDueOverview | null>(null)

  const handleOpenPayment = (item: DashboardReminderItem) => {
    // Construct EnrichedDueOverview so PaymentSheet has full context
    const enriched: EnrichedDueOverview = {
      ...item.due,
      property_id: item.property?.id ?? "",
      tenant_id: item.tenant?.id ?? "",
      tenant: item.tenant,
      property: item.property,
      lease: item.lease,
      payments: payments.filter((p) => p.rent_due_id === item.due.id),
      last_reminded_at: item.due.last_reminded_at,
    }
    setSelectedDue(enriched)
  }

  const handleOpenReminder = (item: DashboardReminderItem) => {
    const enriched: EnrichedDueOverview = {
      ...item.due,
      property_id: item.property?.id ?? "",
      tenant_id: item.tenant?.id ?? "",
      tenant: item.tenant,
      property: item.property,
      lease: item.lease,
      payments: payments.filter((p) => p.rent_due_id === item.due.id),
      last_reminded_at: item.due.last_reminded_at,
    }
    setReminderDue(enriched)
  }

  return (
    <>
      <Card className="border-border flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">À relancer</CardTitle>
            <CardDescription className="text-xs">
              Échéances impayées ou partielles à encaisser en priorité.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs h-8">
            <Link href="/loyers?statut=impaye">
              Tout voir
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          {reminders.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center my-auto">
              <div className="w-10 h-10 rounded-full bg-[#1E8A5A]/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#1E8A5A]" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Tous les loyers sont à jour
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                Aucun retard de paiement ni impayé en cours à ce jour.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reminders.slice(0, 6).map((item) => {
                const tenantInitials = item.tenant
                  ? `${item.tenant.first_name[0] || ""}${item.tenant.last_name[0] || ""}`.toUpperCase()
                  : "—"
                const tenantFullName = item.tenant
                  ? `${item.tenant.first_name} ${item.tenant.last_name}`
                  : "Locataire inconnu"

                return (
                  <div
                    key={item.due.id}
                    className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 text-xs shrink-0 bg-secondary text-secondary-foreground font-medium">
                        <AvatarFallback>{tenantInitials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tenantFullName}
                          </p>
                          <StatusBadge status={item.due.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.property?.name ?? "Bien non précisé"}
                          {item.due.days_late > 0 ? (
                            <span className="text-[#C2413A] font-medium ml-1.5">
                              · Retard de {item.due.days_late} j
                            </span>
                          ) : (
                            <span className="ml-1.5">
                              · Échéance {formatDate(item.due.due_date)}
                            </span>
                          )}
                          {item.due.last_reminded_at && (
                            <span className="text-amber-700 dark:text-amber-400 font-medium ml-1.5 inline-flex items-center gap-0.5">
                              · Relancé le {format(parseISODate(item.due.last_reminded_at), "dd/MM")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-11 sm:pl-0">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Reste dû</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(item.due.balance, currency)}
                        </span>
                      </div>

                      {/* Bouton Relancer */}
                      <TooltipProvider>
                        {item.tenant?.email ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReminder(item)}
                            className="h-8 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Relancer
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="h-8 text-xs opacity-50 cursor-not-allowed"
                                  >
                                    <Send className="w-3.5 h-3.5 mr-1" />
                                    Relancer
                                  </Button>
                                </div>
                              }
                            />
                            <TooltipContent side="top" className="text-xs">
                              Le locataire n&apos;a pas d&apos;adresse e-mail renseignée
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPayment(item)}
                        className="h-8 text-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1 text-primary" />
                        Encaisser
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentSheet
        open={!!selectedDue}
        onOpenChange={(open) => !open && setSelectedDue(null)}
        due={selectedDue}
        currency={currency}
      />

      <ManualReminderDialog
        due={reminderDue}
        open={!!reminderDue}
        onOpenChange={(open) => !open && setReminderDue(null)}
        currency={currency}
      />
    </>
  )
}
