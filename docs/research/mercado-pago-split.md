# Mercado Pago Split de Pagos 1:1: investigación para TicketJuy

> **Fecha de consulta:** 2026-11-17. Todas las fuentes son páginas oficiales de Mercado Pago Argentina (`mercadopago.com.ar`). Las comisiones cambian seguido: los números de la sección 5 son los que se publicaban **ese día**.
>
> **Cómo leer este documento:** cada afirmación cita su URL. Lo que no está respaldado por una página oficial se marca con **⚠️ No confirmado**. Las preguntas para soporte de Mercado Pago están al final.
>
> Nota de método: varias páginas del Centro de Ayuda (`/ayuda/...`) y la sección de costos de la cuenta (`/costs-section`) se arman del lado del navegador o piden login. No se pudieron leer de forma automática (respondieron 403, mostraron la página vacía o redirigieron al login). Por eso las comisiones salen de las páginas comerciales oficiales de Checkout y Link de pago.

---

## Resumen para TicketJuy

| # | Hallazgo | Impacto en el diseño del README |
|---|---|---|
| 1 | Para el marketplace hace falta una **cuenta de vendedor con KYC nivel 6** y una **aplicación creada con el modelo "Marketplace"** en Tus integraciones (producto Checkout Pro o Checkout API). | TicketJuy tiene que tener su cuenta verificada a nivel 6 **antes** de empezar. Es un trámite que bloquea todo lo demás. |
| 2 | El OAuth da un `access_token` del vendedor válido por **180 días (6 meses)** y un `refresh_token`. **Cada renovación devuelve un `refresh_token` nuevo**, y si no se renueva a tiempo hay que volver a vincular al boliche. | Hace falta un job que renueve los tokens antes de que venzan y guarde el `refresh_token` nuevo cada vez, más una alerta de "vinculación vencida o revocada". Hay que escuchar el tópico `mp-connect`. |
| 3 | Los pagos y las preferencias se crean con el **`access_token` del vendedor** (backend). En el frontend va la **`public_key` del integrador** (TicketJuy). | Confirma lo que dice el README. Cada `Venue` guarda su token, cifrado. |
| 4 | `marketplace_fee` (Checkout Pro) y `application_fee` (Checkout API) son un **monto en moneda local, no un porcentaje**. No puede superar el total ni ser negativo. | Confirma el README: el % (o fijo + %, con tope) lo calcula TicketJuy y manda el monto en pesos. |
| 5 | **La comisión de MP se descuenta primero, de lo que cobra el vendedor**, y la del marketplace sale del saldo restante. | En "Comisión al boliche", el boliche paga MP + TicketJuy. En "Cargo al comprador", el cargo tiene que cubrir también la comisión de MP sobre el total si se quiere que al boliche le llegue el 100 %. La calculadora del README tiene que modelar esto. |
| 6 | Medios de pago: la doc del split dice que **"sólo permite realizar pagos con dinero en cuenta entre cuentas de Mercado Pago. No se permiten transferencias de instituciones financieras externas."** En Bricks/marketplace **no se pueden ofrecer cuotas sin tarjeta (Mercado Crédito)**. | La frase es ambigua (ver sección 2). Antes de prometer tarjetas, débito o Rapipago/Pago Fácil en el split hay que probarlo en sandbox y confirmarlo con MP. **Transferencias bancarias externas: no.** |
| 7 | Reembolsos: se reparten **proporcionalmente** entre boliche y marketplace. **Si el boliche no tiene saldo, el marketplace no puede hacer el reembolso total**: solo devuelve su parte y el resto lo tiene que resolver por otro medio. | Confirma el README. El panel tiene que avisar el saldo del boliche y permitir un "reembolso parcial de nuestra parte". Plazo: 180 días desde la aprobación. Se aceptan reembolsos parciales. |
| 8 | **La fecha de liberación de la comisión del marketplace no se configura por API.** Para cambiarla hay que hablar con un ejecutivo comercial de "cartera asesorada". | El plazo en que TicketJuy cobra su comisión no está documentado públicamente. Hay que preguntarlo. |
| 9 | Comisiones de Checkout (online) publicadas el 2026-11-17: **al instante 6,29 % + IVA; 10 días 4,39 % + IVA; 18 días 3,39 % + IVA; 35 días 1,49 % + IVA**. Las cuotas tienen un costo aparte. Los costos varían por provincia. | Son la base de la calculadora. Hay que confirmar la tasa real de Jujuy y si el split cambia algo. |
| 10 | Webhooks: tópicos `payment`, `topic_merchant_order_wh`, `mp-connect`, `topic_chargebacks_wh`, `topic_claims_integration_wh` y `stop_delivery_op_wh`. Firma `x-signature` con HMAC-SHA256 sobre `id:{data.id};request-id:{x-request-id};ts:{ts};`. Hay que responder 200/201 en menos de 22 s, y si no, MP reintenta. | Idempotencia por `id` de notificación y por `payment_id`. Siempre hay que consultar `GET /v1/payments/{id}` con el token del vendedor antes de emitir entradas. |

