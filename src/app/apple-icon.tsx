import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          background: "linear-gradient(135deg, #65c3c8, #818cf8)",
          borderRadius: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "100px",
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
