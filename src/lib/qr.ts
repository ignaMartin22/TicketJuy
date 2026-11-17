import QRCode from "qrcode";

/**
 * QR en SVG, generado en el servidor.
 * PROVISORIO: hoy codifica el código de la entrada; el real va a llevar un
 * token firmado (HMAC/JWT) de un solo uso.
 */
export function qrSvg(payload: string) {
  return QRCode.toString(payload, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#15102b", light: "#ffffff" },
  });
}
