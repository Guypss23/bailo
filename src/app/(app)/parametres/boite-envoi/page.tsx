import { PageHeader } from "@/components/app/page-header"
import { requireUser } from "@/lib/auth"
import { listOutbox } from "@/lib/data"
import { BoiteEnvoiView } from "./boite-envoi-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Boîte d'envoi locale · Bailo",
  description: "Consultez tous les avis d'échéance, relances et quittances enregistrés localement.",
}

export default async function BoiteEnvoiPage() {
  const { user } = await requireUser()
  const messages = await listOutbox(user.id)

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Boîte d'envoi locale"
        description="Historique des e-mails générés par Bailo (avis d'échéance, relances, quittances). Enregistrés localement sans envoi externe."
      />

      <BoiteEnvoiView messages={messages} />
    </div>
  )
}
