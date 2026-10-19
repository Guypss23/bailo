"use client"

import { ErrorState } from "@/components/app/error-state"

export default function AppError({
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
      title="Erreur de chargement"
      description="Une erreur inattendue est survenue lors de l'accès à l'application."
    />
  )
}
