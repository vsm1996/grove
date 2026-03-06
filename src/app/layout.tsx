import type { Metadata, Viewport } from "next"
import ClientLayout from "./client-layout"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Grove",
    template: "%s | Grove",
  },
  description: "Career intelligence that adapts to your capacity. Score opportunities, track your pipeline, and protect your nervous system through the job search.",
  applicationName: "Grove",
  keywords: ["career", "job search", "opportunities", "career intelligence"],
  authors: [{ name: "Grove" }],
  creator: "Grove",
  metadataBase: new URL("https://grove-intel.vercel.app/"),
  openGraph: {
    type: "website",
    url: "https://grove-intel.vercel.app",
    siteName: "Grove",
    locale: "en_US",
    title: "Grove — Career Intelligence",
    description: "Score opportunities. Track your pipeline. Protect your nervous system. A career intelligence system that adapts to how you feel right now.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 627,
        alt: "Grove — Career Intelligence",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grove — Career Intelligence",
    description: "Score opportunities. Track your pipeline. Protect your nervous system.",
    images: ["/opengraph-image"],
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
      </body>
    </html>
  )
}
