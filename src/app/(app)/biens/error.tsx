"use client"

import { ErrorState } from "@/components/app/error-state"

export default function BiensError({
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
      title="Erreur de chargement des biens"
      description="Impossible de charger la liste de vos logements. Veuillez réessayer."
    />
  )
}
