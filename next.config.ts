import type { NextConfig } from "next";

// Las portadas de las fechas se sirven desde el back (/media/): Next las optimiza solo desde ahí.
const api = process.env.TICKETERA_API_URL;
const mediaPattern = api ? [new URL("/media/**", api)] : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: mediaPattern,
    // En desarrollo el back corre en 127.0.0.1, que Next bloquea por defecto.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  experimental: {
    // La portada se sube desde el panel con una server action (llega achicada a ~1600 px).
    serverActions: { bodySizeLimit: "4mb" },
  },
  partialPrefetching: true,
  // El service worker se pide siempre de nuevo (sin caché), así el celu toma la versión nueva al toque.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
