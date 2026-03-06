import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grove",
    short_name: "Grove",
    description: "Career intelligence that adapts to your capacity.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d232a",
    theme_color: "#1d232a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple touch icon",
      },
    ],
  }
}
