# Naranja X y Macro Click de Pago

Investigado el 2026-11-25 y actualizado el 2026-11-26. La pregunta: ¿se pueden sumar como medio de pago además de Mercado Pago?

**Resumen:** se pueden integrar los dos, porque tienen API, sandbox y webhooks. Pero **ninguno separa nuestra comisión sola** (no tienen split): la plata entra entera al boliche y la comisión de TicketJuy se le factura aparte. Además, cada boliche tiene que contratarlos por su cuenta con el banco. Por eso no reemplazan a MP; a lo sumo, son una segunda opción en el checkout.

---

## 1. Lo que ya funciona con Mercado Pago

- El checkout de MP **ya acepta la tarjeta de crédito Naranja X** ([medios de pago de MP](https://www.mercadopago.com.ar/developers/es/support/19301)).
- **Plan Z** (la opción de Naranja X de elegir las cuotas al recibir el resumen) se activa en MP ofreciendo 3 cuotas sin interés. El costo para el vendedor es el mismo que el de 3 cuotas sin interés ([ayuda de MP](https://www.mercadopago.com.ar/developers/en/support/17974)).

Si lo que busca Infinity es que la gente pueda pagar con su Naranja o con Plan Z, **no hace falta integrar nada nuevo**: es una configuración de la cuenta de MP del boliche. La decisión es quién paga el costo de las cuotas sin interés.

---

## 2. Naranja X

- **Los cobros de Naranja X Comercios los presta Nave**, la plataforma de cobros de Banco Galicia ([Riela](https://riela.io/pasarelas/naranja_x) ⚠️).
- **API online:** Nave tiene una API con OAuth entre servidores, crea una intención de pago que devuelve un `checkout_url`, avisa por webhook y tiene sandbox ([plugin oficial de Nave para WooCommerce](https://wordpress.org/plugins/nave-for-woocommerce/)).
- **Alta:** las credenciales (client ID, client secret y POS ID) se piden por mail a Nave con el CUIT del comercio y tardan unos días hábiles ([guía de DP Tienda Online](https://dptiendaonline.com/ayuda/como-conectar-nave/) ⚠️). Nave atiende tanto a clientes de Galicia como de Naranja X ([Nave Developers](https://navenegocios.ar/home/developers)).
- **Comisiones:**

| Medio | App Naranja X (acreditación al instante) | Nave online, al instante | Nave online, a plazo |
|---|---|---|---|
| Dinero en cuenta / QR | 0,8 % + IVA | 0,8 % + IVA | — |
| Débito | 1,2 % + IVA | 1,6 % + IVA | 0,8 % + IVA (1 día) |
| Crédito | 4,5 % + IVA | 5,8 % + IVA | 1,8 % + IVA (hasta 18 días hábiles) |

Fuentes: [Naranja X según LupaPago](https://lupapago.com/mercado-pago-vs-naranja-x/) ⚠️ y [comisiones de Nave](https://navenegocios.ar/home/comisiones---nave).

- **Split:** no encontré nada documentado.

---

## 3. Macro Click de Pago

- **Qué es:** el botón de pago online de Banco Macro. Acepta débito y crédito de todos los bancos y casi todas las marcas, y DEBIN ([página de Macro](https://www.macro.com.ar/empresas/cobros-y-pagos/boton-de-pago)). Algunos convenios también incluyen QR.
- **Alta:** el boliche tiene que tener cuenta en Macro y firmar el contrato en una sucursal o con su oficial de cuentas. El banco entrega un ID de comercio y una clave secreta, de prueba y de producción, y pone un equipo para ayudar con la integración.
- **Integración:** se cifran los datos del pago (AES), se firman con un hash SHA-256 y se redirige al comprador a la página del botón. La confirmación llega por webhook ([plugin no oficial para WooCommerce](https://github.com/lucianokatze/macroclickdepago-for-woocommerce)). Un comparador dice que los webhooks a veces fallan ([SIGENIO](https://gestioninstitutos.com/blog/mercadopago-vs-click-de-pago-institutos) ⚠️), así que habría que consultar el estado de cada pago como respaldo.
- **Comisiones:** se negocian con el banco y varían mucho según el cliente.
  - Un municipio con mucho volumen: débito 1 %, crédito 1,55 %, crédito en cuotas 2,55 %, DEBIN 0,8 % y QR 0,7 %, más IVA ([decreto de la Municipalidad de Luján](https://boletinoficial.lujan.gob.ar/api/documentos/1489671/pdf)).
  - Una asociación deportiva: ≈ 3 % en todos los medios ([diseño de pagos de OnAPB](https://gitea.fcyt.uader.edu.ar/alumnos_ti/OnAPB-Carrere_Demartin/raw/commit/70d4217109514a7fbb22a7872353611ff83f69dd/docs/superpowers/specs/2026-04-24-pagos-macro-design.md) ⚠️).
- **Acreditación:** débito y DEBIN, 1 día hábil. Crédito, 18 días hábiles.
- **Split:** no hay nada documentado. Cada comercio tiene sus propias credenciales: varios boliches se pueden conectar, pero cada uno con su contrato.

---

## 4. Qué cambia para TicketJuy

| | Mercado Pago | Naranja X / Nave | Macro Click de Pago |
|---|---|---|---|
| Alta del boliche | Por su cuenta, con OAuth, en minutos | Pedido por mail, unos días | Contrato en el banco |
| Separa nuestra comisión | Sí (`marketplace_fee`) | No | No |
| Webhook | Sí, firmado | Sí | Sí, poco confiable según un comparador |
| Crédito al instante | ≈ 6 % + IVA | 4,5–5,8 % + IVA | No existe (18 días hábiles) |
| Crédito a plazo | Más barato cuanto más espera | 1,8 % + IVA | Negociado (1,55–3 %) |

Sin split, la entrada se cobra entera en la cuenta del boliche y **TicketJuy le factura su comisión aparte**, por ejemplo a fin de mes. Eso implica:
- Riesgo de que el boliche no pague.
- Conciliar las ventas de cada boliche con lo que facturamos.
- Encaja mejor con un cargo fijo por entrada o un abono que con un porcentaje que se descuenta solo.

---

## Cómo se consiguen las credenciales

**Nave (Naranja X y Galicia).** El boliche necesita cuenta de comercio en Naranja X o en Galicia.
1. En Nave, ir a Integraciones › Tienda online propia y activar el **código de vinculación**.
2. Mandar un mail a **integraciones@navenegocios.com** con el **CUIT**, el código y la **URL de notificación** del backend, pidiendo el alta de "Online · Checkout" de prueba y de producción.
3. Nave devuelve client ID, client secret, audience y POS ID, en unos días hábiles.

**Macro Click de Pago.** El boliche necesita cuenta en Macro.
1. Pedirle al oficial de cuentas, o en la sucursal, el alta del **"Botón Integrado" de Click de Pago**.
2. El banco manda por mail el **ID de comercio** y la **clave secreta** (frase), de prueba y de producción. Si el comercio tiene sucursales, también el ID de sucursal.
3. Conviene pedir también la **documentación técnica** del botón y la **propuesta de tasas y plazos** por medio de pago, y preguntar si ofrecen dividir el pago entre comercios.
4. En el panel de Macro (sandbox o producción) se carga la URL de notificación del backend.

---

## Estado de la integración

Implementado en `ticketera-core` (rama `feat/macro-nave`) y en el front (rama `feat/medios-de-pago`), sin probar contra los bancos. El detalle técnico está en `docs/specs/pasarelas.md` de `ticketera-core`.

- **Credenciales:** se cargan por boliche desde la pestaña Conexiones del panel de la plataforma y se guardan cifradas.
- **Checkout:** en la página del pedido, el comprador elige entre los medios que el boliche tenga conectados.
- **Macro:** el backend arma el formulario cifrado y firmado y lo manda al botón del banco. Confirma consultando la API de PlusPagos, sin confiar en el aviso.
- **Nave:** el backend crea la intención de pago y manda al comprador al checkout de Nave. Confirma consultando la intención de pago.
- **Comisión:** sin reparto, la venta entra entera a la cuenta del boliche. Cada pedido guarda la comisión calculada (`Order.platform_fee`) por si hay que liquidarla por fuera. Si el boliche no paga comisión, su tasa va en 0.

**Falta:**
- Probar con las credenciales de prueba de cada banco.
- Validar el formato contra la documentación oficial, sobre todo:
  - en Macro, la firma con la IP del comprador y la consulta de transacciones;
  - en Nave, los estados y el dominio del checkout.
- Un reporte de liquidación por período, si el boliche paga comisión.

⚠️ = fuente secundaria (comparadores, plugins de terceros o guías de otras tiendas), no del propio banco.
