"use client"

import { ErrorState } from "@/components/app/error-state"

export default function BienDetailError({
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
      title="Erreur sur la fiche du bien"
      description="Impossible de charger le détail de ce logement. Veuillez réessayer."
    />
  )
}
