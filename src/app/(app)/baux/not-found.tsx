import { NotFoundState } from "@/components/app/not-found-state"

export default function BauxNotFound() {
  return (
    <NotFoundState
      title="Bail non trouvé"
      description="Le contrat de location demandé n'existe pas."
      backHref="/baux"
      backLabel="Retour aux baux"
    />
  )
}
