import * as React from "react"
import { Suspense } from "react"
import { AppSidebar } from "@/components/app/app-sidebar"
import { MobileNav } from "@/components/app/mobile-nav"
import { requireUser } from "@/lib/auth"
import { ensureRentDues } from "@/lib/rent-dues"
import { runDailyTasks } from "@/lib/daily"
import { todayISO } from "@/lib/format"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUser()
  const today = todayISO()
  if (profile.last_daily_run !== today) {
    try {
      await runDailyTasks(user.id, today)
    } catch (err) {
      console.error("Erreur lors de l'exécution automatique des tâches du jour :", err)
    }
  } else {
    // Ensure rent dues are generated up to next month
    try {
      await ensureRentDues(user.id)
    } catch (err) {
      console.error("Erreur lors de la génération automatique des échéances :", err)
    }
  }

  const userName = profile.full_name || user.email.split("@")[0]
  const userEmail = user.email

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Suspense fallback={<div className="hidden md:block w-16 lg:w-[248px] fixed inset-y-0 left-0 bg-card border-r border-border" />}>
        <AppSidebar userName={userName} userEmail={userEmail} />
      </Suspense>
      <Suspense fallback={<div className="md:hidden h-14 bg-background border-b border-border" />}>
        <MobileNav userName={userName} userEmail={userEmail} />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-16 lg:pl-[248px] pb-20 md:pb-8">
        <div className="max-w-[1280px] mx-auto p-4 sm:p-6">
          <Suspense fallback={<div className="animate-pulse space-y-4 py-8"><div className="h-8 w-48 bg-muted rounded" /></div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
