import { NotFoundState } from "@/components/app/not-found-state"

export default function LocatairesNotFound() {
  return (
    <NotFoundState
      title="Locataire non trouvé"
      description="Le locataire demandé est introuvable."
      backHref="/locataires"
      backLabel="Retour aux locataires"
    />
  )
}
