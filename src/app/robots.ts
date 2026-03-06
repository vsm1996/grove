import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow LinkedIn and social scrapers to read OG tags from the public root
        userAgent: ["LinkedInBot", "Twitterbot", "facebookexternalhit", "Slackbot-LinkExpanding", "Bluesky Cardybot"],
        allow: "/",
        disallow: ["/dashboard", "/opportunities", "/insights"],
      },
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  }
}
