import QRCode from "qrcode";

/**
 * QR en SVG, generado en el servidor. Codifica el texto tal como lo manda la
 * API (el token firmado de un solo uso), sin modificarlo.
 */
export function qrSvg(payload: string) {
  return QRCode.toString(payload, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#15102b", light: "#ffffff" },
  });
}
