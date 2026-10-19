"use client"

import { ErrorState } from "@/components/app/error-state"

export default function DashboardError({
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
      title="Erreur sur le tableau de bord"
      description="Impossible de charger vos indicateurs et graphiques financiers. Veuillez réessayer."
    />
  )
}
