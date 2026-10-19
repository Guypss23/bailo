import { NotFoundState } from "@/components/app/not-found-state"

export default function BiensNotFound() {
  return (
    <NotFoundState
      title="Bien non trouvé"
      description="Le logement ou local demandé n'existe pas ou a été archivé."
      backHref="/biens"
      backLabel="Retour aux biens"
    />
  )
}
