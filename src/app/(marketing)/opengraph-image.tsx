import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#F7F8F6",
          padding: "70px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#1F5C45",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            B
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#17201B",
              letterSpacing: "-0.5px",
            }}
          >
            Bailo · Gabon
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "950px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#17201B",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
            }}
          >
            Sachez qui a payé son loyer. En un coup d&apos;œil.
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#5E6B64",
              lineHeight: 1.4,
            }}
          >
            Suivi des loyers en Franc CFA (XAF) à Libreville, Akanda et Port-Gentil. Quittances, relances et suivi annuel sans tableur.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "18px",
            color: "#1F5C45",
            fontWeight: 600,
          }}
        >
          <span>✓ Devise Franc CFA (XAF)</span>
          <span>✓ Airtel Money & Moov</span>
          <span>✓ Quittances conformes</span>
          <span>✓ 100 % local</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
