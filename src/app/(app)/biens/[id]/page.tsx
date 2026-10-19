import * as React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft,
  Building2,
  Home,
  Store,
  Car,
  Bed,
  Layers,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileText,
  Plus,
  BarChart3,
  Phone,
  Mail,
} from "lucide-react"
import { PropertyDetailActions } from "./property-detail-actions"
import { StatusBadge } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireUser } from "@/lib/auth"
import { getProperty, listLeases, listTenants, listDueOverviews } from "@/lib/data"
import { formatDate } from "@/lib/format"
import { propertyTypeLabels } from "@/lib/validations/property"
import { PropertyMonthsRow } from "./property-months-row"

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { user } = await requireUser()
  const property = await getProperty(user.id, id)

  if (!property) {
    return { title: "Bien introuvable · Bailo" }
  }

  return {
    title: `${property.name} · Bailo`,
    description: `Détails et gestion du bien ${property.name}`,
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

const paymentMethodLabels: Record<string, string> = {
  virement: "Virement bancaire",
  prelevement: "Prélèvement automatique",
  especes: "Espèces",
  cheque: "Chèque",
  mobile_money: "Mobile Money (Airtel / Moov)",
  carte: "Carte bancaire",
  autre: "Autre",
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params
  const { user, profile } = await requireUser()

  const property = await getProperty(user.id, id)
  if (!property) {
    notFound()
  }

  const [leases, tenants, dues] = await Promise.all([
    listLeases(user.id, { propertyId: id }),
    listTenants(user.id),
    listDueOverviews(user.id),
  ])

  const activeLease = leases.find((l) => l.status === "actif") ?? null
  const activeTenant = activeLease
    ? tenants.find((t) => t.id === activeLease.tenant_id) ?? null
    : null

  const Icon = typeIcons[property.type] || Building2
  const isArchived = Boolean(property.archived_at)

  // Sort leases for history
  const sortedLeases = [...leases].sort((a, b) => b.start_date.localeCompare(a.start_date))

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
          <Link href="/biens">
            <ArrowLeft className="w-4 h-4" />
            Retour aux biens
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {property.name}
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              {propertyTypeLabels[property.type]}
            </Badge>
            {property.surface_m2 && (
              <Badge variant="secondary" className="text-xs num">
                {property.surface_m2} m²
              </Badge>
            )}
            {isArchived && (
              <Badge variant="destructive" className="text-xs">
                Archivé
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              {property.address_line1}
              {property.address_line2 ? `, ${property.address_line2}` : ""}
              {property.postal_code ? ` — ${property.postal_code}` : ""}{" "}
              {property.city} ({property.country})
            </span>
          </p>
        </div>

        {/* Action buttons (Modifier, Archiver, Supprimer) */}
        <PropertyDetailActions property={property} />
      </div>

      {/* Notes block if present */}
      {property.notes && (
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Notes du bien :</p>
            <p className="whitespace-pre-line">{property.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Bloc « Bail en cours » */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Bail en cours
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Conditions de location et informations du locataire actuel.
            </CardDescription>
          </div>
          {activeLease && (
            <Badge className="bg-[#1E8A5A]/15 text-[#1E8A5A] border-transparent font-medium text-xs">
              Actif
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {activeLease ? (
            <div className="space-y-4">
              {/* Locataire */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeTenant
                        ? `${activeTenant.first_name} ${activeTenant.last_name}`
                        : "Locataire non renseigné"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {activeTenant?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {activeTenant.phone}
                        </span>
                      )}
                      {activeTenant?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {activeTenant.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild className="text-xs self-start sm:self-auto">
                  <Link href={`/locataires/${activeLease.tenant_id}`}>
                    Voir la fiche locataire
                  </Link>
                </Button>
              </div>

              {/* Détails financiers & Durée */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Loyer hors charges
                  </p>
                  <p className="text-sm font-semibold text-foreground num">
                    <Money amount={activeLease.rent_amount} currency={profile.currency} />
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Charges
                  </p>
                  <p className="text-sm font-semibold text-foreground num">
                    <Money amount={activeLease.charges_amount} currency={profile.currency} />
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Loyer total CC
                  </p>
                  <p className="text-base font-bold text-primary num">
                    <Money
                      amount={activeLease.rent_amount + activeLease.charges_amount}
                      currency={profile.currency}
                    />
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Dépôt de garantie
                  </p>
                  <p className="text-sm font-semibold text-foreground num">
                    <Money amount={activeLease.deposit_amount} currency={profile.currency} />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-border/60">
                <div>
                  <span className="text-muted-foreground">Période du bail : </span>
                  <span className="font-medium text-foreground">
                    Du {formatDate(activeLease.start_date)}{" "}
                    {activeLease.end_date
                      ? `au ${formatDate(activeLease.end_date)}`
                      : "(durée indéterminée)"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground">Échéance : </span>
                  <span className="font-medium text-foreground">
                    Le {activeLease.due_day} de chaque mois
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground">Règlement : </span>
                  <span className="font-medium text-foreground">
                    {paymentMethodLabels[activeLease.payment_method] || activeLease.payment_method}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                Ce bien est actuellement vacant
              </Badge>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Aucun bail actif n&apos;est rattaché à ce bien. Vous pouvez en créer un dès maintenant pour enregistrer le locataire et planifier les loyers.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" className="gap-1.5 font-medium">
                  <Link href={`/baux/nouveau?bien=${property.id}`}>
                    <Plus className="w-4 h-4" />
                    Créer un bail
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloc « Historique des baux » */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Historique des baux
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tous les contrats de location passés et actuels pour ce bien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedLeases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aucun bail n&apos;a encore été créé pour ce bien.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">Locataire</TableHead>
                    <TableHead className="text-xs">Période</TableHead>
                    <TableHead className="text-xs text-right">Loyer CC</TableHead>
                    <TableHead className="text-xs text-center">Statut</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeases.map((l) => {
                    const tenant = tenants.find((t) => t.id === l.tenant_id)
                    const totalAmount = l.rent_amount + l.charges_amount

                    return (
                      <TableRow key={l.id} className="border-border text-xs">
                        <TableCell className="font-medium text-foreground">
                          {tenant ? `${tenant.first_name} ${tenant.last_name}` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(l.start_date)} →{" "}
                          {l.end_date ? formatDate(l.end_date) : "En cours"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground num">
                          <Money amount={totalAmount} currency={profile.currency} />
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

      {/* Emplacement « 12 derniers mois » avec rangée de pastilles */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              12 derniers mois
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href={`/loyers/annuel?bien=${property.id}`}>
                Vue détaillée annuelle
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Suivi des encaissements et régularité des paiements sur l&apos;année écoulée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyMonthsRow
            leases={leases}
            dues={dues}
            currency={profile.currency || "XAF"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
