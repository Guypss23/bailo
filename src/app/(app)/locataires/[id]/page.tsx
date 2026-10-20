import * as React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react"
import { TenantDetailActions } from "./tenant-detail-actions"
import { CopyButton } from "./copy-button"
import { StatusBadge } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireUser } from "@/lib/auth"
import {
  getTenant,
  listLeases,
  listProperties,
  listDueOverviews,
} from "@/lib/data"
import { computeTenantStats } from "@/lib/domain/tenant-stats"
import { formatDate, formatPeriod, todayISO } from "@/lib/format"
import { cn } from "@/lib/utils"

interface TenantDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: TenantDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { user } = await requireUser()
  const tenant = await getTenant(user.id, id)

  if (!tenant) {
    return { title: "Locataire introuvable · Bailo" }
  }

  return {
    title: `${tenant.first_name} ${tenant.last_name} · Bailo`,
    description: `Fiche locataire, coordonnées et historique de paiement de ${tenant.first_name} ${tenant.last_name}`,
  }
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] || ""
  const l = lastName.trim()[0] || ""
  return (f + l).toUpperCase() || "?"
}

export default async function TenantDetailPage({
  params,
}: TenantDetailPageProps) {
  const { id } = await params
  const { user, profile } = await requireUser()

  const tenant = await getTenant(user.id, id)
  if (!tenant) {
    notFound()
  }

  const [leases, properties, dueOverviews] = await Promise.all([
    listLeases(user.id, { tenantId: id }),
    listProperties(user.id, { includeArchived: true }),
    listDueOverviews(user.id, { tenantId: id }),
  ])

  const propertiesMap = new Map(properties.map((p) => [p.id, p]))

  // Pure stats calculations
  const stats = computeTenantStats(dueOverviews, todayISO())

  // Sort due overviews by period descending (most recent first)
  const sortedDues = [...dueOverviews].sort((a, b) =>
    b.period.localeCompare(a.period)
  )

  // Sort leases descending by start_date
  const sortedLeases = [...leases].sort((a, b) =>
    b.start_date.localeCompare(a.start_date)
  )

  const initials = getInitials(tenant.first_name, tenant.last_name)
  const isArchived = Boolean(tenant.archived_at)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 -ml-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/locataires">
            <ArrowLeft className="w-4 h-4" />
            Retour aux locataires
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/70">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="h-12 w-12 text-base font-bold bg-primary/10 text-primary">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {tenant.first_name} {tenant.last_name}
              </h1>
              {isArchived && (
                <Badge variant="destructive" className="text-xs">
                  Archivé
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enregistré le {formatDate(tenant.created_at.slice(0, 10))}
            </p>
          </div>
        </div>

        {/* Action Buttons: Encaisser, Modifier, Archiver, Supprimer */}
        <TenantDetailActions
          tenant={tenant}
          leases={leases}
          propertiesMap={Object.fromEntries(propertiesMap.entries())}
          dueOverviews={dueOverviews}
          currency={profile.currency}
        />
      </div>

      {/* Coordonnées avec boutons Copier */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Coordonnées & Informations de contact
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Moyens de contact pour l&apos;envoi des quittances et des avis d&apos;échéance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* E-mail */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Adresse e-mail
                  </p>
                  {tenant.email ? (
                    <a
                      href={`mailto:${tenant.email}`}
                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {tenant.email}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Non renseignée</span>
                  )}
                </div>
              </div>
              {tenant.email && <CopyButton value={tenant.email} label="l'e-mail" />}
            </div>

            {/* Téléphone */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Téléphone
                  </p>
                  {tenant.phone ? (
                    <a
                      href={`tel:${tenant.phone.replace(/\s+/g, "")}`}
                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors font-mono truncate block"
                    >
                      {tenant.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Non renseigné</span>
                  )}
                </div>
              </div>
              {tenant.phone && <CopyButton value={tenant.phone} label="le numéro de téléphone" />}
            </div>
          </div>

          {/* Notes privées si présentes */}
          {tenant.notes && (
            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-1">Notes internes :</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {tenant.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 Indicateurs Clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total payé depuis le début */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total encaissé</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground num">
              <Money amount={stats.total_paid} currency={profile.currency} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              Règlements cumulés
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Solde dû actuel */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Solde dû actuel</span>
              {stats.balance_due > 0 ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#1E8A5A]" />
              )}
            </div>
            <p
              className={cn(
                "text-lg sm:text-xl font-bold tracking-tight num",
                stats.balance_due > 0 ? "text-destructive" : "text-foreground"
              )}
            >
              <Money amount={stats.balance_due} currency={profile.currency} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              {stats.balance_due > 0 ? "Restant à percevoir" : "Aucun impayé"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Nombre de retards sur 12 mois */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Retards (12 mois)</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground num">
              {stats.late_count_12m}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {stats.late_count_12m === 0
                ? "Paiements toujours à l'heure"
                : `${stats.late_count_12m} mois avec retard`}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Délai moyen de paiement */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Délai moyen</span>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground num">
              {stats.avg_payment_delay_days === null ? (
                "—"
              ) : stats.avg_payment_delay_days === 0 ? (
                "0 jour"
              ) : stats.avg_payment_delay_days > 0 ? (
                `+${stats.avg_payment_delay_days} j`
              ) : (
                `${stats.avg_payment_delay_days} j`
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {stats.avg_payment_delay_days === null
                ? "Aucune échéance soldée"
                : stats.avg_payment_delay_days <= 0
                ? "Payé avant l'échéance"
                : "Jours après échéance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Baux associés */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Baux associés
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Contrats de location rattachés à ce locataire.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
            <Link href={`/baux/nouveau?locataire=${tenant.id}`}>
              <Plus className="w-3.5 h-3.5" />
              Nouveau bail
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sortedLeases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aucun bail n&apos;est actuellement associé à ce locataire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">Logement</TableHead>
                    <TableHead className="text-xs">Période</TableHead>
                    <TableHead className="text-xs text-right">Loyer CC</TableHead>
                    <TableHead className="text-xs text-center">Statut</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeases.map((l) => {
                    const prop = propertiesMap.get(l.property_id)
                    const totalRent = l.rent_amount + l.charges_amount

                    return (
                      <TableRow key={l.id} className="border-border text-xs">
                        <TableCell className="font-semibold text-foreground">
                          {prop ? (
                            <Link
                              href={`/biens/${prop.id}`}
                              className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                            >
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {prop.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(l.start_date)} →{" "}
                          {l.end_date ? formatDate(l.end_date) : "En cours"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground num">
                          <Money amount={totalRent} currency={profile.currency} />
                        </TableCell>
                        <TableCell className="text-center">
                          {l.status === "actif" && (
                            <Badge className="bg-[#1E8A5A]/15 text-[#1E8A5A] border-transparent text-[11px] font-medium">
                              Actif
                            </Badge>
                          )}
                          {l.status === "termine" && (
                            <Badge variant="outline" className="text-muted-foreground text-[11px]">
                              Terminé
                            </Badge>
                          )}
                          {l.status === "brouillon" && (
                            <Badge variant="secondary" className="text-[11px]">
                              Brouillon
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                            <Link href={`/baux/${l.id}`}>Consulter</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique mois par mois */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Historique mois par mois
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Détail des échéances mensuelles, montants appelés, règlements et soldes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDues.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Aucune échéance de loyer enregistrée pour ce locataire.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/20">
                    <TableHead className="text-xs">Période</TableHead>
                    <TableHead className="text-xs text-right">Dû</TableHead>
                    <TableHead className="text-xs text-right">Payé</TableHead>
                    <TableHead className="text-xs text-right">Reste</TableHead>
                    <TableHead className="text-xs">Date de paiement</TableHead>
                    <TableHead className="text-xs text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDues.map((due) => (
                    <TableRow key={due.id} className="border-border text-xs">
                      <TableCell className="font-medium text-foreground capitalize">
                        {formatPeriod(due.period)}
                      </TableCell>
                      <TableCell className="text-right num font-medium text-foreground">
                        <Money amount={due.total_amount} currency={profile.currency} />
                      </TableCell>
                      <TableCell className="text-right num text-[#1E8A5A] font-semibold">
                        <Money amount={due.paid_amount} currency={profile.currency} />
                      </TableCell>
                      <TableCell className="text-right num">
                        {due.balance > 0 ? (
                          <span className="font-bold text-destructive">
                            <Money amount={due.balance} currency={profile.currency} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0 {profile.currency}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {due.last_paid_at ? formatDate(due.last_paid_at.slice(0, 10)) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={due.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
