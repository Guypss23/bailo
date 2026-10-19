import * as React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Home,
  Store,
  Car,
  Bed,
  Layers,
} from "lucide-react"
import { LeaseDetailActions } from "./lease-detail-actions"
import { LeaseTabsContainer } from "./lease-tabs-container"
import { AutoRemindersToggle } from "@/components/app/auto-reminders-toggle"
import { Money } from "@/components/app/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth"
import {
  getLease,
  getProperty,
  getTenant,
  listDueOverviews,
  leaseHasPayments,
  listDocuments,
} from "@/lib/data"
import { formatDate } from "@/lib/format"
import { paymentMethodLabels } from "@/lib/validations/lease"
import type { RentDueOverview } from "@/lib/data"

interface BailDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: BailDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { user } = await requireUser()
  const lease = await getLease(user.id, id)

  if (!lease) {
    return { title: "Bail introuvable · Bailo" }
  }

  const property = await getProperty(user.id, lease.property_id)
  const tenant = await getTenant(user.id, lease.tenant_id)

  const titleText =
    property && tenant
      ? `Bail ${property.name} (${tenant.last_name}) · Bailo`
      : `Bail #${id.slice(0, 8)} · Bailo`

  return {
    title: titleText,
    description: "Conditions du bail et échéancier complet des loyers.",
  }
}

const typeIcons: Record<string, React.ElementType> = {
  appartement: Building2,
  maison: Home,
  studio: Building2,
  chambre: Bed,
  local_commercial: Store,
  parking: Car,
  autre: Layers,
}

export default async function BailDetailPage({ params }: BailDetailPageProps) {
  const { id } = await params
  const { user, profile } = await requireUser()

  const lease = await getLease(user.id, id)
  if (!lease) {
    notFound()
  }

  const [property, tenant, dues, hasPayments, documents] = await Promise.all([
    getProperty(user.id, lease.property_id),
    getTenant(user.id, lease.tenant_id),
    listDueOverviews(user.id, { leaseId: id }),
    leaseHasPayments(user.id, id),
    listDocuments(user.id, { leaseId: id }),
  ])

  const totalRentCC = lease.rent_amount + lease.charges_amount
  const PropertyIcon = property ? typeIcons[property.type] || Building2 : Building2

  // Group rent dues by year descending
  const duesByYear = dues.reduce<Record<string, RentDueOverview[]>>((acc, due) => {
    const year = due.period.slice(0, 4)
    if (!acc[year]) acc[year] = []
    acc[year].push(due)
    return acc
  }, {})

  const sortedYears = Object.keys(duesByYear).sort((a, b) => b.localeCompare(a))

  // Sort dues inside each year descending by period (most recent first)
  sortedYears.forEach((year) => {
    duesByYear[year].sort((a, b) => b.period.localeCompare(a.period))
  })

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
          <Link href="/baux">
            <ArrowLeft className="w-4 h-4" />
            Retour aux baux
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {property?.name || "Bail de location"}
            </h1>
            {lease.status === "actif" && (
              <Badge className="bg-[#1E8A5A]/15 text-[#1E8A5A] border-transparent font-medium text-xs">
                Actif
              </Badge>
            )}
            {lease.status === "termine" && (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                Terminé
              </Badge>
            )}
            {lease.status === "brouillon" && (
              <Badge variant="secondary" className="text-xs">
                Brouillon
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <span>Locataire : </span>
            {tenant ? (
              <Link
                href={`/locataires/${tenant.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                {tenant.first_name} {tenant.last_name}
              </Link>
            ) : (
              "—"
            )}
            <span>·</span>
            <span>Échéance le {lease.due_day} de chaque mois</span>
          </p>
        </div>

        {/* Actions: Modifier le loyer, Terminer le bail, Supprimer */}
        <LeaseDetailActions
          lease={lease}
          hasPayments={hasPayments}
          currency={profile.currency}
        />
      </div>

      {/* Résumé des conditions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Conditions financières & Termes du contrat
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Détail des montants appelés, dates d&apos;effet et modalités de règlement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linked Property & Tenant cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property block */}
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <PropertyIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Logement loué
                </p>
                {property ? (
                  <>
                    <Link
                      href={`/biens/${property.id}`}
                      className="font-semibold text-xs text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {property.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {property.address_line1}, {property.city}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Logement supprimé</p>
                )}
              </div>
            </div>

            {/* Tenant block */}
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Locataire
                </p>
                {tenant ? (
                  <>
                    <Link
                      href={`/locataires/${tenant.id}`}
                      className="font-semibold text-xs text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {tenant.first_name} {tenant.last_name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {tenant.phone || tenant.email || "Coordonnées enregistrées"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Locataire non renseigné</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Loyer hors charges
              </p>
              <p className="text-sm font-semibold text-foreground num">
                <Money amount={lease.rent_amount} currency={profile.currency} />
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Provision charges
              </p>
              <p className="text-sm font-semibold text-foreground num">
                <Money amount={lease.charges_amount} currency={profile.currency} />
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Loyer total CC
              </p>
              <p className="text-base font-bold text-primary num">
                <Money amount={totalRentCC} currency={profile.currency} />
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Dépôt de garantie
              </p>
              <p className="text-sm font-semibold text-foreground num">
                <Money amount={lease.deposit_amount} currency={profile.currency} />
              </p>
            </div>
          </div>

          {/* Dates & Payment method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-border/60">
            <div>
              <span className="text-muted-foreground">Durée du bail : </span>
              <span className="font-medium text-foreground">
                Du {formatDate(lease.start_date)}{" "}
                {lease.end_date
                  ? `au ${formatDate(lease.end_date)}`
                  : "(sans date de fin)"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Échéance : </span>
              <span className="font-medium text-foreground">
                Le {lease.due_day} de chaque mois
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Mode de règlement : </span>
              <span className="font-medium text-foreground">
                {paymentMethodLabels[lease.payment_method] || lease.payment_method}
              </span>
            </div>
          </div>

          {/* Notes */}
          {lease.notes && (
            <div className="pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground font-semibold">Notes : </span>
              <span className="text-muted-foreground">{lease.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relances et quittances automatiques */}
      <AutoRemindersToggle
        leaseId={lease.id}
        initialValue={lease.auto_reminders ?? false}
      />

      {/* Échéancier et documents */}
      <LeaseTabsContainer
        lease={lease}
        dues={dues}
        documents={documents}
        currency={profile.currency}
        duesByYear={duesByYear}
        sortedYears={sortedYears}
      />
    </div>
  )
}
