// Identidad del sitio desplegado: la marca de la portada y de la app instalable.
// Es el único lugar con estos datos fijos. Los boliches salen del catálogo (multi-boliche):
// cada uno tiene su página en /<boliche>, y el de la portada vive en la raíz.

export const SITE = {
  /** Boliche cuya portada es la raíz del sitio. */
  homeVenue: "infinity",
  /** Nombre completo (título de las pestañas y de la app instalada en Android). */
  name: "Infinity Producciones",
  /** Nombre corto (debajo del ícono en el celu). */
  shortName: "Infinity",
  description: "Las fechas de Infinity en San Salvador de Jujuy. Comprás en un minuto y te llega por WhatsApp.",
} as const;

/** Página principal de un boliche: la raíz para el de la portada, /<boliche> para el resto. */
export function venueHref(venueSlug: string) {
  return venueSlug === SITE.homeVenue ? "/" : `/${encodeURIComponent(venueSlug)}`;
}

/** Ancla al listado de fechas del boliche (en la portada se llama distinto). */
export function venueDatesHref(venueSlug: string) {
  return venueSlug === SITE.homeVenue ? "/#fechas-ancla" : `${venueHref(venueSlug)}#fechas`;
}
