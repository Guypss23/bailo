import { PageHeader } from "@/components/app/page-header"
import { requireUser } from "@/lib/auth"
import { getDemoStatus } from "@/lib/data"
import { ParametresView } from "./parametres-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Paramètres · Bailo",
  description: "Configurez votre profil de bailleur, votre signature, votre devise et vos préférences de relance.",
}

export default async function ParametresPage() {
  const { user, profile } = await requireUser()
  const demoStatus = await getDemoStatus(user.id)

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil de bailleur, votre signature pour les quittances, vos préférences et votre compte."
      />

      <ParametresView
        initialProfile={profile}
        userEmail={user.email}
        demoStatus={demoStatus}
      />
    </div>
  )
}
