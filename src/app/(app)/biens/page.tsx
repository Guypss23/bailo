import * as React from "react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/app/page-header"
import { PropertyDialog } from "./property-dialog"
import { BiensList, type PropertyListItem } from "./biens-list"
import { requireUser } from "@/lib/auth"
import {
  listProperties,
  listLeases,
  listTenants,
  listDueOverviews,
} from "@/lib/data"
import { todayISO, toPeriod } from "@/lib/format"

export const metadata: Metadata = {
  title: "Biens immobiliers · Bailo",
  description: "Gérez votre parc locatif : appartements, maisons, locaux et parkings.",
}

export default async function BiensPage() {
  const { user, profile } = await requireUser()

  // Load properties (including archived for tab filter)
  const properties = await listProperties(user.id, { includeArchived: true })

  // Load all user leases and tenants
  const leases = await listLeases(user.id)
  const tenants = await listTenants(user.id)

  // Current month's rent dues
  const currentPeriod = toPeriod(todayISO())
  const dueOverviews = await listDueOverviews(user.id, { period: currentPeriod })

  // Construct item aggregates for each property
  const items: PropertyListItem[] = properties.map((property) => {
    // Find active lease if any
    const activeLease =
      leases.find((l) => l.property_id === property.id && l.status === "actif") ??
      null

    const tenant = activeLease
      ? tenants.find((t) => t.id === activeLease.tenant_id) ?? null
      : null

    const currentDue = activeLease
      ? dueOverviews.find((d) => d.lease_id === activeLease.id) ?? null
      : null

    return {
      property,
      activeLease,
      tenant,
      currentDueStatus: currentDue?.status ?? null,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biens"
        description="Gérez votre parc locatif : appartements, maisons, parkings et locaux."
        actions={properties.length > 0 ? <PropertyDialog /> : null}
      />

      <BiensList items={items} currency={profile.currency} />
    </div>
  )
}
