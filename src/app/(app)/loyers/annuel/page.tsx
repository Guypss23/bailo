import { requireUser } from "@/lib/auth"
import {
  listDueOverviews,
  listLeases,
  listTenants,
  listProperties,
  listPayments,
  generateRentDues,
} from "@/lib/data"
import { buildAnnualGrid } from "@/lib/domain/annual-grid"
import { AnnuelView } from "./annuel-view"

export const metadata = {
  title: "Suivi annuel des loyers | Bailo",
  description: "Grille annuelle des encaissements et suivi des échéances par bien.",
}

interface SuiviAnnuelPageProps {
  searchParams: Promise<{
    annee?: string
    bien?: string
  }>
}

export default async function SuiviAnnuelPage({
  searchParams,
}: SuiviAnnuelPageProps) {
  const { user, profile } = await requireUser()
  const params = await searchParams

  const currentYear = new Date().getFullYear()
  const selectedYear = params.annee ? parseInt(params.annee, 10) || currentYear : currentYear
  const selectedProperty = params.bien || "all"

  // Ensure all missing rent dues are generated up to current date
  await generateRentDues(user.id)

  // Fetch all necessary data server-side
  const [dues, leases, tenants, properties, payments] = await Promise.all([
    listDueOverviews(user.id, { year: String(selectedYear) }),
    listLeases(user.id),
    listTenants(user.id),
    listProperties(user.id),
    listPayments(user.id),
  ])

  // Pure function pivot: leases × months
  const gridData = buildAnnualGrid({
    year: selectedYear,
    leases,
    tenants,
    properties,
    dues,
    payments,
    propertyFilter: selectedProperty,
  })

  const currency = profile.currency || "XAF"

  return (
    <AnnuelView
      data={gridData}
      currency={currency}
      properties={properties}
      activePropertyFilter={selectedProperty}
      leases={leases}
      tenants={tenants}
      dueOverviews={dues}
    />
  )
}
