import { NotFoundState } from "@/components/app/not-found-state"

export default function ParametresNotFound() {
  return (
    <NotFoundState
      title="Section introuvable"
      description="L'onglet ou le réglage demandé n'existe pas."
      backHref="/parametres"
      backLabel="Retour aux paramètres"
    />
  )
}
