import { NotFoundState } from "@/components/app/not-found-state"

export default function BoiteEnvoiNotFound() {
  return (
    <NotFoundState
      title="Message non trouvé"
      description="Le message ou courrier demandé est introuvable."
      backHref="/parametres/boite-envoi"
      backLabel="Retour à la boîte d'envoi"
    />
  )
}
