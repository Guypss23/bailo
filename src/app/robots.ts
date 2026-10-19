import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/connexion", "/inscription", "/mentions-legales", "/confidentialite", "/cgu"],
      disallow: [
        "/api/",
        "/tableau-de-bord",
        "/loyers",
        "/baux",
        "/biens",
        "/locataires",
        "/parametres",
        "/dev",
      ],
    },
    sitemap: "https://bailo.app/sitemap.xml",
  }
}
