# Rampas web3 (anchors de Stellar y Ripio wARS): investigación para TicketJuy

> **Fecha de consulta:** 2026-11-17. Las fuentes son: el directorio oficial de anchors de Stellar (`anchors.stellar.org`), los `stellar.toml` y endpoints SEP publicados por cada anchor, la API pública de Horizon de la Stellar Development Foundation (`horizon.stellar.org`) para la actividad on-chain, la documentación oficial de Ripio B2B (`docs.ripio.com`) y sus términos (`terms.ripio.com`), el registro de PSAV de la CNV (`cnv.gov.ar`), y la normativa publicada en el Boletín Oficial, `argentina.gob.ar/normativa` y `bcra.gob.ar`.
>
> **Cómo leer este documento:** cada afirmación cita su URL. Lo que no está respaldado por una fuente primaria se marca con **⚠️ No confirmado**. Cuando lo único que hay es una fuente secundaria (estudio jurídico, blog), se dice explícitamente. Las preguntas para cada proveedor están al final.
>
> **Contexto del diseño evaluado:** el comprador transfiere pesos desde Mercado Pago o su banco a un CVU del boliche en una rampa; la rampa lo convierte en pesos tokenizados (wARS de Ripio o un ARS en Stellar); un pago atómico o un contrato reparte 90 % boliche / 10 % TicketJuy; el boliche (KYB una sola vez, billetera con passkey, sin custodia de TicketJuy) retira a pesos. Regla del proyecto: "la plata no pasa por nosotros".
>
> **Nota de método:**
> - `anchors.stellar.org` se arma con JavaScript. Leído con un lector automático muestra "No ramp assets available for this location", pero el HTML trae los datos del directorio embebidos y de ahí se extrajeron las fichas de Argentina.
> - La actividad de los activos se leyó directo de Horizon (la API oficial de la red). Los links a `stellar.expert` son el mismo dato en un explorador, para mirarlo a mano.
> - `home.anclap.com` (el sitio comercial de Anclap) sirve un **certificado TLS vencido el 14/11/2026** (`notAfter=Nov 14 23:59:59 2026 GMT`), así que no se leyó. La API de Anclap (`api.anclap.com`) sí responde con certificado válido.
> - Los endpoints SEP-12 (KYC) de los anchors piden autenticación SEP-10 con una cuenta Stellar. No se pudieron consultar los campos de KYC sin crear una cuenta.
> - Los PDF del BCRA se leyeron extrayendo el texto con `pypdf`.
> - El texto oficial de la **RG CNV 1172/2026** (octubre 2026) no se encontró en el Boletín Oficial. Lo que se dice de ella sale de un estudio jurídico (fuente secundaria).

---

## Resumen para TicketJuy

| # | Hallazgo | Impacto para TicketJuy |
|---|---|---|
| 1 | **Sí hay pesos tokenizados vivos en Stellar.** (a) **Anclap**: asset `ARS`, issuer `GCYE7C77…DARS`, publica SEP-6, SEP-24, SEP-10 y SEP-12. Sus endpoints `/info` responden hoy con depósito y retiro de ARS habilitados. Hubo pagos ARS reales a su cuenta operativa el 6 y el 9/11/2026, y trades en el DEX el mismo 17/11/2026. (b) **Latamex (Settle ARG S.A.)**: asset `ARST`, issuer `GCSAZVWX…3DG`, SEP-6/SEP-24 en `transfer-server.zetl.network`, con depósito y retiro de ARST habilitados y trades el 17/11/2026. | Técnicamente existe un ARS en Stellar con rampa a pesos. Pero ninguno de los dos publica SEP-31, y ninguno está pensado para que **un tercero** (el comprador) deposite en la cuenta de otro (el boliche). Ver #3. |
| 2 | **Anclap muestra señales de abandono:** el sitio comercial tiene el certificado vencido, SEP-31 está comentado en su `stellar.toml`, y **no aparece en el registro de PSAV de la CNV** (ni como "Grupo Anchor S.A." ni como "Anclap"). **Settle ARG S.A.** (Latamex) **sí** está inscripta como PSAV N° 29. Un tercer anchor del directorio, **Chronos Pay (ARSX)**, tiene el dominio de su `stellar.toml` sin DNS. Settle/Vibrant ya no publican un anchor de ARS propio. | Si se elige Stellar, el único candidato serio es **Latamex/Settle**, y no tiene doc pública de integración B2B. Anclap no debería usarse sin confirmar que está inscripto y operativo. |
| 3 | Los SEP-6/SEP-24 están diseñados para que **el titular de la cuenta Stellar autenticada (SEP-10) y con KYC (SEP-12)** deposite. No hay un concepto de "pagador tercero" en esos estándares. SEP-31 sí separa remitente y receptor, pero es entre dos anchors con relación comercial. | Con Stellar, el modelo "el comprador transfiere a un CVU del boliche" dependería de un acuerdo comercial fuera del estándar. ⚠️ No confirmado que Anclap o Latamex lo acepten. |
| 4 | **wARS de Ripio no existe en Stellar.** Está en Ethereum, Base, World Chain, Polygon, BNB, Gnosis, Celo, Arc, HyperEVM y Tempo. | Si se usa wARS, el reparto 90/10 va en un contrato EVM (por ejemplo, en Base o Polygon), no en una transacción atómica de Stellar. |
| 5 | **Ripio Ramps API sí tiene un CVU reutilizable por cliente** (*on-ramp session*). Cada transferencia que entra al CVU crea sola una orden, convierte al precio del momento y manda el cripto a una dirección fija. La sesión no vence. | Es la pieza técnica más cercana a "un CVU del boliche que recibe y convierte solo". |
| 6 | En Ripio, **cada `customer` (dueño del CVU) tiene que tener KYC `COMPLETED`**. La doc **no dice** que el depósito tenga que venir de una cuenta del mismo titular en Argentina (sí lo exige en Brasil para PIX). Los webhooks traen `sender` (**solo el nombre** del titular de la cuenta de origen, "null cuando el proveedor no lo da"). El CBU/CVU de origen (`originAccountIdentifier`) aparece solo en los depósitos rechazados o devueltos. **No traen CUIT.** | Técnicamente, un tercero podría transferir al CVU del boliche sin hacer KYC con Ripio. Pero TicketJuy **no puede atar un depósito a una compra** con certeza: la sesión no lleva referencia ni monto esperado, y solo da el nombre del pagador. |
| 7 | **Los T&C que Ripio aplica a usuarios de plataformas de terceros** (Moonbird SRL, PSAV N° 36, y Digipayments S.A.U. para la cuenta de pago) son para **personas físicas**. Prohíben "utilizar los Servicios en representación o por cuenta de terceros… inclusive, cobrar por los Servicios". La cuenta de pago acepta transferencias "desde cuentas de misma titularidad o de un tercero", pero "los ingresos de fondos deben responder a fines no comerciales". | **El esquema "un boliche cobra a sus clientes en un CVU de Ripio" no entra en los T&C públicos.** Hace falta un acuerdo comercial con Ripio para un cliente `BUSINESS`. Los campos de KYB no están documentados. |
| 8 | **Normativa sobre depósitos de terceros a un PSAV:** no se encontró ninguna norma de la CNV, la UIF ni el BCRA que **obligue** a que el depósito venga de una cuenta del mismo titular. La UIF (Res. 49/2024, art. 34) lista "situaciones en las cuales se utilice una cuenta para depositar fondos de terceros" como **señal de alerta a monitorear**, no como prohibición. | Está permitido, pero el PSAV tiene que monitorearlo. Un CVU que recibe cientos de transferencias de terceros por noche es justamente el patrón que la UIF manda vigilar. Por eso Ripio y los anchors lo limitan por contrato. |
| 9 | **Rol de TicketJuy:** la ley define como PSAV a quien, "como negocio", hace "transferencia de activos virtuales" o "custodia y/o administración" "para o en nombre de otra persona". La RG CNV 1058/2025 excluye a quien recibe activos virtuales como pago de sus servicios y a quien provee "exclusivamente" billeteras de autocustodia. Los protocolos descentralizados solo quedan excluidos si "no existe un proveedor de servicios identificable". | Un contrato de reparto operado por TicketJuy (identificable) **podría** verse como "transferencia para otro". ⚠️ Necesita dictamen legal antes de construir. |
| 10 | **BCRA:** el pago con transferencia (PCT/QR) sigue con un precio al comercio de **0,6 % a 0,8 %** (texto ordenado al 08/09/2026). Los PSPCP (billeteras como Mercado Pago) "no podrán realizar ni facilitar" operaciones con activos digitales "que no se encuentren autorizados por una autoridad reguladora nacional competente ni por el BCRA" (TO PSP, vigencia 01/11/2026). La prohibición equivalente para bancos (Com. "A" 7506) seguía citada en enero de 2026. | Una transferencia común (push) a un CVU no es PCT, así que no paga ese precio. ⚠️ No está claro cómo aplica la prohibición a un PSPCP cuyo cliente transfiere a un CVU que termina en una compra de cripto. Es un riesgo de bloqueo por parte de MP o los bancos. |

