"use client"

import { ErrorState } from "@/components/app/error-state"

export default function LoyersError({
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
      title="Erreur de chargement des loyers"
      description="Impossible de charger le tableau des échéances et des paiements."
    />
  )
}
