import "server-only"
import {
  listProperties,
  listTenants,
  listLeases,
  listPayments,
  listDueOverviews,
  getProfile,
  type Property,
  type Tenant,
  type Lease,
  type Payment,
  type RentDueOverview,
  type Profile,
} from "@/lib/data"
import { todayISO } from "@/lib/format"
import {
  buildDashboardData,
  type DashboardCalculatedData,
} from "@/lib/domain/dashboard"

export interface DashboardViewData extends DashboardCalculatedData {
  currency: string
  profile: Profile | null
  payments: Payment[]
}

/**
 * Fetches all necessary dashboard entities in parallel using src/lib/data,
 * then computes KPIs, chart series, reminders and alerts via pure domain functions.
 */
export async function getDashboardData(userId: string): Promise<DashboardViewData> {
  const [properties, tenants, leases, payments, duesOverviews, profile] =
    await Promise.all([
      listProperties(userId),
      listTenants(userId),
      listLeases(userId),
      listPayments(userId),
      listDueOverviews(userId),
      getProfile(userId),
    ])

  const today = todayISO()
  const calculated = buildDashboardData({
    today,
    properties,
    tenants,
    leases,
    payments,
    duesOverviews,
  })

  return {
    ...calculated,
    currency: profile?.currency || "XAF",
    profile,
    payments,
  }
}
