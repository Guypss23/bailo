"use client"

import { ErrorState } from "@/components/app/error-state"

export default function LocataireDetailError({
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
      title="Erreur sur la fiche locataire"
      description="Impossible de charger les données de ce locataire. Veuillez réessayer."
    />
  )
}
