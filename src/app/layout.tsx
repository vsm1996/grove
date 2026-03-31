import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import ClientLayout from "./client-layout"
import "./globals.css"

const siteUrl = "https://grove-intel.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Grove",
    template: "%s | Grove",
  },
  description: "Career intelligence that adapts to your capacity. Score opportunities, track your pipeline, and protect your nervous system through the job search.",
  applicationName: "Grove",
  keywords: ["career", "job search", "opportunities", "career intelligence"],
  authors: [{ name: "Vanessa Martin" }],
  creator: "Grove",
  // VERCEL_URL is set automatically by Vercel; falls back for local dev
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "Grove",
    locale: "en_US",
    title: "Grove — Career Intelligence",
    description: "Score opportunities. Track your pipeline. Protect your nervous system. A career intelligence system that adapts to how you feel right now.",
    // og:image is handled exclusively by opengraph-image.tsx — Next.js auto-generates
    // the correct absolute URL from the request host. Specifying it here too creates
    // duplicate og:image tags with a potentially wrong metadataBase URL, causing
    // LinkedIn to 404 the image and fall back to "web link".
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/grove.png`,
        width: 1200,
        height: 630,
        alt: "Grove — Career Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grove — Career Intelligence",
    description: "Score opportunities. Track your pipeline. Protect your nervous system.",
  },
  // Named-crawler noindex only — blanket <meta name="robots" noindex> causes
  // LinkedIn/Bluesky scrapers to refuse rich card previews. robots.txt handles
  // blocking general crawlers.
  robots: {
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
}

export const viewport: Viewport = {
  themeColor: "#1d232a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  )
}
