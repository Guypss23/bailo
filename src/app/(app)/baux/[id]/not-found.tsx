import { NotFoundState } from "@/components/app/not-found-state"

export default function BailDetailNotFound() {
  return (
    <NotFoundState
      title="Bail introuvable"
      description="Ce contrat de location n'existe pas ou vous n'y avez pas accès."
      backHref="/baux"
      backLabel="Retour aux baux"
    />
  )
}
