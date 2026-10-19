import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { LeaseWizard } from "./lease-wizard"
import { requireUser } from "@/lib/auth"
import { listProperties, listTenants } from "@/lib/data"

export const metadata: Metadata = {
  title: "Nouveau bail · Bailo",
  description: "Créer un contrat de location et générer automatiquement les échéances de loyers.",
}

interface NouveauBailPageProps {
  searchParams: Promise<{ bien?: string; locataire?: string }>
}

export default async function NouveauBailPage({
  searchParams,
}: NouveauBailPageProps) {
  const { user, profile } = await requireUser()
  const resolvedSearchParams = await searchParams

  const [properties, tenants] = await Promise.all([
    listProperties(user.id),
    listTenants(user.id),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 -ml-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/baux">
            <ArrowLeft className="w-4 h-4" />
            Retour aux baux
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Nouveau bail"
        description="Associez un logement à un locataire et fixez les conditions financières de la location."
      />

      <LeaseWizard
        properties={properties}
        tenants={tenants}
        initialPropertyId={resolvedSearchParams.bien}
        initialTenantId={resolvedSearchParams.locataire}
        currency={profile.currency}
      />
    </div>
  )
}