### Recomendación

**No avanzar todavía con el diseño "comprador → CVU del boliche en una rampa → token → reparto". Para el MVP, seguir con Mercado Pago Split 1:1 ([mercado-pago-split.md](./mercado-pago-split.md)). Tratar la rampa web3 como una exploración de fase 2, condicionada a dos respuestas: una comercial de Ripio y una legal.**

- **Por qué no ahora:**
  1. Los T&C públicos de Ripio prohíben justamente el uso comercial por cuenta de terceros, y el cliente `BUSINESS` no tiene KYB documentado.
  2. La *on-ramp session* no permite conciliar un depósito con una entrada específica: no hay referencia ni monto esperado, solo el nombre del pagador.
  3. En Stellar, el anchor más visible (Anclap) no figura en el registro de PSAV y su sitio está caído. Latamex no tiene doc B2B pública.
  4. El rol de TicketJuy como operador del contrato de reparto podría encuadrar como PSAV, lo que rompe la regla "la plata no pasa por nosotros".
- **Si se quiere seguir explorando:** pedirle a Ripio (b2b@ripio.com) una reunión con las preguntas del final. La clave es si ofrecen un producto de **cobro para comercios** (cliente `BUSINESS`, una orden por compra con monto fijo, o un CVU/alias por orden con `externalRef`) que acepte pagos de terceros sin KYC del pagador. Si existe, la alternativa más simple **no necesita contrato de reparto**: crear una orden por entrada y que Ripio entregue wARS directo a dos direcciones (o a la del boliche, con TicketJuy facturando aparte). Antes de escribir código, pedir dictamen legal sobre el punto 9.

---

## 1. Anchors de Stellar con pesos argentinos (2026-11-17)

### 1.1 Qué dice el directorio oficial

