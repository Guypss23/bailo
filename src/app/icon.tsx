import { ImageResponse } from "next/og"

export const size = {
  width: 512,
  height: 512,
}
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07130E",
        }}
      >
        <div
          style={{
            width: "380px",
            height: "380px",
            borderRadius: "88px",
            backgroundColor: "#1F5C45",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "240px",
              fontWeight: 900,
              color: "#FFFFFF",
              fontFamily: "sans-serif",
              letterSpacing: "-8px",
            }}
          >
            B
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
