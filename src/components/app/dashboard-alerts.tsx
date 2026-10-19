import * as React from "react"
import Link from "next/link"
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import type {
  DashboardUpcomingItem,
  DashboardExpiringLeaseItem,
} from "@/lib/domain/dashboard"
import { formatMoney, formatDate } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface DashboardUpcomingProps {
  items: DashboardUpcomingItem[]
  currency: string
}

export function DashboardUpcomingCard({ items, currency }: DashboardUpcomingProps) {
  return (
    <Card className="border-border flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Prochaines échéances</CardTitle>
        <CardDescription className="text-xs">
          Loyers arrivant à échéance dans les 7 prochains jours.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        {items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Aucune échéance proche
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aucun loyer n&apos;arrive à échéance dans les 7 prochains jours.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const tenantName = item.tenant
                ? `${item.tenant.first_name} ${item.tenant.last_name}`
                : "Locataire"

              return (
                <div
                  key={item.due.id}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {tenantName}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {item.property?.name ?? "Bien"} · Échéance {formatDate(item.due.due_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatMoney(item.due.total_amount, currency)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export interface DashboardExpiringLeasesProps {
  items: DashboardExpiringLeaseItem[]
}

export function DashboardExpiringLeasesCard({ items }: DashboardExpiringLeasesProps) {
  return (
    <Card className="border-border flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Baux à surveiller</CardTitle>
        <CardDescription className="text-xs">
          Baux dont la fin est prévue dans les 90 jours.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        {items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Aucune fin de bail proche
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aucun bail n&apos;arrive à terme dans les 90 prochains jours.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const tenantName = item.tenant
                ? `${item.tenant.first_name} ${item.tenant.last_name}`
                : "Locataire"
              const isUrgent = item.daysUntilEnd <= 30

              return (
                <div
                  key={item.lease.id}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {tenantName}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {item.property?.name ?? "Bien"} · Fin {item.lease.end_date ? formatDate(item.lease.end_date) : "—"}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${
                        isUrgent
                          ? "border-[#C2413A]/30 bg-[#F7DEDB]/40 text-[#C2413A]"
                          : "border-[#C98A0B]/30 bg-[#F8EBCB]/40 text-[#C98A0B]"
                      }`}
                    >
                      {item.daysUntilEnd === 0
                        ? "Prend fin aujourd'hui"
                        : `Fin dans ${item.daysUntilEnd} j`}
                    </Badge>
                    {item.tenant && (
                      <Link
                        href={`/locataires/${item.tenant.id}`}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="Voir le locataire"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
