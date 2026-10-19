"use client"

import { ErrorState } from "@/components/app/error-state"

export default function BauxError({
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
      title="Erreur de chargement des baux"
      description="Impossible de charger le registre des contrats de location. Veuillez réessayer."
    />
  )
}
