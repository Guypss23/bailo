"use client"

import { ErrorState } from "@/components/app/error-state"

export default function AnnuelError({
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
      title="Erreur sur la grille annuelle"
      description="Impossible de générer le suivi annuel des loyers. Veuillez réessayer."
    />
  )
}
