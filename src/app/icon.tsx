import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "linear-gradient(135deg, #65c3c8, #818cf8)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "800",
          color: "#1d232a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        G
      </div>
    ),
    { ...size }
  )
}
