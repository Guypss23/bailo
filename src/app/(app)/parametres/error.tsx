"use client"

import { ErrorState } from "@/components/app/error-state"

export default function ParametresError({
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
      title="Erreur dans les paramètres"
      description="Impossible de charger votre profil bailleur ou vos préférences."
    />
  )
}
