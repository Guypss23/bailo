import * as React from "react"
import type { Metadata } from "next"
import { ConnexionForm } from "./connexion-form"

export const metadata: Metadata = {
  title: "Connexion · Bailo",
  description: "Connectez-vous à votre espace local Bailo",
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const resolvedParams = await searchParams
  const next = resolvedParams?.next

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px]">
      <ConnexionForm next={next} />
    </div>
  )
}
