import { NotFoundState } from "@/components/app/not-found-state"

export default function BienDetailNotFound() {
  return (
    <NotFoundState
      title="Bien introuvable"
      description="Ce bien n'existe pas ou vous n'avez pas l'autorisation d'y accéder."
      backHref="/biens"
      backLabel="Retour à la liste des biens"
    />
  )
}
