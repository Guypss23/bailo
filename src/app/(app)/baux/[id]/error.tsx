"use client"

import { ErrorState } from "@/components/app/error-state"

export default function BailDetailError({
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
      title="Erreur sur la fiche du bail"
      description="Impossible de charger le contrat ou ses échéances. Veuillez réessayer."
    />
  )
}
