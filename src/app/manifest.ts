import type { MetadataRoute } from "next";

import { DEFAULT_BRAND, PRODUCT_NAME } from "@/lib/brand";

// Manifest del producto (la app nativa es una sola, con la marca del producto).
// El branding por-tenant sigue viviendo en la UI/exportables vía brand.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PRODUCT_NAME} — Administración de PH`,
    short_name: PRODUCT_NAME,
    description: `${PRODUCT_NAME}: portal de residentes, accesos y administración de propiedad horizontal.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: DEFAULT_BRAND.primary,
    lang: "es",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
