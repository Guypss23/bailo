"use client"

import { ErrorState } from "@/components/app/error-state"

export default function LocatairesError({
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
      title="Erreur de chargement des locataires"
      description="Impossible de charger le répertoire des locataires. Veuillez réessayer."
    />
  )
}
