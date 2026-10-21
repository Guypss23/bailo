import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bailo · Suivi des loyers pour propriétaires bailleurs",
    short_name: "Bailo",
    description: "Sachez en 10 secondes qui a payé, qui est en retard et combien vous avez encaissé.",
    start_url: "/tableau-de-bord",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0E1412",
    theme_color: "#1F5C45",
    categories: ["finance", "productivity", "business"],
    lang: "fr",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
