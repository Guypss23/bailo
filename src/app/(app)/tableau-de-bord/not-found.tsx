import { NotFoundState } from "@/components/app/not-found-state"

export default function DashboardNotFound() {
  return (
    <NotFoundState
      title="Ressource non trouvée"
      description="L'élément demandé sur le tableau de bord n'existe pas."
      backHref="/tableau-de-bord"
      backLabel="Retour à l'accueil"
    />
  )
}
