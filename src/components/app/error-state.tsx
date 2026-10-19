"use client"

import * as React from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
}

export function ErrorState({
  error,
  reset,
  title = "Une erreur est survenue",
  description = "Impossible de charger ces informations. Veuillez vérifier votre connexion ou réessayer.",
}: ErrorStateProps) {
  React.useEffect(() => {
    console.error("App segment error:", error)
  }, [error])

  return (
    <div className="min-h-[340px] flex flex-col items-center justify-center p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 max-w-lg mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
        {error?.message || description}
      </p>
      <Button
        onClick={() => reset()}
        variant="outline"
        className="border-destructive/30 hover:bg-destructive/10 text-foreground"
      >
        <RotateCcw className="mr-2 w-4 h-4" />
        Réessayer
      </Button>
    </div>
  )
}
