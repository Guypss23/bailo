import * as React from "react"
import type { Metadata } from "next"
import { InscriptionForm } from "./inscription-form"

export const metadata: Metadata = {
  title: "Créer un compte · Bailo",
  description: "Rejoignez Bailo pour gérer vos biens et loyers en local",
}

export default function InscriptionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px]">
      <InscriptionForm />
    </div>
  )
}