El directorio oficial ([anchors.stellar.org](https://anchors.stellar.org/), al que redirige [stellar.org/anchors](https://stellar.org/anchors)) lista estas fichas con Argentina y un activo en pesos. Los datos se extrajeron del HTML de la página:

| Anchor | País(es) | Activo ARS | SEP declarados en el directorio | Rails | Sitio |
|---|---|---|---|---|---|
| **Anclap** | Argentina, Chile, Colombia, México, Perú | `ARS` (`GCYE7C77…DARS`) + USDC, XLM | SEP-6, SEP-24, SEP-31 | Cash, Card, Bank Transfer, Local Method | https://home.anclap.com/ |
| **Latamex** | Argentina, Brasil | `ARST` (`GCSAZVWX…3DG`) + USDC | SEP-6 | Bank Transfer | https://www.latamex.com/ |
| **Chronos Pay** | Argentina, Ecuador | `ARSX` (`GA6NRRSB…XVF7`) | SEP-6, SEP-24, SEP-31 | — | https://chronospay.io/ |

- El propio SDF aclara que el directorio no es exhaustivo y recomienda revisar exploradores como stellar.expert ([blog SDF – Anchor Directory guide](https://stellar.org/blog/developers/anchor-directory-guide-finding-interoperable-asset-issuers-on-off-ramps-stellar)). En Horizon, la búsqueda de `asset_code=ARS` devuelve decenas de emisores, casi todos con dominios de spam o tokens sin respaldo ([Horizon – assets ARS](https://horizon.stellar.org/assets?asset_code=ARS&limit=50)). Los únicos con un `stellar.toml` de un anchor real de ARS son Anclap y Latamex.
- **Settle / Vibrant:** `settle.network` no resuelve DNS desde acá. El `stellar.toml` de `vibrantapp.com` solo publica un servidor de federación (`api.vesseoapp.com`) y **ningún activo ni servidor SEP** ([vibrantapp.com/.well-known/stellar.toml](https://vibrantapp.com/.well-known/stellar.toml)). La sociedad **Settle ARG S.A.** es la que aparece inscripta como PSAV con el sitio `latamex.com.ar` (ver 1.3). O sea, hoy el ARS de "Settle" en Stellar es el **ARST de Latamex**.
- **Chronos Pay:** el `stellar.toml` que Horizon asocia al issuer de ARSX es `https://api.chronospay.io/.well-known/stellar.toml` ([Horizon – ARSX](https://horizon.stellar.org/assets?asset_code=ARSX&asset_issuer=GA6NRRSBXCKZSCG56ODM5B6S5GUBLUEQSII4GUVQ7DFPEDJUGES7XVF7)), pero el dominio **no resuelve DNS** ("Could not resolve host: api.chronospay.io"). Tiene 47 trustlines. **Se descarta.**

### 1.2 Anclap (Grupo Anchor S.A.)

**`stellar.toml`** ([anclap.com/.well-known/stellar.toml](https://anclap.com/.well-known/stellar.toml), idéntico a [api.anclap.com/.well-known/stellar.toml](https://api.anclap.com/.well-known/stellar.toml)):
- `ORG_NAME = "Grupo Anchor S.A."`, `ORG_DBA = "Anclap"`.
- `TRANSFER_SERVER = "https://api.anclap.com/transfer6"` (SEP-6), `TRANSFER_SERVER_SEP0024 = "https://api.anclap.com/transfer24"`, `WEB_AUTH_ENDPOINT = "https://api.anclap.com/auth"` (SEP-10), `KYC_SERVER = "https://api.anclap.com/kycserver12"` (SEP-12).
- **SEP-31 está comentado:** `#DIRECT_PAYMENT_SERVER = "https://api.anclap.com/transfer31"`. Y `https://api.anclap.com/transfer31/info` no responde. El directorio dice SEP-31, pero el toml (que es la fuente que manda) no lo publica.
- Activo: `code="ARS"`, `issuer="GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS"`, `name="Peso Digital"`, `anchor_asset="ARS"`, `status="live"`, y `redemption_instructions="Enhanced KYC verification through anclap is required to redeem this asset."`.

**Endpoints vivos (consultados el 2026-11-17):**
- SEP-24 [`/transfer24/info`](https://api.anclap.com/transfer24/info): ARS con depósito `enabled: true`, `min_amount: 11`, `max_amount: 500000`, `fee_fixed: 10`, `fee_percent: 1`, y retiro `enabled: true`, `max_amount: 500000`, `fee_fixed: 10`, `fee_percent: 2`. `authentication_required: true` en ambos.
- SEP-6 [`/transfer6/info`](https://api.anclap.com/transfer6/info): depósito ARS `type` = `bank_account`, `min 20`, `max 150000`. Retiro a `bank_account` (`dest`: "Número de CBU o CVU") o `invoiceService` (`dest`: "Código de Barras", pago de facturas).
- SEP-10 (`/auth?account=…`) devuelve un challenge válido para `api.anclap.com`.
- SEP-12 (`/kycserver12/customer`) responde `403 "authentication_required"` sin token. **No se pudieron ver los campos de KYC.** ⚠️ No confirmado qué datos pide (persona humana / jurídica).

**Actividad on-chain (Horizon):**
- Activo `ARS` de Anclap: 38.788 trustlines autorizadas y 41.498.225 ARS en circulación ([Horizon – assets ARS de Anclap](https://horizon.stellar.org/assets?asset_code=ARS&asset_issuer=GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS)). ⚠️ El número de trustlines no indica usuarios reales: muchas pueden ser cuentas viejas o airdrops.
- La cuenta `GARDJZ33…3HOT` (listada en `ACCOUNTS` del toml) recibió pagos en ARS de varias cuentas en noviembre de 2026: por ejemplo 329.163,90 ARS el 06/11, 391.583,34 ARS el 02/11 y 7.359,03 ARS el 09/11 ([Horizon – pagos de GARDJZ…](https://horizon.stellar.org/accounts/GARDJZ33FTTLVKGABXDS22SYNTP4VCLYARIEWKMZKYHX3RRLPMNR3HOT/payments?order=desc&limit=200)). Eso es consistente con retiros (redenciones) reales en curso. ⚠️ Es una inferencia: Horizon no dice qué es cada pago.
- Hubo trades ARS/XLM en el DEX el 17/11/2026 ([Horizon – trades ARS](https://horizon.stellar.org/trades?base_asset_type=credit_alphanum4&base_asset_code=ARS&base_asset_issuer=GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS&counter_asset_type=native&order=desc&limit=3)). Pueden ser bots de arbitraje.
- Explorador: [stellar.expert – ARS (Anclap)](https://stellar.expert/explorer/public/asset/ARS-GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS-1).

**Señales de riesgo:**
- El certificado TLS de `home.anclap.com` venció el 14/11/2026 (ver nota de método).
- **Grupo Anchor S.A. no figura en el registro de PSAV de la CNV.** Se buscó "Anchor" y "Anclap" en el listado descargado del registro oficial ([CNV – Registro PSAV](https://www.cnv.gov.ar/SitioWeb/RegistrosPublicos/Psav), descarga [ListadoRegistrosPsav](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav)). ⚠️ Podría operar a través de otra sociedad inscripta con otro nombre. No confirmado.
- Una app de terceros (Beans) muestra a Anclap como su proveedor de depósitos en ARS ([Beans help – How to deposit ARS](https://beansapp.tawk.help/article/how-to-deposit-ars)). **Fuente secundaria**, sin fecha.

### 1.3 Latamex / Settle (ARST)

**`stellar.toml`** ([pubnet-sep.latamex.com/.well-known/stellar.toml](https://pubnet-sep.latamex.com/.well-known/stellar.toml), que es el `home_domain` que Horizon asocia al issuer):
- `ORG_NAME="Relay Tech Services Ltd"`, `ORG_URL="https://anchors.relay.vision"`, soporte `support@latamex.zendesk.com`.
- `TRANSFER_SERVER` y `TRANSFER_SERVER_SEP0024` = `https://transfer-server.zetl.network`, `WEB_AUTH_ENDPOINT` = `https://transfer-server.zetl.network/auth`.
- **No publica `KYC_SERVER` (SEP-12) ni SEP-31.**
- Activo: `code="ARST"`, `issuer="GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG"`, `anchor_asset="ARS"`, `status="live"`, `attestation_of_reserve="https://anchors.relay.vision/audits/ARST-Audit-No-1.pdf"` (no se leyó).

**Endpoints vivos:**
- [`transfer-server.zetl.network/info`](https://transfer-server.zetl.network/info): `ARST` con depósito `enabled: true`, `min_amount: "5000"`, `max_amount: 250000`, `fee_fixed: 0`, `fee_percent: 0`, y retiro `enabled: true`, `min_amount: "100"`, `max_amount: 250000`. También BRLT, y USDC solo en modo "exchange".
- SEP-10 (`/auth?account=…`) devuelve un challenge para `pubnet-sep.latamex.com`. `/transactions` responde 401 sin token (vivo).

**Actividad on-chain:** ARST tiene 328.651 trustlines y 242.466.373 ARST en circulación ([Horizon – ARST](https://horizon.stellar.org/assets?asset_code=ARST&asset_issuer=GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG)). Hubo trades ARST/XLM el 17/11/2026 ([Horizon – trades ARST](https://horizon.stellar.org/trades?base_asset_type=credit_alphanum4&base_asset_code=ARST&base_asset_issuer=GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG&counter_asset_type=native&order=desc&limit=3)). Explorador: [stellar.expert – ARST](https://stellar.expert/explorer/public/asset/ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG-1). ⚠️ No se identificaron las cuentas de distribución con movimiento reciente de mint/burn: las otras cuentas del toml no mostraron pagos ARST relevantes en sus últimas 100 operaciones.

**Sitio y registro:**
- `https://latamex.com/` redirige a sí mismo en bucle (308). `https://www.latamex.com.ar/` responde y se presenta como "soluciones blockchain para hacer crecer tu negocio en Latinoamérica", sin mencionar ARST, Stellar, API ni T&C ([latamex.com.ar](https://www.latamex.com.ar/)).
- **Settle ARG S.A.** (CUIT 30-71652016-8) figura en el registro de PSAV de la CNV con el **N° 29**, actividad "Intercambio entre activos virtuales y monedas de curso legal" y sitio `https://www.latamex.com.ar/` ([CNV – ListadoRegistrosPsav](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav)).
- ⚠️ No confirmado qué relación hay entre "Relay Tech Services Ltd" (emisor según el toml) y Settle ARG S.A. (PSAV local), ni quién custodia la reserva en pesos.
- ⚠️ No hay documentación pública de integración B2B ni de KYC.

### 1.4 Qué permiten los estándares SEP respecto de un "pagador tercero"

- **SEP-6 y SEP-24** son flujos de depósito y retiro donde el usuario se autentica con su cuenta Stellar (SEP-10) y el anchor le da instrucciones para depositar fiat y recibir el token en esa cuenta ([SEP-6](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md), [SEP-24](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md)). La identificación del cliente va por SEP-12 ([SEP-12](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md)). El estándar no modela que una persona distinta del cliente haga la transferencia bancaria. Eso queda librado a la política de cada anchor. ⚠️ No confirmado qué hacen Anclap o Latamex con un depósito de un tercero.
- **SEP-31** define un "Sending Anchor" (que recibe la plata del remitente) y un "Receiving Anchor" (que paga al receptor), y exige que el Sending Anchor "must have a business relationship with the Receiving Anchor" ([SEP-31](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md)). Es el estándar que separa pagador y beneficiario, pero ninguno de los dos anchors de ARS lo publica hoy.
- **Atomicidad:** en Stellar "Transactions are atomic. Meaning if one operation in a transaction fails, all operations fail" ([Stellar Docs – Operations and transactions](https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions)). Una transacción con dos `payment` (90 % al boliche, 10 % a TicketJuy) es atómica. Pero **alguien tiene que firmarla** con la cuenta que tiene los ARS. Si esa cuenta es del boliche, firma el boliche (con su passkey). Si la firma TicketJuy, TicketJuy está administrando fondos de otro (ver sección 4.3).

---

## 2. Ripio Ramps API y wARS

### 2.1 Qué es wARS y en qué redes está

- "Ripio's wFiat stablecoins are fully collateralized tokens pegged 1:1… Issued and governed by a Ripio subsidiary". wARS: `0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D` ([wFiat overview](https://docs.ripio.com/wfiat/overview.md)).
- Redes: Ethereum, Base, World Chain, Polygon, BNB Smart Chain, Gnosis, Celo, Arc, HyperEVM y Tempo (en Tempo con otra dirección y 6 decimales) ([Contracts](https://docs.ripio.com/wfiat/contracts.md)). **Stellar no está en la lista.**

### 2.2 Argentina: medios de pago y requisitos

- On-ramp en Argentina: **transferencia bancaria a un CVU** ("The user transfers ARS to a CVU generated for the deposit") o **Mercado Pago** ("The user pays through their Mercado Pago wallet"). Off-ramp: transferencia a CBU/CVU/alias. QR payments (Sell and Pay): "API only", habilitado por Ripio ([Argentina](https://docs.ripio.com/ramps-api/overview/countries/argentina.md)).
- Requisitos: el cliente debe tener KYC `COMPLETED` antes de operar, aceptar los T&C, y registrar y validar la cuenta de cobro para el off-ramp (misma página).
- El widget describe el pago con CVU como "A screen with the account details to transfer to, which they pay **from their own bank**" ([Widget – on-ramp](https://docs.ripio.com/ramps-api/widget/flows/on-ramp.md)). Es una descripción del flujo, no una regla explícita.

### 2.3 On-ramp session: el CVU reutilizable

- Hay dos modos: *order* (una compra con cotización fija) y *session*: "A reusable deposit account (e.g. a CVU/CLABE) tied to a destination crypto address… Orders are created **automatically** each time the customer sends fiat to the session's deposit account", "Rate: The market rate at the moment of each deposit" ([On-Ramp integration](https://docs.ripio.com/ramps-api/guides/on-ramp-integration.md)).
- "The customer can send fiat to the session's deposit account as many times as they want… No per-deposit API call is needed." "The session does not expire" (misma página).
- En Argentina la sesión acepta `bank_transfer` (CVU), **no** `mercadopago`. "Each customer can only have one active on-ramp session at a time" ([Create On-Ramp Session](https://docs.ripio.com/ramps-api/on-ramp/create-on-ramp-session.md)).
- Con una *order* (no sesión), la respuesta trae `fiatPaymentInstructions` con `cvu` y opcionalmente `alias` "to enable alias customization, contact the Ripio team" ([Create On-Ramp Order](https://docs.ripio.com/ramps-api/on-ramp/create-on-ramp-order.md)). En Argentina "Not needed — the CVU comes back with the order" ([On-Ramp integration](https://docs.ripio.com/ramps-api/guides/on-ramp-integration.md)). ⚠️ No confirmado si el CVU de una order es distinto por cada orden o es el mismo CVU del cliente. Si es el mismo, no sirve para identificar la compra.

**Implicancia para TicketJuy:** la sesión no lleva un monto esperado ni una referencia. Un depósito de $15.000 del comprador A y otro de $15.000 del comprador B llegan como dos órdenes iguales. Lo único que las distingue es el campo `sender` (nombre del titular de la cuenta de origen), que puede venir `null` (ver 2.5).

### 2.4 Quién es el "customer" y qué KYC se exige

- "In production, every customer must complete identity verification (KYC) before they can operate. A customer's KYC status must be `COMPLETED`" ([KYC overview](https://docs.ripio.com/ramps-api/kyc/overview.md)). Documento + "Advanced liveness check" vía Sumsub. En Argentina se acepta "ID card, residence permit" (misma página).
- `Create Customer` acepta `type: INDIVIDUAL | BUSINESS` ([Create Customer](https://docs.ripio.com/ramps-api/customers/create-customer.md)). Pero los campos de KYC de Argentina son **solo de persona humana**: nombre, DNI, CUIT/CUIL, `registered_tax_payer`, domicilio, `net_income`, `personal_activity` ([KYC fields by country – Argentina](https://docs.ripio.com/ramps-api/kyc/kyc-fields-by-country.md)). **No hay campos de KYB (persona jurídica) en la doc ni en el OpenAPI** ([openapi.json](https://docs.ripio.com/ramps-api/openapi.json)). ⚠️ No confirmado cómo se hace el KYB de un boliche (SRL/SA).
- "Create Deposit Account… The customer must have an approved KYC before calling this endpoint" ([Create Deposit Account](https://docs.ripio.com/ramps-api/customers/create-deposit-account.md)).
- La página de configuración del widget dice que la verificación de identidad es una capacidad que se habilita por cuenta: "Without it, users transact without verifying" ([Partner settings](https://docs.ripio.com/ramps-api/widget/configuration/partner-settings.md)). Esto **contradice** "in production, every customer must complete KYC". ⚠️ No confirmado en qué casos de producción Ripio deshabilita el KYC (posiblemente para partners regulados que hacen su propio KYC, como en Crypto as a Service: [KYC for regulated entities](https://docs.ripio.com/crypto-as-a-service/kyc/kyc-for-regulated-entities.md)).

### 2.5 ¿Puede depositar un tercero? Lo que dice la doc

- **No hay ninguna regla escrita, para Argentina, que exija que el depósito on-ramp venga de una cuenta del mismo titular que el customer.** Se buscó en la doc y en el OpenAPI ("third", "same holder", "holder", "mismatch", "sender", "payer").
- **Contraste con otros países:** para **cuentas de destino** (off-ramp), "Where the provider resolves the account holder, that holder must be the customer themselves: in **Mexico**… and in **Brazil**…". Argentina no aparece en esa frase ([OpenAPI – createFiatAccount](https://docs.ripio.com/ramps-api/openapi.json)). Pero el ciclo de vida de la cuenta fiat habla de validar si "the account exist[s] and belong[s] to the customer" en general ([Fiat account lifecycle](https://docs.ripio.com/ramps-api/fiat-accounts/lifecycle.md)). Para el **on-ramp con PIX** (Brasil): "only the CPF/CNPJ from the customer's approved KYC can pay it" ([Create On-Ramp Order](https://docs.ripio.com/ramps-api/on-ramp/create-on-ramp-order.md)). Para el CVU argentino no hay una frase equivalente.
- **Datos del pagador que trae Ripio** ([On-Ramp Webhook Events](https://docs.ripio.com/ramps-api/webhooks/on-ramp-events.md)):
  - En los eventos estándar (`ON-RAMP.DEPOSIT.RECEIVED`, `TRADE.COMPLETED`, `WITHDRAWAL.*`, `ORDER.CANCELLED`, `ORDER.REFUNDED`): `sender` = "Name of the holder of the originating fiat account (e.g. CVU/CLABE owner)… Null when not provided by the fiat provider". **No** traen CBU/CVU de origen ni CUIT. El `amount` es el monto **en cripto**.
  - En `ON-RAMP.DEPOSIT.REJECTED` / `ON-RAMP.DEPOSIT.REFUNDED` (depósito que "matches no On-Ramp order"): `originAccountIdentifier` ("Identifier of the account from which the deposit originated"), `amount` del depósito y `sender`.
  - Motivos de cancelación posibles: `INVALID_DESTINATION`, `EXPIRED_QUOTE`, `PROVIDER_REJECTED`, `PROVIDER_ERROR`, `REFUND_BY_PROVIDER`, `USER_BANNED`, `AMOUNT_LIMIT_EXCEEDED`, `KYC_NOT_APPROVED`, `TRAVEL_RULE_REQUIRED`, `INTERNAL_ERROR`. No hay uno de "tercero no permitido". ⚠️ No confirmado si un depósito de tercero cae en `PROVIDER_REJECTED`.
- **Devoluciones:** en Argentina el reembolso de un on-ramp va a "The account the customer paid from" (`refundDestinationRequired: false`). Los reembolsos son opt-in por cuenta ([Refunds](https://docs.ripio.com/ramps-api/refunds/overview.md)). Es decir, si se cancela, la plata vuelve **a la cuenta del comprador**, no a la del boliche. Esto juega a favor del diseño, pero la doc lo llama "the customer", asumiendo que quien paga es el cliente.

### 2.6 Los T&C de Ripio sobre terceros

Los T&C que rigen a usuarios que acceden a Ripio "a través de una Plataforma… de titularidad de tercero/s" (o sea, vía un partner como TicketJuy) están en [terms.ripio.com/ar/on-off-ramp](https://terms.ripio.com/ar/on-off-ramp) (última actualización 8/3/2026):

- **Sección A (Moonbird SRL):** "rigen la relación entre Moonbird SRL ('RIPIO') y los usuarios **personas físicas**". "Moonbird SRL es un Proveedor de Servicios de Activos Virtuales ('PSAV') inscripto bajo el N° 36 de fecha 5 de junio de 2024". Lo confirma el registro de la CNV ([ListadoRegistrosPsav](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav)).
- **Prohibición de uso por cuenta de terceros:** el usuario se obliga a no "e) utilizar los Servicios en representación o por cuenta de terceros, o permitir a cualquier persona… utilizar los Servicios asociados a la misma, **inclusive, cobrar por los Servicios**". También: "El Usuario se compromete a no permitir ni autorizar el uso de los Servicios por terceros."
- **Devolución:** Ripio puede devolver los fondos si "(ii) se reciban fondos y/o activos virtuales que no estén asociados a una Orden de Gestión correctamente confirmada", "a la cuenta bancaria, cuenta de pago o dirección de origen".
- **Sección B (Digipayments S.A.U., cuenta de pago con CVU):** "Los Usuarios pueden ingresar dinero en su Cuenta de Pago mediante (i) operaciones de transferencias 'push' (**ya sea desde cuentas de misma titularidad o de un tercero**) a las CVU asignadas". Pero también: "El Usuario reconoce y acepta que **los ingresos de fondos deben responder a fines no comerciales**". Y el usuario "autoriza recibir fondos que oportunamente envíe el propio Usuario u otros usuarios".
- **Lectura para TicketJuy:** el CVU de Ripio **técnicamente acepta transferencias de terceros**, pero los T&C públicos (personas físicas, fines no comerciales, sin cobrar por cuenta de terceros) **no cubren a un boliche que cobra entradas**. ⚠️ No confirmado si existen T&C para clientes `BUSINESS`: no se encontraron publicados.
- Ripio exige que el partner haga aceptar los T&C activos antes de operar, y la aceptación es por versión ([Terms and Conditions](https://docs.ripio.com/ramps-api/terms-and-conditions/introduction.md)).

### 2.7 Partner settings, Sell and Pay y QR

- Lo que Ripio configura en la cuenta del partner (no por API): marca, **la comisión que ve el usuario**, URL de retorno, medios de pago habilitados por país, T&C activos, KYC on/off, historial y reembolsos ([Partner settings](https://docs.ripio.com/ramps-api/widget/configuration/partner-settings.md)). ⚠️ No confirmado si la "fee" del partner puede ser un *revenue share* para TicketJuy liquidado por Ripio. Si existiera, podría reemplazar al contrato de reparto.
- **Sell and Pay** es el flujo inverso al que necesita TicketJuy: el usuario **paga un QR de comercio con cripto** y "Ripio sells it for fiat and pays the merchant in local currency. The merchant receives a regular local payment" ([QR payments integration](https://docs.ripio.com/ramps-api/guides/qr-payments-integration.md)). Requiere KYC del pagador. No sirve para que un comprador sin cripto pague con pesos.

---

## 3. Normativa: ¿los depósitos a un PSAV tienen que venir del mismo titular?

**Respuesta corta: no se encontró ninguna norma vigente que lo exija.** Lo que hay son obligaciones de identificación, monitoreo y reporte que hacen que los PSAV lo limiten por contrato.

### 3.1 Ley y CNV

- **Definición de PSAV** (Ley 25.246, art. 4° bis, incorporado por la Ley 27.739, B.O. 15/3/2024): "Cualquier persona humana o jurídica que, **como negocio**, realiza una (1) o más de las siguientes actividades u operaciones **para o en nombre de otra persona**… i. Intercambio entre activos virtuales y monedas de curso legal…; ii. Intercambio entre… activos virtuales; iii. **Transferencia de activos virtuales**; iv. **Custodia y/o administración** de activos virtuales o instrumentos que permitan el control sobre los mismos; v. …" ([Ley 25.246 actualizada](https://www.argentina.gob.ar/normativa/nacional/ley-25246-62977/actualizacion)). Los PSAV son sujetos obligados (art. 20, inc. 13, misma fuente).
- **RG CNV 1058/2025** (B.O. 14/03/2025) sustituyó el régimen de registro de la RG 994/2024 ([Boletín Oficial – RG 1058/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/322539/20250314)):
  - Hay que inscribirse "con anterioridad a la realización de dichas actividades" (art. 1).
  - **No están alcanzados por la definición:** "ii) Aquellas personas humanas o jurídicas que **reciban o entreguen Activos Virtuales como contraprestación** por la compraventa o prestación de sus productos o servicios, cualquiera sea el monto"; "iii) Protocolos descentralizados… **siempre que no exista un proveedor de servicios identificable**"; "iv) Quienes prestan servicios **exclusivamente** en carácter de proveedores de billeteras de autocustodia".
  - Un PSAV extranjero queda alcanzado si tiene "acuerdos comerciales con terceros… que les permitan recibir localmente fondos de residentes argentinos… (servicios de rampa)" (art. 3).
  - Segregación de fiat: los fondos de clientes pueden estar en una cuenta bancaria a nombre del PSAV o en un "Proveedor de Servicios de Pago registrado ante el BCRA… en beneficio de sus clientes" (art. 18).
  - **No hay en el texto ninguna exigencia de que la transferencia fiat provenga de una cuenta del mismo titular.** Se buscó "titularidad", "tercer", "cuenta bancaria" y "de pago".
- **RG CNV 1172/2026** (octubre 2026): según un estudio jurídico, reemplaza el capítulo de PSAV, incorpora los Criterios Interpretativos 95, 96 y 97, agrega un informe mensual (PSAV_014) desde el 01/11/2026, y aclara que los protocolos descentralizados quedan excluidos solo si no hay una persona con "control o influencia suficiente" ([Marval – Se actualiza el régimen de los PSAV](https://www.marval.com/Publicacion/se-actualiza-el-regimen-de-los-psav-17739)). **Fuente secundaria. No se encontró el texto en el Boletín Oficial.** ⚠️ No confirmado si cambió las exclusiones citadas arriba o agregó reglas sobre depósitos fiat de terceros.

### 3.2 UIF

- **Res. UIF 49/2024** (B.O. 25/03/2024), requisitos mínimos de prevención de lavado para PSAV ([texto en argentina.gob.ar](https://www.argentina.gob.ar/normativa/nacional/norma-397597/texto); [ficha](https://www.argentina.gob.ar/normativa/nacional/norma-397597)). La ficha de Infoleg no muestra normas que la modifiquen. ⚠️ No confirmado que no haya sido modificada por otra resolución de 2025-2026.
  - Art. 34 (monitoreo) lista como circunstancias a "valorarse especialmente": "vii) **Situaciones en las cuales se utilice una cuenta para depositar fondos de terceros**", "ii) operaciones… que por su magnitud, habitualidad o periodicidad excedan las prácticas usuales o no guarden relación con su perfil", "xiv) … origen de los fondos… no… consistente con el tipo de actividad declarada". Es una **señal de alerta**, no una prohibición.
  - Art. 37 (regla de viaje): identificar "ordenante y… beneficiario de las transacciones alcanzadas por la regla de viaje", que se refiere a **transferencias de activos virtuales entre PSAV**, no a la transferencia en pesos.
  - Art. 38 (depósitos en efectivo): desde 6 SMVM hay que identificar a quien deposita y si lo hace "por sí o por cuenta de un tercero". Aplica a efectivo, no a transferencias.
  - Art. 39 (reporte sistemático de operaciones de 6 SMVM o más): debe identificar a "la persona que realizó la transacción (**operador de los fondos**); de la persona en nombre de la cual se realizó la transacción (**titular de los fondos**)". La norma **prevé** que operador y titular sean distintos.
- **Lectura para TicketJuy:** un CVU de un boliche que recibe muchas transferencias de terceros todas las noches es el patrón del art. 34.b.vii. El PSAV (Ripio, Settle) puede aceptarlo si lo tiene en el perfil del cliente (un comercio que cobra), pero va a querer conocer al comercio (KYB) y probablemente al pagador por encima de cierto monto. ⚠️ No confirmado qué umbrales usa cada PSAV.

### 3.3 BCRA

- **Transferencias a terceros en general:** las normas de transferencias contemplan expresamente las "Transferencias entre clientes o clientes y terceros" ([TO Sistema Nacional de Pagos – Transferencias, al 07/08/2025](https://www.bcra.gob.ar/Pdfs/Texord/t-snp-tr.pdf)). No se encontró una regla que restrinja transferir a un CVU de un PSAV.
- **Prohibición para PSPCP (billeteras):** "Los PSPCP no podrán realizar ni facilitar a sus clientes la realización de operaciones con activos digitales –incluidos los criptoactivos…– que no se encuentren autorizados por una autoridad reguladora nacional competente ni por el BCRA" (punto 4.6, [TO Proveedores de Servicios de Pago, al 04/11/2026, Com. "A" 8505](https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-psp.pdf)). ⚠️ No confirmado si un PSAV inscripto en la CNV cuenta como "autorizado por una autoridad reguladora nacional competente" (el registro de la CNV, según la propia Ripio, "no implica licencia ni supervisión", [terms.ripio.com/ar/on-off-ramp](https://terms.ripio.com/ar/on-off-ramp)). ⚠️ Tampoco está claro si se aplica a una transferencia común del cliente de MP a un CVU de Digipayments.
- **Bancos:** la Com. "A" 7506 (2022) prohibió a las entidades financieras realizar o facilitar operaciones con activos digitales no autorizados. Seguía citada como origen del punto 1.1 del TO de Servicios Complementarios en la Com. "A" 8392 del 26/01/2026 ([Com. "A" 8392](https://www.bcra.gob.ar/Pdfs/comytexord/A8392.pdf)). ⚠️ No confirmado si fue derogada después de enero de 2026. Una nota de prensa habla de que el BCRA "posterga" habilitar cripto en bancos ([iProUP](https://www.iproup.com/economia-digital/72166-bcra-posterga-cripto-en-bancos-efecto-en-mercado-pago-cocos-y-uala.amp)), pero es **fuente secundaria**.
- **PSPCP como servicio** (Com. "A" 8432, 2026): un PSP puede ofrecer cuentas de pago a clientes de un tercero que usa su plataforma, y el tercero debe mostrar "la denominación comercial del PSP que provee la cuenta de pago" ([BCRA – Informe de Inclusión Financiera 2026 S1, anexo normativo](https://www.bcra.gob.ar/archivos/Pdfs/publicacionesestadisticas/Informes/informe-inclusion-financiera-2026-S1-anexo-normativo.pdf); [TO PSP, punto 4.5](https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-psp.pdf)). Es el modelo en el que Digipayments le da el CVU al usuario de un partner de Ripio.
- **Exención del impuesto a los débitos y créditos** para PSAV inscriptos en la CNV (Decreto 475/2026, art. 5), según el mismo anexo del BCRA.
- **Pago con transferencia (PCT / QR / Transferencias 3.0):** el tope sigue vigente. "Los aceptadores podrán cobrar a los comercios… un precio dentro del rango" de **0,6 % a 0,8 %** según la categoría del comercio (grande, mediano hasta 500.000 UVA, pequeño hasta 100.000 UVA), con tasa de intercambio de 75 %, 50 % o 25 %. Los primeros tres meses son gratis para un "comercio pequeño" hasta 1.000 UVA por mes (puntos 5.1.2.2, 5.2 y 6.3.1, [TO Transferencias – Normas complementarias, al 08/09/2026, última Com. "A" 8477](https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-tr-nc.pdf)). Este precio aplica al **PCT** (pago iniciado por QR o con solicitud de pago al aceptador). Una transferencia común (push) a un CVU sigue el modelo "paga el cliente ordenante", con tramo gratuito (punto 5.1.2.1, misma fuente).
- **Cobro con transferencia en cuotas** (Com. "A" 8406, 02/03/2026): "Arancel a cobrar por el aceptador de cobro con transferencia al cliente ordenante: sin máximo, con un mínimo de 0,6 %… de cada cuota" ([Com. "A" 8406](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8406.pdf)). Es un producto distinto (financiación), mencionado solo para no confundirlo con el PCT.

---

## 4. Cómo encaja (o no) el diseño candidato

### 4.1 Paso "el comprador transfiere a un CVU del boliche"

| Requisito del diseño | Ripio (wARS) | Anclap (ARS Stellar) | Latamex (ARST) |
|---|---|---|---|
| CVU fijo del boliche | Sí: *on-ramp session* ([doc](https://docs.ripio.com/ramps-api/guides/on-ramp-integration.md)) | ⚠️ No documentado (SEP-6/24 dan instrucciones por transacción) | ⚠️ No documentado |
| Acepta pagos de terceros | Técnicamente sí (la cuenta de pago acepta "un tercero"), pero los T&C públicos exigen "fines no comerciales" ([T&C](https://terms.ripio.com/ar/on-off-ramp)) | ⚠️ No confirmado | ⚠️ No confirmado |
| Pagador sin KYC con la rampa | No hay regla que pida KYC al pagador de un CVU en Argentina. Sí al `customer` | ⚠️ No confirmado | ⚠️ No confirmado |
| Datos del pagador para conciliar | Solo `sender` (nombre, puede ser `null`). CBU de origen solo en depósitos rechazados | ⚠️ No documentado | ⚠️ No documentado |
| Monto o referencia por compra | No en la sesión. En la *order* hay `quoteId` y `externalRef`, pero ⚠️ no confirmado que el CVU sea único por orden | — | — |
| KYB del boliche | Tipo `BUSINESS` existe, campos de KYB ⚠️ no documentados | ⚠️ SEP-12 no visible | ⚠️ sin SEP-12 publicado |
| Inscripción PSAV de la rampa | Moonbird SRL N° 36 | **No figura** | Settle ARG S.A. N° 29 |

### 4.2 Paso "se reparte 90/10"

- Con **wARS**, el reparto es un contrato o un `transfer` en una red EVM (no hay wARS en Stellar, [Contracts](https://docs.ripio.com/wfiat/contracts.md)). La sesión de Ripio manda **todo** a una sola `depositAddress`. Para repartir, alguien tiene que firmar una segunda transacción desde esa dirección: el boliche con su passkey, o un contrato que reparta solo al recibir.
  - ⚠️ Un ERC-20 estándar no avisa al contrato receptor cuando le transfieren tokens, así que un "contrato que reparte al recibir" necesita que alguien llame una función (un *keeper*). Si ese keeper es TicketJuy, ver 4.3. Esto es conocimiento general de ERC-20, no está en la doc de Ripio.
- Con **ARS/ARST en Stellar**, el reparto es una transacción atómica de dos pagos ([Stellar Docs](https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions)), firmada por la cuenta que recibió los tokens.
- **Alternativa sin reparto on-chain:** pedirle a Ripio que la *fee* del partner (que ya existe como configuración, [Partner settings](https://docs.ripio.com/ramps-api/widget/configuration/partner-settings.md)) se le liquide a TicketJuy. ⚠️ No confirmado que Ripio lo haga.

### 4.3 ¿TicketJuy queda como PSAV?

- Si TicketJuy **firma o dispara** el movimiento de wARS/ARS que son del boliche (un keeper, una clave compartida o un relayer con permisos), eso se parece a "transferencia de activos virtuales… para o en nombre de otra persona" y a "administración de… instrumentos que permitan el control sobre los mismos" ([Ley 25.246, art. 4° bis](https://www.argentina.gob.ar/normativa/nacional/ley-25246-62977/actualizacion)).
- Si TicketJuy **solo provee el software de una billetera de autocustodia** (passkey del boliche) y el boliche firma, podría encuadrar en la exclusión "iv) Quienes prestan servicios **exclusivamente** en carácter de proveedores de billeteras de autocustodia" ([RG 1058/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/322539/20250314)). Pero "exclusivamente" es una palabra fuerte si TicketJuy además vende entradas y cobra comisión.
- La comisión del 10 % que recibe TicketJuy en wARS podría encuadrar en la exclusión "ii) … reciban… Activos Virtuales como contraprestación por… sus… servicios" (misma fuente).
- ⚠️ **No confirmado. Necesita dictamen de un abogado** con la RG 1172/2026 en mano.

---

## 5. Settle / Latamex: qué dicen sus términos públicos

Leídos en [preview.latamex.com/terms-of-use](https://preview.latamex.com/terms-of-use), porque `latamex.com/terms-of-use` responde 404. Figuran como "actualizados por última vez el 23/05/2024".

- **Quién es:** "SETTLE ARG S.A.S.", sociedad argentina con domicilio en Libertad 1170, CABA (preámbulo y sección XIII). Latamex es la marca de su rampa. En el registro de la CNV figura como Settle ARG S.A., PSAV N° 29 (ver 1.3).
- **Solo personas humanas:** el servicio es para "una persona humana" mayor de 18 años, con DNI argentino y residencia en Argentina (2.1). No hay términos públicos para empresas.
- **Prohibido por cuenta de terceros:** "El usuario solamente podrá acceder a la plataforma y utilizar los servicios de la compañía por su propia cuenta y en su propio nombre" (2.7). También se prohíbe "revender a terceros los servicios de la compañía" (2.6).
- **Depósitos:** solo valen los métodos "habilitados a tal efecto en la plataforma". Los depósitos hechos fuera del procedimiento se devuelven "a su exclusivo cargo" (3.7). La compañía puede "revertir, cancelar, modificar y/o ignorar" órdenes (3.4).
- ⚠️ No dicen explícitamente qué pasa con un depósito de un tercero.
- Fuentes secundarias dicen que Settle vende API, checkout y widget a empresas ([Web3Connect – Latamex](https://web3connect.com/partner/latamex), [YesPress – Settle Network](https://yespress.io/settle-network-yc-s22)). ⚠️ No hay documentación pública de ese producto.

**Impacto:**
- Ni Moon (empresa) ni TicketJuy pueden usar Settle con los términos públicos.
- Que el dueño de Moon use su cuenta personal para cobrar entradas rompe la sección 2.7 y es el patrón de "fondos de terceros" que la UIF manda monitorear (ver 3.2). El riesgo es la suspensión de la cuenta, la plata congelada y la devolución de depósitos, además de un problema impositivo.
- La única variante viable es un acuerdo B2B con **Moon como cliente** de Settle y TicketJuy como socio de software.

## 6. Cómo hacen Lemon y Belo (y por qué no es un modelo para TicketJuy)

⚠️ Esta sección describe el funcionamiento público de esas apps. No se verificó contra su documentación.

- Son **PSAV que custodian** los pesos y la cripto de sus usuarios en cuentas propias ("una cuenta grande"). El saldo de cada usuario es un registro en su base de datos.
- Cada usuario hizo KYC al abrir su cuenta.
- Cuando un usuario paga un QR o una transferencia con su cripto, la app ajusta los saldos internos y **le paga en pesos al comercio** desde su propia cuenta. La cripto casi no se mueve on-chain en el momento del pago. Cada tanto, la app equilibra sus reservas en el mercado.
- **La conversión ocurre del lado del que paga, no del que cobra.** El comercio recibe pesos y nunca ve cripto.

**Impacto:**
- TicketJuy ya acepta a usuarios de Lemon y Belo, que pagan con su cripto, si el checkout acepta Mercado Pago, transferencia o QR interoperable. No hace falta integrar nada.
- Copiar ese modelo es ser PSAV con custodia: registro en la CNV, sujeto obligado ante la UIF, un banco que acepte la cuenta, capital para reservas de pesos y cripto, y responsabilidad ante fraudes y hackeos. Es otro negocio.
- La blockchain reemplaza la base de datos de Lemon, **no la cuenta bancaria**. Los pesos tokenizados (ARST, wARS) están respaldados 1:1 por pesos que alguien guarda en un banco. Ese "alguien" es la rampa.

## 7. Decisión (2026-11-17)

**Para Moon: Mercado Pago Split.**
- Es lo más fácil y rápido de implementar, y Moon vincula su cuenta con un botón.
- Nadie fondea nada: todos usan MP.
- No hay temas legales: el regulado es MP y TicketJuy solo cobra su comisión.
- Los reembolsos ya vienen resueltos.
- ⚠️ Antes de lanzar hay que confirmar en sandbox qué medios acepta el split (ver [mercado-pago-split.md](./mercado-pago-split.md), sección 2).

**Cripto queda en pausa por dos motivos:**
1. **No hay quién haga el cambio para comercios.** Las rampas de pesos (Settle, Ripio, Lemon, Belo) son para personas. Ninguna ofrece públicamente que un comprador pague en pesos y el boliche cobre en tokens. Anclap no figura como PSAV.
2. **Hacerlo nosotros nos obliga a ser PSAV.** Recibir los pesos de los compradores requiere registro en la CNV, cumplir con la UIF, compliance, auditorías, abogados y conseguir un banco que acepte una empresa cripto.

**Y no se gana tanto:** Moon cobraría al instante, sin contracargos y con menos comisión (≈ $9.500 de $10.000 con Settle, contra ≈ $8.970 con MP a 10 días). Pero el comprador paga en pesos y Moon quiere pesos, así que la cripto es una vuelta en el medio. Con tarjeta, el ahorro desaparece.

**Se reactiva si:** Settle (u otra rampa registrada) ofrece un producto para comercios con Moon como cliente y TicketJuy como socio de software, y un abogado confirma que repartir la comisión on-chain no convierte a TicketJuy en PSAV. Tiene más sentido cuando TicketJuy tenga muchos boliches.

---

## Puntos no confirmados (consolidado)

1. ⚠️ Si **Anclap** sigue operando comercialmente y bajo qué sociedad inscripta como PSAV: Grupo Anchor S.A. no aparece en el registro de la CNV y su sitio tiene el certificado vencido.
2. ⚠️ Qué campos de KYC (SEP-12) pide Anclap, y si acepta personas jurídicas.
3. ⚠️ Si **Latamex/Settle** ofrece integración B2B (API, KYB, CVU por comercio), qué KYC pide (no publica SEP-12) y qué relación hay entre Relay Tech Services Ltd y Settle ARG S.A.
4. ⚠️ Si algún anchor de ARS en Stellar acepta depósitos fiat de un tercero distinto del titular autenticado.
5. ⚠️ Si Ripio tiene un producto para **comercios** (cliente `BUSINESS`) con T&C propios, y qué KYB exige. Los T&C públicos son para personas físicas y "fines no comerciales".
6. ⚠️ Si Ripio rechaza o devuelve un depósito al CVU de un customer cuando el titular de la cuenta de origen es otro (en Argentina).
7. ⚠️ Si el CVU que devuelve una *on-ramp order* es único por orden (sirve para conciliar) o es el CVU fijo del cliente.
8. ⚠️ Si el `sender` llega siempre en Argentina y si Ripio puede dar el CUIT/CBU del pagador en los eventos estándar.
9. ⚠️ Si la *fee* de partner de Ripio puede liquidarse a TicketJuy (*revenue share*) en lugar de un reparto on-chain.
10. ⚠️ En qué casos de producción Ripio permite operar sin KYC (la página del widget lo menciona y la de KYC dice que es obligatorio).
11. ⚠️ El contenido exacto de la **RG CNV 1172/2026** (solo se leyó una fuente secundaria) y si cambió las exclusiones de la definición de PSAV.
12. ⚠️ Si la Res. UIF 49/2024 fue modificada después de 2024.
13. ⚠️ Cómo se interpreta la prohibición del punto 4.6 del TO de PSP del BCRA (PSPCP que "faciliten" operaciones con activos digitales no autorizados) frente a una transferencia de un cliente de Mercado Pago a un CVU de una rampa cripto. Y si la Com. "A" 7506 sigue vigente para bancos después de enero de 2026.
14. ⚠️ Si TicketJuy queda como PSAV al operar un contrato o keeper de reparto (sección 4.3).
15. ⚠️ Manteca: no se encontró documentación pública oficial de su API de rampas ni una inscripción con ese nombre en el registro de PSAV. No se evaluó.

## Preguntas para cada proveedor

### Ripio (b2b@ripio.com, contacto que figura en [wFiat overview](https://docs.ripio.com/wfiat/overview.md))

1. Somos una ticketera. Queremos que **cada boliche sea un customer `BUSINESS`** con un CVU donde sus clientes (terceros, sin cuenta en Ripio) transfieran el precio de la entrada, y que Ripio lo convierta a wARS. ¿Es un caso de uso permitido? ¿Con qué contrato y T&C, dado que los T&C de on/off-ramp son para personas físicas, con "fines no comerciales" y prohíben "cobrar por los Servicios"?
2. ¿Qué **KYB** piden para una SRL/SA en Argentina? ¿Por API o por el flujo hospedado? ¿Cuánto tarda?
3. En Argentina, ¿un depósito al CVU de un customer **desde una cuenta de otro titular** se acredita, se marca o se devuelve? ¿Hay un tope por depósito o por mes para terceros?
4. ¿Puede un pagador tercero pagar **sin hacer KYC** con Ripio? ¿A partir de qué monto o frecuencia le piden identificación?
5. ¿Podemos tener un **CVU o alias por orden** (con monto esperado y `externalRef`) para conciliar cada entrada? ¿El CVU que devuelve `Create On-Ramp Order` es único por orden?
6. En los webhooks, ¿el `sender` llega siempre para CVU en Argentina? ¿Pueden incluir el **CUIT y el CBU/CVU de origen** en `ON-RAMP.DEPOSIT.RECEIVED`?
7. ¿Se puede pedir que el on-ramp entregue a **dos direcciones** (90/10), o que la **fee de partner** se liquide a TicketJuy? ¿En qué moneda y con qué factura?
8. ¿En qué red recomiendan wARS para pagos chicos y frecuentes (Base, Polygon, Celo, Tempo)? ¿Cuál es el costo y el tiempo de acreditación?
9. Off-ramp del boliche: ¿la cuenta de destino tiene que ser de la misma razón social (CUIT) que el customer? ¿Cuál es el plazo de acreditación en pesos?
10. ¿Qué pasa con un **reembolso** de una entrada ya convertida? ¿Se puede devolver al comprador a la cuenta de origen después de un `COMPLETED`?
11. ¿Ven riesgo regulatorio en que nuestra app sea solo una billetera de autocustodia (passkey del boliche) y no movamos fondos? ¿Hay partners con este esquema?

### Latamex / Settle ARG S.A. (support@latamex.zendesk.com, según su [stellar.toml](https://pubnet-sep.latamex.com/.well-known/stellar.toml))

1. ¿ARST sigue emitiéndose y rescatándose con normalidad? ¿Quién es el emisor (Relay Tech Services Ltd) y quién custodia la reserva en pesos? ¿Hay auditorías de reserva más recientes que la N° 1?
2. ¿Tienen API B2B y **KYB** para comercios? ¿Por qué el `stellar.toml` no publica `KYC_SERVER` (SEP-12)?
3. ¿Un comercio puede tener un **CVU fijo** al que transfieran **terceros** sin cuenta en Latamex, y recibir ARST en su cuenta Stellar? ¿Qué datos del pagador informan?
4. ¿Tienen o van a tener **SEP-31**?
5. Costos reales de depósito y retiro (el `/info` dice 0 % y un mínimo de depósito de 5.000 ARS) y los plazos.

### Anclap (info@anclap.com, según su [stellar.toml](https://anclap.com/.well-known/stellar.toml))

1. ¿Siguen operando? El sitio `home.anclap.com` tiene el certificado vencido desde el 14/11/2026.
2. ¿Bajo qué sociedad y número están inscriptos en el **registro de PSAV de la CNV**? Grupo Anchor S.A. no aparece.
3. ¿Qué pide su SEP-12 para personas jurídicas? ¿Aceptan depósitos de terceros a la cuenta de un comercio?
4. ¿Por qué SEP-31 está deshabilitado en el `stellar.toml`?

### Manteca

1. ¿Tienen API de on-ramp con CVU por comercio y aceptan pagos de terceros sin KYC del pagador? ¿Con qué sociedad están inscriptos como PSAV? (No se encontró documentación pública oficial.)

---

## Fuentes consultadas (2026-11-17)

**Stellar – directorio, estándares y docs**
- Anchor Directory: https://anchors.stellar.org/ (redirección desde https://stellar.org/anchors)
- Guía del Anchor Directory (SDF): https://stellar.org/blog/developers/anchor-directory-guide-finding-interoperable-asset-issuers-on-off-ramps-stellar
- SEP-1: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md
- SEP-6: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md
- SEP-12: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md
- SEP-24: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md
- SEP-31: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md
- Operations and transactions (atomicidad): https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions

**Stellar – anchors y datos on-chain**
- Anclap stellar.toml: https://anclap.com/.well-known/stellar.toml · https://api.anclap.com/.well-known/stellar.toml
- Anclap SEP-24 info: https://api.anclap.com/transfer24/info
- Anclap SEP-6 info: https://api.anclap.com/transfer6/info
- Anclap SEP-10: https://api.anclap.com/auth · SEP-12: https://api.anclap.com/kycserver12/customer (403 sin token)
- Latamex stellar.toml: https://pubnet-sep.latamex.com/.well-known/stellar.toml
- Latamex SEP-6/24 info: https://transfer-server.zetl.network/info
- Vibrant stellar.toml: https://vibrantapp.com/.well-known/stellar.toml
- Horizon – assets ARS: https://horizon.stellar.org/assets?asset_code=ARS&limit=50
- Horizon – ARS Anclap: https://horizon.stellar.org/assets?asset_code=ARS&asset_issuer=GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS
- Horizon – pagos de la cuenta operativa de Anclap: https://horizon.stellar.org/accounts/GARDJZ33FTTLVKGABXDS22SYNTP4VCLYARIEWKMZKYHX3RRLPMNR3HOT/payments?order=desc&limit=200
- Horizon – trades ARS: https://horizon.stellar.org/trades?base_asset_type=credit_alphanum4&base_asset_code=ARS&base_asset_issuer=GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS&counter_asset_type=native&order=desc&limit=3
- Horizon – ARST: https://horizon.stellar.org/assets?asset_code=ARST&asset_issuer=GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG
- Horizon – trades ARST: https://horizon.stellar.org/trades?base_asset_type=credit_alphanum4&base_asset_code=ARST&base_asset_issuer=GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG&counter_asset_type=native&order=desc&limit=3
- Horizon – ARSX (Chronos Pay): https://horizon.stellar.org/assets?asset_code=ARSX&asset_issuer=GA6NRRSBXCKZSCG56ODM5B6S5GUBLUEQSII4GUVQ7DFPEDJUGES7XVF7
- stellar.expert ARS: https://stellar.expert/explorer/public/asset/ARS-GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS-1
- stellar.expert ARST: https://stellar.expert/explorer/public/asset/ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG-1
- Latamex sitio: https://www.latamex.com.ar/
- Beans – depósito ARS vía Anclap (fuente secundaria): https://beansapp.tawk.help/article/how-to-deposit-ars

**Ripio – documentación oficial**
- Índice: https://ramp.ripio.com/llms.txt · https://docs.ripio.com/llms.txt
- Introducción Ramps API: https://docs.ripio.com/ramps-api/overview/introduction
- Argentina: https://docs.ripio.com/ramps-api/overview/countries/argentina.md
- On-Ramp integration: https://docs.ripio.com/ramps-api/guides/on-ramp-integration.md
- Create On-Ramp Session: https://docs.ripio.com/ramps-api/on-ramp/create-on-ramp-session.md
- Create On-Ramp Order: https://docs.ripio.com/ramps-api/on-ramp/create-on-ramp-order.md
- Create Deposit Account: https://docs.ripio.com/ramps-api/customers/create-deposit-account.md
- Create Customer: https://docs.ripio.com/ramps-api/customers/create-customer.md
- Fiat account lifecycle: https://docs.ripio.com/ramps-api/fiat-accounts/lifecycle.md
- On-Ramp Webhook Events: https://docs.ripio.com/ramps-api/webhooks/on-ramp-events.md
- Refunds: https://docs.ripio.com/ramps-api/refunds/overview.md
- KYC overview: https://docs.ripio.com/ramps-api/kyc/overview.md
- KYC fields by country: https://docs.ripio.com/ramps-api/kyc/kyc-fields-by-country.md
- KYC for regulated entities (CaaS): https://docs.ripio.com/crypto-as-a-service/kyc/kyc-for-regulated-entities.md
- Partner settings: https://docs.ripio.com/ramps-api/widget/configuration/partner-settings.md
- Widget – on-ramp: https://docs.ripio.com/ramps-api/widget/flows/on-ramp.md
- QR payments integration: https://docs.ripio.com/ramps-api/guides/qr-payments-integration.md
- Terms and Conditions (API): https://docs.ripio.com/ramps-api/terms-and-conditions/introduction.md
- OpenAPI: https://docs.ripio.com/ramps-api/openapi.json
- wFiat overview: https://docs.ripio.com/wfiat/overview.md
- wFiat contracts: https://docs.ripio.com/wfiat/contracts.md
- T&C on/off ramp (Moonbird SRL / Digipayments S.A.U.): https://terms.ripio.com/ar/on-off-ramp

**Regulatorio**
- Ley 25.246 actualizada (art. 4° bis, incorporado por la Ley 27.739): https://www.argentina.gob.ar/normativa/nacional/ley-25246-62977/actualizacion
- CNV RG 1058/2025 (Boletín Oficial): https://www.boletinoficial.gob.ar/detalleAviso/primera/322539/20250314
- CNV RG 1172/2026, resumen de Marval (fuente secundaria): https://www.marval.com/Publicacion/se-actualiza-el-regimen-de-los-psav-17739
- CNV – Registro PSAV: https://www.cnv.gov.ar/SitioWeb/RegistrosPublicos/Psav · listado descargable: https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav
- UIF Res. 49/2024, texto: https://www.argentina.gob.ar/normativa/nacional/norma-397597/texto · ficha: https://www.argentina.gob.ar/normativa/nacional/norma-397597
- BCRA TO Proveedores de Servicios de Pago (al 04/11/2026): https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-psp.pdf
- BCRA TO SNP – Transferencias – Normas complementarias (al 08/09/2026): https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-tr-nc.pdf
- BCRA TO SNP – Transferencias (al 07/08/2025): https://www.bcra.gob.ar/Pdfs/Texord/t-snp-tr.pdf
- BCRA TO SNP – Servicios de pago (al 18/08/2025): https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-snp-spd.pdf
- BCRA Com. "A" 8406 (cobro con transferencia): https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8406.pdf
- BCRA Com. "A" 8392 (referencia a la "A" 7506): https://www.bcra.gob.ar/Pdfs/comytexord/A8392.pdf
- BCRA Informe de Inclusión Financiera 2026 S1 – anexo normativo: https://www.bcra.gob.ar/archivos/Pdfs/publicacionesestadisticas/Informes/informe-inclusion-financiera-2026-S1-anexo-normativo.pdf
- iProUP sobre la Com. "A" 7506 (fuente secundaria): https://www.iproup.com/economia-digital/72166-bcra-posterga-cripto-en-bancos-efecto-en-mercado-pago-cocos-y-uala.amp

**Páginas que no se pudieron leer**
- https://home.anclap.com/ (certificado TLS vencido el 14/11/2026)
- https://api.anclap.com/kycserver12/customer (SEP-12, 403 sin autenticación SEP-10)
- https://api.anclap.com/transfer31/info (no responde; SEP-31 comentado en el toml)
- https://api.chronospay.io/.well-known/stellar.toml y https://chronospay.io/ (el dominio no resuelve DNS)
- https://settle.network/ (no responde)
- https://latamex.com/ (redirección 308 en bucle a sí misma)
- https://anchors.relay.vision/audits/ARST-Audit-No-1.pdf (no se leyó)
- https://anchors.stellar.org/ (se arma con JavaScript; los datos se extrajeron del HTML embebido)
- Texto oficial de la RG CNV 1172/2026 en el Boletín Oficial (no se encontró)
- T&C de Ripio para clientes `BUSINESS` (no se encontraron publicados)
- Documentación oficial de la API de Manteca (no se encontró)

**Relacionado**
- [mercado-pago-split.md](./mercado-pago-split.md)
- [payway.md](./payway.md)
