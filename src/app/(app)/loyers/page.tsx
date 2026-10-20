import { requireUser } from "@/lib/auth"
import {
  listEnrichedDueOverviews,
  listProperties,
  listLeases,
  listTenants,
  generateRentDues,
} from "@/lib/data"
import { toPeriod, todayISO } from "@/lib/format"
import { LoyersHeader } from "./loyers-header"
import { LoyersTable } from "./loyers-table"
import { EmptyState } from "@/components/app/empty-state"
import { Receipt } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Loyers du mois | Bailo",
  description: "Suivi des échéances et encaissements mensuels pour propriétaires bailleurs.",
}

interface LoyersPageProps {
  searchParams: Promise<{
    mois?: string
    statut?: string
  }>
}

export default async function LoyersPage({ searchParams }: LoyersPageProps) {
  const { user, profile } = await requireUser()
  const params = await searchParams

  const todayPeriod = toPeriod(todayISO())

  // Parse mois param (e.g. '2026-10' or '2026-10-01')
  let selectedPeriod = todayPeriod
  if (params.mois) {
    const rawMois = params.mois.trim()
    if (/^\d{4}-\d{2}$/.test(rawMois)) {
      selectedPeriod = `${rawMois}-01`
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawMois)) {
      selectedPeriod = toPeriod(rawMois)
    }
  }

  const currency = profile.currency || "XAF"
  const activeStatusFilter = params.statut || "tous"

  // S'assurer que les échéances échues existent
  await generateRentDues(user.id)

  // En un seul appel parallèle côté serveur
  const [enrichedDues, properties, leases, tenants] = await Promise.all([
    listEnrichedDueOverviews(user.id, { period: selectedPeriod }),
    listProperties(user.id),
    listLeases(user.id),
    listTenants(user.id),
  ])

  return (
    <div className="space-y-6">
      {properties.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-6">
            <EmptyState
              icon={Receipt}
              title="Aucun bien enregistré"
              description="Pour suivre vos loyers et générer vos échéances, commencez par ajouter votre premier bien ou chargez les données de démo dans Paramètres."
              action={{
                label: "Ajouter un bien",
                href: "/biens",
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <LoyersHeader
            currentPeriod={selectedPeriod}
            dues={enrichedDues}
            currency={currency}
            activeStatusFilter={activeStatusFilter}
            leases={leases}
            tenants={tenants}
            properties={properties}
          />

          <LoyersTable
            dues={enrichedDues}
            currency={currency}
            currentPeriod={selectedPeriod}
            initialStatusFilter={activeStatusFilter}
          />
        </>
      )}
    </div>
  )
}
