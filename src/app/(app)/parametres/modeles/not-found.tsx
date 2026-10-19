import { NotFoundState } from "@/components/app/not-found-state"

export default function ModelesNotFound() {
  return (
    <NotFoundState
      title="Modèle introuvable"
      description="Le modèle de courrier demandé n'existe pas."
      backHref="/parametres/modeles"
      backLabel="Retour aux modèles"
    />
  )
}
