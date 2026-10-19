"use client"

import { ErrorState } from "@/components/app/error-state"

export default function BoiteEnvoiError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Erreur dans la boîte d'envoi"
      description="Impossible de charger l'historique des courriers et relances."
    />
  )
}
