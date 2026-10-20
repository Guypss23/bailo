import * as React from "react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/app/page-header"
import { TenantsTable, type TenantTableRow } from "./tenants-table"
import { TenantDialog } from "./tenant-dialog"
import { requireUser } from "@/lib/auth"
import {
  listTenants,
  listLeases,
  listProperties,
  listDueOverviews,
} from "@/lib/data"
import { computeTenantBalanceDue } from "@/lib/domain/tenant-stats"
import { todayISO, toPeriod } from "@/lib/format"

export const metadata: Metadata = {
  title: "Locataires · Bailo",
  description: "Gestion des locataires, soldes de loyer et historique des contrats.",
}

export default async function LocatairesPage() {
  const { user, profile } = await requireUser()

  const [tenants, leases, properties, allDueOverviews] = await Promise.all([
    listTenants(user.id, { includeArchived: true }),
    listLeases(user.id),
    listProperties(user.id, { includeArchived: true }),
    listDueOverviews(user.id),
  ])

  const propertiesMap = new Map(properties.map((p) => [p.id, p]))
  const currentPeriod = toPeriod(todayISO())

  // Map each tenant to a rich table row
  const rows: TenantTableRow[] = tenants.map((tenant) => {
    // Find active lease if any
    const activeLease = leases.find(
      (l) => l.tenant_id === tenant.id && l.status === "actif"
    )
    const activeProperty = activeLease
      ? propertiesMap.get(activeLease.property_id)
      : null

    // Overviews for this tenant
    const tenantOverviews = allDueOverviews.filter(
      (o) => o.tenant_id === tenant.id
    )

    // Current month status
    const currentMonthOverview = tenantOverviews.find(
      (o) => o.period === currentPeriod
    )

    const balanceDue = computeTenantBalanceDue(tenantOverviews)

    return {
      id: tenant.id,
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      full_name: `${tenant.first_name} ${tenant.last_name}`,
      email: tenant.email,
      phone: tenant.phone,
      archived_at: tenant.archived_at,
      active_property_id: activeProperty ? activeProperty.id : null,
      active_property_name: activeProperty ? activeProperty.name : null,
      balance_due: balanceDue,
      current_month_status: currentMonthOverview?.status ?? null,
      has_unpaid: balanceDue > 0,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locataires"
        description="Coordonnées, état des paiements et baux associés à vos locataires."
        actions={tenants.length > 0 ? <TenantDialog /> : null}
      />

      <TenantsTable data={rows} currency={profile.currency} />
    </div>
  )
}
