import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  TrendingDown,
  Building,
  ShieldCheck,
  Sparkles
} from "lucide-react"
import { requireUser } from "@/lib/auth"
import { getDashboardData } from "@/lib/queries/dashboard"
import { formatMoney } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DashboardChart } from "@/components/app/dashboard-chart"
import { DashboardReminders } from "@/components/app/dashboard-reminders"
import {
  DashboardUpcomingCard,
  DashboardExpiringLeasesCard,
} from "@/components/app/dashboard-alerts"
import { DashboardOnboarding } from "@/components/app/dashboard-onboarding"

export const dynamic = "force-dynamic"

export default async function TableauDeBordPage() {
  const { user } = await requireUser()
  const data = await getDashboardData(user.id)

  // Format header greeting
  const firstName =
    data.profile?.full_name?.trim()?.split(" ")[0] ||
    user.email.split("@")[0] ||
    "Propriétaire"

  const now = new Date()
  const formattedDate = format(now, "EEEE d MMMM yyyy", { locale: fr })
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  // If user has no leases: show greeting + onboarding checklist only
  if (!data.hasLeases) {
    return (
      <div className="space-y-6">
        {/* Presentation Header Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Démarrage
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground">{capitalizedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Bonjour {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bienvenue sur votre espace de gestion de baux et loyers.
            </p>
          </div>
        </div>

        <DashboardOnboarding status={data.onboarding} />
      </div>
    )
  }

  const { kpis, currency } = data
  const hasUnpaid = kpis.unpaidInProgress.totalUnpaid > 0

  return (
    <div className="space-y-6">
      {/* Top Presentation Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Vue d&apos;ensemble
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">{capitalizedDate}</span>
            <span className="hidden sm:inline-block text-muted-foreground text-xs">·</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Franc CFA (GA)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bonjour {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Suivi des encaissements et actions prioritaires du mois.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold">
            <Link href="/loyers">
              Voir les loyers
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/baux/nouveau">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nouveau bail
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Indicateurs Clés façon Slide de Présentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Encaissé ce mois */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Encaissé ce mois
            </CardTitle>
            <div className="w-6 h-6 rounded-md bg-[#1E8A5A]/10 text-[#1E8A5A] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {formatMoney(kpis.currentMonth.totalPaid, currency)}
            </div>
            <div className="space-y-1.5">
              <Progress
                value={kpis.currentMonth.recoveryRate}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>sur <strong className="tabular-nums font-semibold text-foreground">{formatMoney(kpis.currentMonth.totalDue, currency)}</strong></span>
                <span className="font-semibold text-foreground">{kpis.currentMonth.recoveryRate} %</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 : Impayés en cours */}
        <Card className={`border-border bg-card shadow-xs ${hasUnpaid ? "border-red-500/30 bg-red-500/5 dark:bg-red-500/10" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Impayés en cours
            </CardTitle>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${hasUnpaid ? "bg-red-500/20 text-[#C2413A]" : "bg-muted text-muted-foreground"}`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                hasUnpaid ? "text-[#C2413A]" : "text-foreground"
              }`}
            >
              {formatMoney(kpis.unpaidInProgress.totalUnpaid, currency)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {hasUnpaid ? (
                <>
                  <span className="font-semibold text-foreground tabular-nums">
                    {kpis.unpaidInProgress.tenantCount}
                  </span>{" "}
                  locataire{kpis.unpaidInProgress.tenantCount > 1 ? "s" : ""}{" "}
                  concerné{kpis.unpaidInProgress.tenantCount > 1 ? "s" : ""}
                </>
              ) : (
                <span className="text-[#1E8A5A] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aucun impayé en retard
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 : Taux d'occupation */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Taux d&apos;occupation
            </CardTitle>
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Building className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {kpis.occupationRate.rate} %
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              <span className="font-semibold text-foreground tabular-nums">
                {kpis.occupationRate.occupiedCount}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {kpis.occupationRate.totalCount}
              </span>{" "}
              bien{kpis.occupationRate.totalCount > 1 ? "s" : ""} loué{kpis.occupationRate.occupiedCount > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 : Encaissé depuis le 1er janvier */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Encaissé en {kpis.yearToDate.year}
            </CardTitle>
            <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {formatMoney(kpis.yearToDate.totalPaid, currency)}
            </div>
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              {kpis.yearToDate.changePercentage !== null ? (
                <>
                  {kpis.yearToDate.changePercentage >= 0 ? (
                    <span className="text-[#1E8A5A] font-semibold tabular-nums inline-flex items-center">
                      +{kpis.yearToDate.changePercentage} %
                    </span>
                  ) : (
                    <span className="text-[#C2413A] font-semibold tabular-nums inline-flex items-center">
                      {kpis.yearToDate.changePercentage} %
                    </span>
                  )}
                  <span>vs période N-1</span>
                </>
              ) : (
                <span>Depuis le 1er janvier</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Recharts 12 derniers mois */}
      <DashboardChart data={data.chartSeries} currency={currency} />

      {/* Section inférieure : À relancer + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* À relancer (7 colonnes desktop) */}
        <div className="lg:col-span-7">
          <DashboardReminders
            reminders={data.reminders}
            payments={data.payments}
            currency={currency}
          />
        </div>

        {/* Prochaines échéances et Baux à surveiller (5 colonnes desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <DashboardUpcomingCard
            items={data.upcomingDues}
            currency={currency}
          />
          <DashboardExpiringLeasesCard
            items={data.expiringLeases}
          />
        </div>
      </div>
    </div>
  )
}
