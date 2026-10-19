import type { Metadata } from "next"
import { PresentationHero } from "@/components/marketing/presentation-hero"
import { PresentationSlideSteps } from "@/components/marketing/presentation-slide-steps"
import { PresentationSlideAnnual } from "@/components/marketing/presentation-slide-annual"
import { PresentationSlidePricing } from "@/components/marketing/presentation-slide-pricing"
import { ScrollReveal } from "@/components/marketing/scroll-reveal"

export const metadata: Metadata = {
  title: "Bailo · Suivi des loyers au Gabon (FCFA). En un coup d'œil.",
  description:
    "Bailo remplace votre tableur Excel : loyers du mois en Franc CFA (XAF), suivi annuel, quittances conformes et relances automatiques. Gratuit jusqu'à 2 logements.",
  openGraph: {
    title: "Bailo · Suivi des loyers au Gabon (FCFA). En un coup d'œil.",
    description:
      "Suivi des loyers en Franc CFA pour propriétaires bailleurs particuliers et SCI à Libreville, Akanda, Port-Gentil. Quittances et suivi annuel sans tableur.",
    url: "https://bailo.app",
    siteName: "Bailo",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bailo · Suivi des loyers au Gabon (FCFA). En un coup d'œil.",
    description:
      "Le suivi des loyers en Franc CFA simple, rigoureux et 100 % local pour propriétaires bailleurs particuliers au Gabon.",
  },
}

export default function MarketingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bailo",
    operatingSystem: "Web / macOS / Windows / Linux",
    applicationCategory: "BusinessApplication",
    description:
      "Bailo remplace votre tableur Excel : loyers du mois en Franc CFA (XAF), suivi annuel, quittances et relances automatiques. Gratuit jusqu'à 2 logements au Gabon.",
    offers: [
      {
        "@type": "Offer",
        name: "Découverte",
        price: "0",
        priceCurrency: "XAF",
      },
      {
        "@type": "Offer",
        name: "Bailleur",
        price: "5900",
        priceCurrency: "XAF",
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Presentation Deck Container : Concis, direct et percutant */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 flex flex-col gap-10 sm:gap-14 md:gap-16">
        
        {/* 1. SLIDE HERO : Présentation principale avec ruban 3D émeraude */}
        <PresentationHero />

        {/* 2. SLIDE 01 / 03 : Mise en place en 3 étapes + Aperçu appartement + Important */}
        <ScrollReveal>
          <PresentationSlideSteps />
        </ScrollReveal>

        {/* 3. SLIDE 02 / 03 : Suivi annuel & relances + 3 cartes contrastées + Timeline 01..05 */}
        <ScrollReveal>
          <PresentationSlideAnnual />
        </ScrollReveal>

        {/* 4. SLIDE 03 / 03 : Tarifs transparents (0 FCFA vs 5 900 FCFA) & Démarrage immédiat */}
        <ScrollReveal>
          <PresentationSlidePricing />
        </ScrollReveal>

      </div>
    </>
  )
}
