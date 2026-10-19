"use client"

import { ErrorState } from "@/components/app/error-state"

export default function ModelesError({
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
      title="Erreur d'affichage des modèles"
      description="Impossible de générer l'aperçu des modèles d'e-mails. Veuillez réessayer."
    />
  )
}
