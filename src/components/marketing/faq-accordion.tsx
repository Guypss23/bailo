"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: "Mes données restent-elles réellement privées et confidentielles ?",
    answer:
      "Absolument. Bailo a été conçu avec une approche locale intégrale : vos données sont enregistrées directement sur votre ordinateur ou votre téléphone. Aucun serveur publicitaire externe, aucun traqueur et aucun partage à des tiers. Vous êtes l'unique propriétaire de vos informations financières et de l'identité de vos locataires.",
  },
  {
    question: "Les quittances délivrées sont-elles conformes et reconnues ?",
    answer:
      "Oui. Elles respectent scrupuleusement les exigences légales : distinction nette entre le loyer hors charges et la provision sur charges, montants en Franc CFA (FCFA / XAF), coordonnées complètes du bailleur et du locataire, signature numérique et période exacte. En cas de versement partiel, un reçu d'acompte officiel est édité automatiquement.",
  },
  {
    question: "Puis-je suivre les paiements par Airtel Money et Moov Money ?",
    answer:
      "Tout à fait. Bailo intègre nativement les modes de règlement usuels au Gabon : Airtel Money, Moov Money, virement bancaire (BGFI, UBA, BICIG, etc.), chèque ou espèces. Vous pouvez enregistrer les références de transaction pour un suivi irréprochable.",
  },
  {
    question: "Quelle est la devise utilisée par défaut dans Bailo ?",
    answer:
      "La devise officielle par défaut de toute l'application est strictement le Franc CFA (XAF). Vous pouvez également gérer d'autres devises si vous détenez des biens hors du Gabon (EUR, XOF, MAD, CHF, CAD) depuis vos paramètres en conservant vos calculs exacts.",
  },
  {
    question: "Puis-je facilement basculer depuis mon tableur Excel actuel ?",
    answer:
      "Oui. L'ajout d'un bien situé à Libreville, Akanda, Port-Gentil ou Franceville et de son bail prend moins de 45 secondes. Vos échéances passées et à venir s'organisent automatiquement dans la grille annuelle sans aucune formule à rédiger.",
  },
  {
    question: "Que deviennent mes données si je décide d'arrêter d'utiliser Bailo ?",
    answer:
      "Vos données ne sont jamais bloquées. À tout moment, vous pouvez exporter l'intégralité de vos paiements, baux et récapitulatifs aux formats Excel (.xlsx) et CSV, et télécharger tous vos reçus et quittances PDF. Rien n'est perdu.",
  },
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
          <span>Questions fréquentes</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
          Tout ce que vous devez savoir
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          Des réponses transparentes pour les propriétaires bailleurs au Gabon.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx
          const contentId = `faq-content-${idx}`
          const headerId = `faq-header-${idx}`

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-colors ${
                isOpen ? "border-primary/40 bg-card shadow-xs" : "border-border bg-card/60 hover:bg-card"
              }`}
            >
              <button
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => toggle(idx)}
                className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                <span className="font-medium text-sm sm:text-base text-foreground">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className="px-5 sm:px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40"
                >
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
