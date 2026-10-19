import { NotFoundState } from "@/components/app/not-found-state"

export default function LocataireDetailNotFound() {
  return (
    <NotFoundState
      title="Locataire introuvable"
      description="Ce locataire n'existe pas ou a été archivé."
      backHref="/locataires"
      backLabel="Retour aux locataires"
    />
  )
}