---

## 1. Requisitos, aplicación de marketplace y OAuth

### 1.1 Requisitos previos

Según [Requisitos previos – Split de Pagos 1:1](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites):

- **Cuenta:** "necesitas una cuenta de vendedor en Mercado Pago con un nivel de identificación KYC 6".
- **App móvil:** "Es necesario contar con la aplicación Mercado Pago para gestionar los cobros realizados."
- **OAuth:** "Los revendedores en el Marketplace deben pasar por el proceso de autorización OAuth".
- **Productos:** "El Marketplace está disponible para integrarse con Mercado Pago utilizando el Checkout Pro y el Checkout API (modelo 1:1)."
- **Modelo 1:N:** "El modelo 1:N está disponible únicamente para vendedores de cartera asesorada que estén en contacto con el equipo comercial de Mercado Pago."
- **Liberación de la comisión:** "si es necesario realizar configuraciones sobre la fecha de liberación de la comisión (marketplace fee o application fee), contacta a tu ejecutivo comercial de cartera asesorada."

Según [Crear configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration), "la solución de Split de Pagos 1:1 sólo se puede integrar con Checkout Pro, Checkout API y Checkout Bricks, y no está disponible para otros productos". El Split de Pagos 1:1 está disponible en Argentina, entre otros países ([Resumen](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview)).

### 1.2 Crear la aplicación

Según [Crear configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration):

1. En [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app), hacer clic en **Crear aplicación**. El nombre admite hasta 50 caracteres.
2. Elegir la solución **Pagos online** y el producto **Checkout Pro** o **Checkout API**.
3. Elegir el modelo de integración **Marketplace**.
4. En la edición de la app, completar la **Redirect URL** (es el `redirect_uri` de OAuth). "debe contener la URL del sitio del marketplace" a donde se envía el token del vendedor.
5. Durante la creación "es posible que sea necesario reautenticar tu identidad".

### 1.3 Flujo OAuth (Authorization code)

**URL de autorización** ([Crear configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration)):

```
https://auth.mercadopago.com.ar/authorization?client_id=<APP_ID>&response_type=code&platform_id=mp&redirect_uri=<REDIRECT_URI>
```

La guía general de OAuth ([Obtener Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/creation)) usa el host `auth.mercadopago.com` y agrega `state=RANDOM_ID`. Ahí se recomienda:

- `state`: un identificador único por intento, sin datos sensibles, para verificar que la respuesta corresponde a tu pedido.
- `redirect_uri`: "Asegúrate de que el redirect_uri sea una URL estática". Si se necesitan parámetros adicionales, hay que mandarlos en `state`. Si la URL no coincide exactamente con la configurada, la llamada da error.
- El `code` vuelve como parámetro en la Redirect URL y "tiene una validez de 10 minutos".

**PKCE** (misma página): es **opcional pero recomendado**. Se habilita en *Detalles de la aplicación → Editar*. Una vez habilitado, MP exige `code_challenge` y el método en la URL de autorización (`code_challenge` y `code_challenge_method=S256` o `Plain`). El `code_verifier` tiene que ser aleatorio, de 43 a 128 caracteres, y se envía en el intercambio del código. ⚠️ La página nombra el campo como `code_method` en un lugar y como `code_challenge_method` en la URL de ejemplo. Conviene usar `code_challenge_method`, que es el nombre del estándar RFC 7636, y verificarlo en sandbox.

