import { NotFoundState } from "@/components/app/not-found-state"

export default function LoyersNotFound() {
  return (
    <NotFoundState
      title="Échéance non trouvée"
      description="L'échéance ou le paiement demandé est introuvable."
      backHref="/loyers"
      backLabel="Retour aux loyers"
    />
  )
}
