import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Grove — Career Intelligence"
export const size = { width: 1200, height: 627 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1d232a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #65c3c8, #818cf8)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg, #65c3c8, #818cf8)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1d232a",
            }}
          >
            G
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#a6adba",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Grove
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "800",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Career intelligence
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #65c3c8, #818cf8)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              built around you.
            </span>
          </h1>
          <p
            style={{
              fontSize: "26px",
              color: "#6b7280",
              margin: 0,
              maxWidth: "680px",
              lineHeight: 1.4,
            }}
          >
            Score opportunities. Track your pipeline.
            Protect your nervous system.
          </p>
        </div>

        {/* Bottom right — score pill preview */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "80px",
            display: "flex",
            gap: "12px",
          }}
        >
          {[
            { label: "Alignment", value: "92" },
            { label: "Energy", value: "High" },
            { label: "Signal", value: "Warm" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#272e35",
                border: "1px solid #373d45",
                borderRadius: "10px",
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {item.label}
              </span>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
