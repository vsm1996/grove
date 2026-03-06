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
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "6px",
            background: "linear-gradient(180deg, #65c3c8 0%, #818cf8 100%)",
          }}
        />

        {/* Top — wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#65c3c8",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "800",
              color: "#1d232a",
            }}
          >
            G
          </div>
          <span
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#65c3c8",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Grove
          </span>
        </div>

        {/* Middle — headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              display: "flex",
              flexDirection: "column",
              gap: "0px",
            }}
          >
            <span>Career intelligence</span>
            <span style={{ color: "#65c3c8" }}>built around you.</span>
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#a6adba",
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            Score opportunities. Protect your energy. See what your pipeline is telling you.
          </div>
        </div>

        {/* Bottom — scoring dimensions */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { label: "Alignment", value: "92", color: "#65c3c8" },
            { label: "Energy", value: "Expansive", color: "#36d399" },
            { label: "Signal", value: "Warm lead", color: "#818cf8" },
            { label: "Score", value: "84 / 100", color: "#f59e0b" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#272e35",
                border: "1px solid #373d45",
                borderRadius: "12px",
                padding: "16px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "flex",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: item.color,
                  display: "flex",
                }}
              >
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