**Intercambio del código** (`POST https://api.mercadopago.com/oauth/token`, [referencia](https://www.mercadopago.com.ar/developers/es/reference/authentication/oauth/_oauth_token/post)):

- Body: `client_id`, `client_secret`, `grant_type=authorization_code`, `code`, `redirect_uri`, más `code_verifier` si se usa PKCE, y `test_token=true` para credenciales de prueba ([Obtener Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/creation)).
- La respuesta de ejemplo incluye `access_token`, `public_key`, `refresh_token`, `live_mode`, `user_id`, `token_type: bearer`, `expires_in: 15552000` (180 días) y `scope: "offline_access payments write"` ([Crear configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration)).
- El `user_id` es "igual al collector_id que se utiliza para capturar pagos" (misma página).
- Las buenas prácticas piden mandar siempre los headers `accept` y `content-type`, poner los parámetros en el body y no en la query, y no agregar parámetros de más ([Buenas prácticas](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/best-practices)).

### 1.4 Vigencia y renovación de tokens

- El `access_token` del vendedor es "válido por 180 días (6 meses)" ([Obtener Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/creation)). En [Crear configuración](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration) dice: "Estas credenciales tienen una validez de 6 meses. En caso de no renovarlas antes de ese período, perderán vigencia y será necesario repetir el proceso de vinculación".
- **Renovación** ([Renovar Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/renewal)): `POST /oauth/token` con `grant_type=refresh_token`, `refresh_token`, `client_id` y `client_secret`. Se usa cuando el token está "próximo a caducar". Requisito: que la app devuelva el scope `offline_access`. **"cada vez que renueves el access_token, también se renovará el refresh_token, por lo que necesitarás almacenarlo nuevamente."**
- ⚠️ **No confirmado:** la vida útil del `refresh_token` no aparece en ninguna página. Tampoco queda claro si se puede renovar indefinidamente o si a los 180 días hay que volver a autorizar igual. La página de renovación dice que el nuevo token dura 180 días, "después de lo cual se debe reconfigurar todo el flujo de autorización", y esa frase admite las dos lecturas.
- **Invalidación** ([Gestionar Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/management)): el token se invalida por expiración, por cambio de contraseña del vendedor, por revocación de la autorización, por limpieza de credenciales por fraude, por limpieza de sesión o por eliminación de la app. "Puedes recibir notificaciones Webhook cada vez que un vendedor autoriza o desautoriza tu aplicación" (tópico `mp-connect`, ver sección 6).
- El flujo *client credentials* (token de la propia app) dura 6 horas y no sirve para actuar en nombre del vendedor ([Obtener Access Token](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/creation)).

### 1.5 Qué token se usa para crear pagos o preferencias

[Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace) indica seguir el flujo habitual del checkout "utilizando necesariamente el token de acceso para cada vendedor que fue obtenido a través de OAuth", y agrega: "usa la `public_key` de tu cuenta de integrador en el frontend e inserta el `access_token` del vendedor (obtenido en el paso 1) en el backend o en el header de la solicitud."

La referencia de `POST /v1/payments` tiene un error que lo confirma: 2059 *"You cannot use application_fee with this payment"*, que "ocurre porque el Access Token en uso no fue obtenido mediante OAuth" ([Crear pago – referencia](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api-payments/create-payment/post)).

---

## 2. Medios de pago soportados por el split

**Lo que dice la doc del split** ([Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)):

> "Ten en cuenta que la solución Split de Pagos 1:1 sólo permite realizar pagos con dinero en cuenta entre cuentas de Mercado Pago. No se permiten transferencias de instituciones financieras externas."

La versión en inglés de la misma página dice: "allows for payments using available balance between Mercado Pago accounts. Transfers from external financial institutions are not permitted." ([EN](https://www.mercadopago.com.ar/developers/en/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)).

**Cómo interpretarlo:**

- La frase se puede leer de dos maneras: (a) el comprador solo puede pagar con dinero en cuenta, o (b) el reparto ocurre entre cuentas de MP y no se aceptan pagos por transferencia desde bancos externos. La propia doc muestra un ejemplo de Checkout API con `"payment_method_id": "master"`, o sea tarjeta, en el split (misma página). Eso sugiere la lectura (b). **⚠️ No confirmado** qué medios exactos están habilitados con split.
- **Transferencias bancarias externas: no permitidas.** Esto sí es explícito.
- **Cuotas sin tarjeta (Mercado Crédito): no disponibles en marketplace.** [Cuenta de Mercado Pago y Cuotas sin Tarjeta – Bricks](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/payment-brick/payment-submission/wallet-credits) dice: "En el flujo de marketplace no es posible habilitar pagos a plazos sin tarjeta de crédito." Lo dice para Bricks. ⚠️ No confirmado si aplica igual a Checkout Pro, aunque es muy probable.

**Medios de Checkout Pro en general**, sin split:

- La página comercial dice: "Checkout Pro: Tus clientes pueden pagar con tarjetas de crédito y débito, efectivo, dinero disponible en Mercado Pago y cuotas sin tarjeta a través de Mercado Crédito" ([Checkout para sitio web](https://www.mercadopago.com.ar/herramientas-para-vender/check-out)).
- La doc de Checkout Pro lista "Credit or debit card, Rapipago, Pago Fácil, Mercado Pago Account and Installments without Card" ([Checkout Pro – overview](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/overview)).
- "De forma predeterminada, todos los medios de pago están disponibles en el Checkout Pro". Se pueden excluir tipos con `excluded_payment_types` (ej. `ticket`, que es el efectivo) y marcas con `excluded_payment_methods`. **"El medio de pago Dinero en cuenta no puede ser excluido."** El listado disponible se obtiene con `GET /v1/payment_methods` ([Excluir medios de pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/payment-methods)).

**Estado por medio de pago, con split:**

| Medio | Estado con split |
|---|---|
| Dinero en cuenta MP | ✅ Permitido (explícito) |
| Tarjeta de crédito | ⚠️ No confirmado explícitamente. El ejemplo oficial de split usa `master`. |
| Tarjeta de débito | ⚠️ No confirmado |
| Efectivo (Rapipago / Pago Fácil, `ticket`) | ⚠️ No confirmado. Para entradas conviene excluirlo igual, porque el pago queda pendiente. |
| Cuotas sin tarjeta (Mercado Crédito) | ❌ No disponible en marketplace (según la doc de Bricks) |
| Transferencia desde banco externo | ❌ No permitida |

**Recomendación:** hacer una compra de prueba en sandbox con cada medio, con split activo, y revisar `payment_type_id`, `marketplace_fee` y `fee_details` del pago resultante.

---

## 3. `marketplace_fee` (Checkout Pro) y `application_fee` (Checkout API / Bricks)

### 3.1 Monto fijo, no porcentaje

- **Checkout Pro:** "completa el parámetro `marketplace_fee` con el monto que se cobrará por cada preferencia de pago creada en la API /checkout/preferences". El ejemplo usa `"marketplace_fee": 10` ([Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)).
- **Checkout API:** "completa el parámetro `application_fee` con el monto que se cobrará por cada pago creado en la API /payments" (misma página).
- **Bricks:** "complete el parámetro marketplace_fee con un valor en moneda local (su valor predeterminado es 0)". Se crea la preferencia y se inicializa el Brick con `marketplace: true` ([Bricks – marketplace](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/payment-brick/payment-submission/wallet-credits)).
- La doc titula el paso "Para determinar el porcentaje de comisión del marketplace", pero el valor que se manda es un **monto**, no un porcentaje.
- La referencia de `POST /v1/payments` describe `application_fee` (tipo `number`) como "Comisión (fee) que los terceros (integradores) cobran a sus clientes, en este caso vendedores, por utilizar la plataforma del marketplace y otros servicios. Este es un valor en reales que será definido por el integrador". Lo de "en reales" es un resto del texto de Brasil; en Argentina es en pesos según la doc de Bricks ("moneda local") ([Crear pago – referencia](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api-payments/create-payment/post)).

### 3.2 Validaciones

- Preferencias: error `invalid_marketplace_fee`, *"marketplace_fee must not be greater than total amount."* ([Crear preferencia – referencia](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post)).
- Pagos: error 4038, *"Application_fee cannot be bigger than transaction_amount"*. Error 4039, *"Application_fee cannot be a negative value"*. Error 2059, `application_fee` sin un token OAuth ([Crear pago – referencia](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api-payments/create-payment/post)).
- ⚠️ **No confirmado:** cantidad de decimales admitida, monto mínimo, y si la fee se valida contra el neto del vendedor después de la comisión de MP. Puede pasar que el total menos la comisión de MP quede por debajo de la fee.

### 3.3 Orden de descuentos y quién paga a MP

"La comisión de Mercado Pago se descuenta de los fondos recibidos por el vendedor. Es decir, primero se descuenta la comisión de Mercado Pago, y la comisión del marketplace se descuenta del saldo restante." ([Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)).

### 3.4 Cuándo se acredita la fee y si tiene plazo de liberación

- Única referencia oficial: "si es necesario realizar configuraciones sobre la fecha de liberación de la comisión (marketplace fee o application fee), contacta a tu ejecutivo comercial de cartera asesorada" ([Requisitos previos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites)).
- ⚠️ **No confirmado:** el plazo por defecto en que la `marketplace_fee` se libera en la cuenta de TicketJuy. No se sabe si sigue el mismo plazo que eligió el vendedor (instante / 10 / 18 / 35 días) o uno propio. Tampoco si MP cobra alguna comisión sobre la fee recibida.

---

## 4. Reembolsos y contracargos

### 4.1 Reparto del reembolso en el split

[Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace) dice:

> "En caso de reembolso, el valor adeudado al cliente final será dividido y restado de la cuenta del vendedor y de la cuenta del Marketplace, de forma proporcional para las partes involucradas. Además, en modelos 1:1, el Marketplace no podrá realizar el reembolso total si el vendedor no tuviera dinero en la cuenta. En ese caso, corresponde a la cuenta del Marketplace reembolsar el equivalente a su parte y decidir si devolverá el restante, que es responsabilidad del vendedor, por otro medio."

En concreto:

- **La `marketplace_fee` se devuelve de forma proporcional.** En un reembolso total, TicketJuy devuelve su comisión completa.
- **Si el boliche no tiene saldo,** no se puede hacer el reembolso total. TicketJuy solo puede devolver su parte.
- ⚠️ **No confirmado:** si MP devuelve su propia comisión de procesamiento al vendedor cuando hay un reembolso. Tampoco qué significa exactamente "proporcional": si es sobre el bruto o sobre los netos de cada parte.

### 4.2 Reglas generales de reembolso (Checkout Pro)

Según [Configurar reembolsos y cancelaciones](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/refunds-and-cancellations):

- Endpoint: `POST /v1/payments/{id}/refunds`. Con **body vacío** es un reembolso total. Con `amount` en el body es **parcial**.
- **Plazo:** "Los reembolsos pueden realizarse dentro de los 180 días posteriores a la aprobación del pago."
- **Saldo:** "Es necesario tener saldo suficiente disponible en tu cuenta para realizar el reembolso; de lo contrario, la transacción será rechazada."
- Tarjeta de crédito: el dinero vuelve en el resumen. Otros medios: vuelve a la cuenta del pagador.
- Una compra pagada con dos medios genera varios `payment_id`, y cada uno se reembolsa por separado.
- **Cancelación** (distinta del reembolso): solo para pagos `pending` o `in_process`. Los pagos sin confirmar vencen a los 30 días.
- Errores relevantes de la referencia ([Crear reembolso](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-refund/post)): 2024 / 15016 *Payment-too-old-to-be-refunded*; 3024 *Partial refund unsupported for this transaction*; 4292 *Header-X-Idempotency-Key-can't-be-null* (el header de idempotencia es obligatorio).
- ⚠️ **No confirmado:** cuántos reembolsos parciales se pueden hacer sobre un mismo pago en la API de Preferences/Payments. Qué token se usa para reembolsar en el split; lo lógico es el del vendedor, que es el dueño del pago.

### 4.3 Contracargos

- "Si la solicitud de contracargo se considera válida después de la debida evaluación, el cargo se cancela, los fondos se retiran del vendedor y se devuelven al cliente." Y además: "Durante el período de resolución del contracargo, el monto en disputa permanece retenido en la cuenta del vendedor" ([Contracargos – introducción](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/chargebacks/introduction)).
- Notificación: tópico `topic_chargebacks_wh`. Gestión: `GET /v1/chargebacks/{id}` o `/v1/chargebacks/search?payment_id=` con header `X-Caller-Id` (ID del vendedor), y carga de documentación de respaldo ([Gestionar contracargos](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/chargebacks/manage)).
- ⚠️ **No confirmado:** si en el split el contracargo también le descuenta la `marketplace_fee` a TicketJuy de forma proporcional, igual que en el reembolso. Tampoco quién sube la documentación (TicketJuy con el token del boliche, o el boliche).

---

## 5. Comisiones de Mercado Pago Argentina (ventas online)

### 5.1 Checkout para sitio web (Checkout Pro / Transparente)

Copiado de [Checkout para sitio web](https://www.mercadopago.com.ar/herramientas-para-vender/check-out), sección "Tasas que se adaptan a tu negocio", consultado el **2026-11-17**:

| Plazo de liberación | Tasa publicada |
|---|---|
| Al instante | **6,29% +IVA** |
| En 10 días | **4,39% +IVA** |
| En 18 días | **3,39% +IVA** |
| En 35 días | **1,49% +IVA** |

- Plazos: "Vos elegís cuándo recibir el dinero de tus ventas: al instante, en 10, 18 o 35 días corridos. Cuanto antes lo recibas, mayor será el costo de procesamiento." (misma página).
- "Los costos varían según la provincia donde esté registrado tu domicilio y el plazo que definas para recibir tu dinero." (misma página).
- **Se suma IVA:** la página escribe "+IVA" en cada tasa.
- La página no muestra una tasa distinta por medio de pago ni tiene fecha de vigencia.

### 5.2 Link de pago (misma tabla, más el costo de cuotas)

[Link de pago](https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago), consultado el 2026-11-17, muestra las mismas tasas (Al instante 6,29 %; 10 días 4,39 %; 18 días 3,39 %; 35 días 1,49 %, sin la leyenda "+IVA" en esa tabla) y agrega:

- "Costos por ofrecer cuotas": 2x 7,79 %; 3x 10,49 %; 6x 18,69 %; 9x 26,49 %; 12x 32,29 %; 18x 41,59 %.
- "El costo por ofrecer cuotas se sumará al porcentaje que pagás por tus cobros."
- "Estos costos no incluyen retenciones o impuestos ajenos a Mercado Pago."
- "Los costos pueden variar de acuerdo a los impuestos provinciales."
- ⚠️ No está confirmado si esta tabla de cuotas aplica igual a Checkout Pro, aunque es la misma familia de producto.

### 5.3 Quién paga la comisión de MP en el split

**El vendedor (el boliche).** "La comisión de Mercado Pago se descuenta de los fondos recibidos por el vendedor" ([Integrar el checkout en Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace)).

### 5.4 Pendientes de esta sección

- ⚠️ **No confirmado:** la tasa exacta para una cuenta con domicilio en **Jujuy**. El cuadro oficial completo por provincia y medio de pago está en [Comisiones y cargos](https://www.mercadopago.com.ar/ayuda/26748) y en la sección de costos de la cuenta (`/costs-section`), que no se pudieron leer de forma automática. Hay que revisarlo logueado con la cuenta del boliche.
- ⚠️ **No confirmado:** si el plazo de liberación del vendedor se elige en la cuenta del boliche y aplica igual a las ventas que entran por el split. Tampoco si el marketplace puede elegirlo por pago.
- ⚠️ **No confirmado:** si la comisión de MP se calcula sobre el total de la transacción (incluida la `marketplace_fee`). Por el orden de descuento documentado parece que sí, pero no está escrito.

**Ejemplo ilustrativo** (supuestos: entrada de $10.000, plazo de 10 días, IVA 21 %, `marketplace_fee` de $800, y la comisión de MP calculada sobre el total). MP cobra 4,39 % × 1,21 ≈ 5,31 % → ≈ $531. TicketJuy recibe $800. El boliche recibe ≈ $8.669, antes de retenciones e impuestos provinciales. Los supuestos tienen que confirmarse antes de usar esto en la calculadora.

---

## 6. Webhooks y notificaciones en el modelo marketplace

### 6.1 Tópicos relevantes

Según [Webhooks – Split de Pagos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks) y [Notificaciones opcionales](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/optional-notifications):

| Evento | Nombre en Tus integraciones | Tópico |
|---|---|---|
| Creación y actualización de pagos (Checkout Pro, Bricks, Checkout API legacy) | Pagos | `payment` |
| Órdenes comerciales (Checkout Pro) | Órdenes comerciales | `topic_merchant_order_wh` |
| Vinculación y desvinculación OAuth | Vinculación de aplicaciones | `mp-connect` (`action`: `application.authorized` / `application.deauthorized`) |
| Contracargos (apertura, cambios de estado, liberación de fondos) | Contracargos | `topic_chargebacks_wh` |
| Reclamos y reembolsos iniciados por el comprador | Reclamos | `topic_claims_integration_wh` |
| Alertas de fraude ("debes cancelar la orden sin entregarla") | Alertas de fraude | `stop_delivery_op_wh` |
| Pagos vía Orders API | Order (Mercado Pago) | `orders` |

### 6.2 Quién recibe las notificaciones

- Las notificaciones se configuran **por aplicación** en Tus integraciones ([Webhooks – Split](https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks)). La configuración "en la creación de preferencias" con `notification_url` se presenta como "ideal para integraciones como plataformas de pago para múltiples vendedores", y "Las URLs configuradas durante la creación de un pago tendrán prioridad" sobre las del panel ([Configurar notificaciones de pagos](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications)).
- Para identificar a varios vendedores, MP sugiere agregar `?cliente=(sellersname)` a la URL. El body trae `user_id` ("identificador del vendedor") y, en algunos tópicos, `application_id` ([Webhooks – Split](https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks); [Notificaciones opcionales](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/optional-notifications)).
- ⚠️ **No confirmado de forma explícita:** que los pagos creados con el token OAuth del boliche disparen los webhooks configurados en la **app de TicketJuy** y no en una app del boliche. Es lo esperable, porque la app que genera el pago es la del marketplace, pero ninguna página lo dice. **Recomendación:** mandar siempre `notification_url` en cada preferencia, apuntando a TicketJuy y con el id del venue, y además configurar el panel para tener la firma secreta. Ver el punto siguiente.
- ⚠️ **No confirmado:** si las notificaciones que llegan por `notification_url` (configurada en la preferencia) incluyen `x-signature`. La doc describe la firma como parte de la "configuración a través de Tus integraciones".

### 6.3 Validación de la firma `x-signature`

Según [Configurar notificaciones de pagos – Sin SDK](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications) y [Webhooks – Split](https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks):

1. Separar el header `x-signature` (formato `ts=...,v1=...`) por `,`. `ts` es el timestamp en milisegundos y `v1` es la firma.
2. Armar el manifest: `id:{data.id};request-id:{x-request-id};ts:{ts};`. `data.id` sale de la query string y **se pasa a minúsculas si es alfanumérico**. Si falta `data.id` o `x-request-id`, se quita ese par del manifest.
3. Calcular `HMAC-SHA256(clave_secreta, manifest)` en hexadecimal. La clave secreta está en *Tus integraciones → Webhooks → Configurar notificaciones*. "no tiene plazo de caducidad", y renovarla es opcional pero recomendable.
4. Comparar con `v1` en tiempo constante. Si coincide, responder 200; si no, 401. También se puede usar `ts` para definir una tolerancia de demora.
5. Los SDKs oficiales traen `WebhookSignatureValidator`.

### 6.4 Respuesta, reintentos e idempotencia

- Hay que devolver "`HTTP STATUS 200 (OK)` o `201 (CREATED)`". El tiempo de espera es de **22 segundos**. Si no hay respuesta, MP reintenta cada 15 minutos y después espacia los envíos (0, 15 min, 30 min, 6 h, 48 h, 96 h, 96 h, 96 h) ([Configurar notificaciones de pagos](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications)).
- Después de responder, se consulta `GET /v1/payments/{id}` para obtener el estado real (misma página). En el split hay que consultar con el **token del vendedor**, que es el dueño del pago (⚠️ esto se deduce, no está escrito).
- "Los pagos de prueba, creados con credenciales de prueba, no enviarán notificaciones." Para probar hay que usar el simulador del panel (misma página).
- Una compra puede generar más de un `payment_id`. Hay que usar `merchant_order` para conciliar antes de entregar (misma página).
- **Idempotencia:** el campo `id` de la notificación es el "identificador único de la notificación. Úsalo para el control de idempotencia" ([Notificaciones opcionales](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/optional-notifications)). En la creación de pagos y reembolsos, el header `X-Idempotency-Key` es **obligatorio** y "permite repetir solicitudes de manera segura, sin el riesgo de realizar la misma acción más de una vez por error" ([Crear pago – referencia](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api-payments/create-payment/post)).
- Recomendación para TicketJuy (diseño propio, no viene de la doc de MP): (1) guardar cada `id` de notificación con una restricción única; (2) responder 200 rápido y procesar en una cola; (3) emitir las entradas solo cuando `GET /v1/payments/{id}` devuelva `status=approved`, con una transición de estado idempotente por `payment_id` (una orden se aprueba una sola vez); (4) usar `external_reference` = id de `Order` para correlacionar.

---

## Puntos no confirmados (consolidado)

1. ⚠️ Qué medios de pago acepta realmente el split en Checkout Pro: crédito, débito, Rapipago/Pago Fácil. La doc dice "sólo ... dinero en cuenta entre cuentas de Mercado Pago" y a la vez muestra un ejemplo con tarjeta.
2. ⚠️ Si la restricción de "cuotas sin tarjeta" en marketplace (documentada para Bricks) aplica también a Checkout Pro.
3. ⚠️ El plazo de liberación por defecto de la `marketplace_fee` y si sigue el plazo elegido por el vendedor.
4. ⚠️ Si MP cobra alguna comisión sobre la `marketplace_fee` que recibe TicketJuy, y sobre qué base calcula su comisión al vendedor.
5. ⚠️ La vida útil del `refresh_token` y si la renovación es indefinida o hay que volver a autorizar a los 180 días.
6. ⚠️ En un reembolso: si MP devuelve su comisión, cómo se calcula exactamente la proporción, y cuántos reembolsos parciales se permiten.
7. ⚠️ En un contracargo: si también se descuenta la `marketplace_fee` a TicketJuy.
8. ⚠️ Que los webhooks de pagos creados con el token del boliche lleguen a la app de TicketJuy, y si `notification_url` trae `x-signature`.
9. ⚠️ La tasa vigente para un domicilio en Jujuy (el cuadro por provincia no se pudo leer).
10. ⚠️ Si la tabla de cuotas publicada para Link de pago aplica a Checkout Pro.
11. ⚠️ Decimales y monto mínimo de `marketplace_fee`, y validación contra el neto del vendedor.
12. ⚠️ El nombre exacto del parámetro PKCE (`code_method` vs `code_challenge_method`).

## Preguntas para soporte o el ejecutivo comercial de Mercado Pago

1. En Split de Pagos 1:1 con Checkout Pro en Argentina, ¿qué `payment_type_id` están habilitados? (`credit_card`, `debit_card`, `account_money`, `ticket`, `bank_transfer`) ¿Qué significa exactamente "sólo permite realizar pagos con dinero en cuenta entre cuentas de Mercado Pago"?
2. ¿Las cuotas sin tarjeta (Mercado Crédito) están deshabilitadas también en Checkout Pro marketplace? ¿Y las cuotas con tarjeta tienen alguna restricción?
3. ¿En qué plazo se libera la `marketplace_fee` en la cuenta del marketplace? ¿Sigue el plazo que eligió el vendedor? ¿Qué se necesita para pasar a "cartera asesorada" y poder configurarlo?
4. ¿La comisión de MP al vendedor se calcula sobre el total cobrado, incluida la `marketplace_fee`? ¿MP cobra algo al marketplace sobre la fee recibida? ¿Se emite factura o comprobante de IVA por cada parte?
5. ¿Cuál es la vigencia del `refresh_token`? ¿Se puede renovar indefinidamente sin que el vendedor vuelva a autorizar?
6. En un reembolso total o parcial con split, ¿cómo se calcula la proporción? ¿MP devuelve su comisión? ¿Cuántos reembolsos parciales se admiten por pago? ¿Con qué token se ejecuta el reembolso?
7. En un contracargo con split, ¿se debita la `marketplace_fee` proporcional al marketplace? ¿Quién debe presentar la documentación?
8. ¿Los webhooks de los pagos creados con el token OAuth del vendedor llegan a la URL configurada en la app del marketplace? ¿Las notificaciones por `notification_url` incluyen `x-signature`?
9. ¿Cuál es la tasa vigente para un vendedor con domicilio en Jujuy, por plazo y medio de pago, y qué impuestos provinciales (Ingresos Brutos) se retienen?
10. ¿Hay montos mínimos o máximos para `marketplace_fee`? ¿Cuántos decimales admite? ¿Se valida contra el neto del vendedor?

---

## Fuentes consultadas (2026-11-17)

- Split 1:1 – Resumen: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview
- Split 1:1 – Requisitos previos: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites
- Split 1:1 – Crear configuración: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration
- Split 1:1 – Integrar el checkout: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace
- Split 1:1 – OAuth (obtener, renovar, gestionar, buenas prácticas): https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/security/oauth/creation · .../renewal · .../management · .../best-practices
- Split – Webhooks: https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks
- Split – Campos del reporte de ventas: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/additional-content/reports/sales-report/report-fields
- Checkout Pro – Notificaciones de pagos: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications
- Checkout Pro – Notificaciones opcionales: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/optional-notifications
- Checkout Pro – Reembolsos y cancelaciones: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/refunds-and-cancellations
- Checkout Pro – Excluir medios de pago: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/payment-methods
- Checkout Pro – Contracargos: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/chargebacks/introduction · .../chargebacks/manage
- Checkout Pro – Overview: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/overview
- Checkout Bricks – Marketplace / Cuotas sin tarjeta: https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/payment-brick/payment-submission/wallet-credits
- Referencia – Crear preferencia: https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post
- Referencia – Crear pago: https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api-payments/create-payment/post
- Referencia – Crear reembolso: https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-refund/post
- Referencia – OAuth token: https://www.mercadopago.com.ar/developers/es/reference/authentication/oauth/_oauth_token/post
- Costos – Checkout para sitio web: https://www.mercadopago.com.ar/herramientas-para-vender/check-out
- Costos – Link de pago: https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago
- No legibles de forma automática (hay que revisarlas a mano): https://www.mercadopago.com.ar/ayuda/26748 · https://www.mercadopago.com.ar/costs-section
