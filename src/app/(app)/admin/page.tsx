import "server-only"
import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin/auth"
import { getAdminData } from "@/lib/admin/data"
import { AdminDashboardView } from "./admin-view"
import { ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Administration | Bailo",
  description: "Zone d'administration de la plateforme Bailo",
}

export default async function AdminPage() {
  const session = await requireAdmin()
  const { metrics, users, authorizedAdmins } = await getAdminData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Administration
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1F5C45]/10 text-[#1F5C45] dark:bg-[#6FCB9F]/15 dark:text-[#6FCB9F] border border-[#1F5C45]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Accès réservé
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Supervision de la plateforme, métriques globales et accompagnement / relance des prospects.
          </p>
        </div>
      </div>

      <AdminDashboardView
        metrics={metrics}
        users={users}
        authorizedAdmins={authorizedAdmins}
        currentAdminEmail={session.user.email}
      />
    </div>
  )
}
