import { NotFoundState } from "@/components/app/not-found-state"

export default function AppNotFound() {
  return (
    <NotFoundState
      title="Page introuvable"
      description="La page demandée n'existe pas ou a été déplacée."
      backHref="/tableau-de-bord"
      backLabel="Retour au tableau de bord"
    />
  )
}
