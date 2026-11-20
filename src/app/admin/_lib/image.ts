/** Tope del archivo original que aceptamos antes de comprimir. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Lado mayor de la portada guardada. Alcanza para pantallas de PC. */
const MAX_SIDE = 1600;
const QUALITY = 0.82;

/**
 * Achica la foto y la devuelve como data URL JPEG. Con API se sube así de liviana
 * (el back la vuelve a achicar y la pasa a WebP); en modo demo se guarda en localStorage.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen (JPG, PNG o WebP).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("La imagen pesa más de 15 MB. Probá con una más liviana.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No pudimos leer la imagen. Probá con otro archivo.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}
