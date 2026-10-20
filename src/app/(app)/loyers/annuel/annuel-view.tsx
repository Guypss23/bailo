"use client"

import * as React from "react"
import { useState } from "react"
import { AnnuelHeader } from "./annuel-header"
import { AnnuelGrid } from "./annuel-grid"
import type { Property, Lease, Tenant, RentDueOverview } from "@/lib/data/types"
import type { AnnualGridData } from "@/lib/domain/annual-grid"

export interface AnnuelViewProps {
  data: AnnualGridData
  currency: string
  properties: Property[]
  activePropertyFilter: string
  leases?: Lease[]
  tenants?: Tenant[]
  dueOverviews?: RentDueOverview[]
}

export function AnnuelView({
  data,
  currency,
  properties,
  activePropertyFilter,
  leases = [],
  tenants = [],
  dueOverviews = [],
}: AnnuelViewProps) {
  const [viewMode, setViewMode] = useState<"montants" | "statuts">("montants")

  return (
    <div className="space-y-6">
      <AnnuelHeader
        year={data.year}
        kpis={data.kpis}
        currency={currency}
        properties={properties}
        activePropertyFilter={activePropertyFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        leases={leases}
        tenants={tenants}
        dueOverviews={dueOverviews}
      />

      <AnnuelGrid
        data={data}
        currency={currency}
        viewMode={viewMode}
      />
    </div>
  )
}
