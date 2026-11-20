import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Manifiesto de la app: lo que hace que el sitio se pueda instalar en el celu
 * (Android lo ofrece solo; en iPhone, "Compartir → Agregar a inicio").
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    background_color: "#05040a",
    theme_color: "#05040a",
    categories: ["entertainment", "events"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
