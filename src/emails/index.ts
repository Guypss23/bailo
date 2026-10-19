import * as React from "react"
import { render } from "@react-email/render"

export { AvisEcheanceEmail } from "./avis-echeance"
export type { AvisEcheanceEmailProps } from "./avis-echeance"

export { Relance1Email } from "./relance-1"
export type { Relance1EmailProps } from "./relance-1"

export { Relance2Email } from "./relance-2"
export type { Relance2EmailProps } from "./relance-2"

export { QuittanceEmail } from "./quittance"
export type { QuittanceEmailProps } from "./quittance"

/**
 * Rend un composant React Email en chaîne HTML propre.
 */
export async function renderEmailHtml(
  element: React.ReactElement
): Promise<string> {
  return await render(element)
}
