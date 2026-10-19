import { NotFoundState } from "@/components/app/not-found-state"

export default function AnnuelNotFound() {
  return (
    <NotFoundState
      title="Exercice annuel non trouvé"
      description="L'année demandée est introuvable."
      backHref="/loyers/annuel"
      backLabel="Retour à l'année en cours"
    />
  )
}
