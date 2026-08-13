import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_THEME_COLOR, SITE_TITLE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: "Web design and development studio.",
    start_url: "/",
    display: "standalone",
    background_color: SITE_THEME_COLOR,
    theme_color: SITE_THEME_COLOR,
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
