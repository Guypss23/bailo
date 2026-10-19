import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { BauxTable, type LeaseTableRow } from "./baux-table"
import { requireUser } from "@/lib/auth"
import {
  listLeases,
  listProperties,
  listTenants,
  listDueOverviews,
} from "@/lib/data"
import { toPeriod, todayISO } from "@/lib/format"

export const metadata: Metadata = {
  title: "Baux de location · Bailo",
  description: "Gérez vos contrats de location, dates d'effet, montants de loyer et charges.",
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] || ""
  const l = lastName.trim()[0] || ""
  return (f + l).toUpperCase() || "?"
}

export default async function BauxPage() {
  const { user, profile } = await requireUser()

  const [leases, properties, tenants, currentMonthDues] = await Promise.all([
    listLeases(user.id),
    listProperties(user.id, { includeArchived: true }),
    listTenants(user.id, { includeArchived: true }),
    listDueOverviews(user.id, { period: toPeriod(todayISO()) }),
  ])

  const propertiesMap = new Map(properties.map((p) => [p.id, p]))
  const tenantsMap = new Map(tenants.map((t) => [t.id, t]))
  const duesMapByLease = new Map(currentMonthDues.map((d) => [d.lease_id, d]))

  // Map to LeaseTableRow
  const rows: LeaseTableRow[] = leases.map((lease) => {
    const prop = propertiesMap.get(lease.property_id)
    const tenant = tenantsMap.get(lease.tenant_id)
    const currentMonthDue = duesMapByLease.get(lease.id)

    const tenantName = tenant
      ? `${tenant.first_name} ${tenant.last_name}`
      : "Locataire inconnu"
    const tenantInitials = tenant
      ? getInitials(tenant.first_name, tenant.last_name)
      : "?"

    return {
      id: lease.id,
      property_id: lease.property_id,
      property_name: prop ? prop.name : "Logement supprimé",
      property_type: prop ? prop.type : "appartement",
      tenant_id: lease.tenant_id,
      tenant_name: tenantName,
      tenant_initials: tenantInitials,
      status: lease.status,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount,
      charges_amount: lease.charges_amount,
      total_rent_cc: lease.rent_amount + lease.charges_amount,
      current_month_status: currentMonthDue ? currentMonthDue.status : null,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baux de location"
        description="Gérez vos contrats de location, dates d'effet, montants de loyer et charges."
        actions={
          <Button asChild className="gap-1.5 font-medium">
            <Link href="/baux/nouveau">
              <Plus className="w-4 h-4" />
              Nouveau bail
            </Link>
          </Button>
        }
      />

      <BauxTable leases={rows} currency={profile.currency} />
    </div>
  )
}
