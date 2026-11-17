import Image from "next/image";
import type { Venue } from "@/lib/mock-data";

/**
 * Logo del boliche con brillo de neón en su color.
 * Si el boliche no tiene logo cargado, usa el nombre en tipografía de afiche.
 */
export function VenueLogo({
  venue,
  className = "",
  glow = true,
  priority = false,
}: {
  venue: Venue;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}) {
  if (!venue.logo) {
    return (
      <span className={`${glow ? "neon-text" : ""} display uppercase ${className}`}>
        {venue.name}
      </span>
    );
  }
  return (
    <Image
      src={venue.logo}
      alt={venue.tagline ? `${venue.name}, ${venue.tagline}` : venue.name}
      width={746}
      height={260}
      priority={priority}
      className={`h-auto ${className}`}
      style={
        glow
          ? {
              filter:
                "drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 80%, transparent)) drop-shadow(0 0 24px color-mix(in oklab, var(--accent) 50%, transparent))",
            }
          : undefined
      }
    />
  );
}
