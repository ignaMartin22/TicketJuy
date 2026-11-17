# Payway (ex Decidir): investigación para TicketJuy

> **Fecha de consulta:** 2026-11-17. Las fuentes son páginas oficiales de Payway (`payway.com.ar`, `ayuda.payway.com.ar`), los SDK oficiales de Payway en GitHub (organización `payway-ar`, que el propio README de Payway enlaza con sus contactos de soporte), y para lo regulatorio el BCRA, Infoleg/argentina.gob.ar y el Boletín Oficial.
>
> **Cómo leer este documento:** cada afirmación cita su URL. Lo que no está respaldado por una fuente oficial se marca con **⚠️ No confirmado**. Las preguntas para el equipo comercial de Payway están al final. La comparación con Mercado Pago usa [mercado-pago-split.md](./mercado-pago-split.md).
>
> **Nota de método:**
> - El portal de documentación nuevo ([documentacion-ventasonline.payway.com.ar](https://documentacion-ventasonline.payway.com.ar/), en Stoplight) y el portal de desarrolladores ([developers-ventasonline.payway.com.ar](https://developers-ventasonline.payway.com.ar/portal/login)) se arman del lado del navegador o piden login. No se pudieron leer de forma automática. El dominio viejo `developers.decidir.com` responde 403 en la web, aunque los SDK lo siguen usando como URL de sandbox. El sitio de la doc vieja (`decidirv2.api-docs.io`) redirige a otro dominio y ya no existe.
> - Por eso la parte técnica sale de los **README de los SDK oficiales** (Java y .NET son los más completos, actualizados el 2026-11-13 según GitHub). Conviene validarla contra el portal con un usuario de integración.
> - `www.payway.com.ar` sirve un certificado sin la cadena intermedia completa. Se leyó completando la cadena con el certificado intermedio oficial de GeoTrust/DigiCert, sin desactivar la verificación TLS.

---

## Resumen para TicketJuy

| # | Hallazgo | Impacto para TicketJuy |
|---|---|---|
| 1 | Payway vende online con **checkout propio, API REST + SDK (Java, .NET, Node, PHP, JS), plugins (WooCommerce, PrestaShop, Tiendanube, VTEX) y Link de pago** creado desde Mi Payway. | Técnicamente se puede integrar igual que MP. El Link de pago de Mi Payway es manual, de un solo uso y vence a las 24 h, así que no sirve para el checkout del MVP. |
| 2 | **Sí existe algo parecido al split: las "transacciones distribuidas"** (`payment_type: "distributed"` + `sub_payments`). Un pago se reparte entre varios *sites*, por **monto** (lo manda el integrador en cada pago) o por **porcentaje** (fijo, lo configura Payway). Cada sub-site tiene que estar **"habilitado y vinculado al site padre"**. | Es el equivalente funcional del `marketplace_fee`: un sub_payment para el boliche y otro para TicketJuy. Pero **no es autoservicio**: Payway da de alta y vincula cada site. TicketJuy también tendría que ser un establecimiento Payway para cobrar su parte. |
| 3 | El modelo **Agregador / PayFac** existe, pero el agregador **le liquida la plata a los vendedores**, responde por contracargos y fraude, y es sujeto obligado ante la UIF. Además tiene que cumplir PCI DSS y tener las licencias de PSP. | **Descartado para TicketJuy:** contradice el principio "la plata no pasa por nosotros" y suma una carga regulatoria enorme. |
| 4 | Los TTCC dicen que **la acreditación va completa a una sola cuenta bancaria** del establecimiento y no se puede repartir entre cuentas. | Sin transacciones distribuidas, Payway **no** separa la comisión sola. Con un establecimiento simple, TicketJuy tendría que facturarle al boliche aparte. |
| 5 | Costos online publicados: **1 % + IVA por venta online, más el arancel de la tarjeta**. Arancel máximo e-commerce: **débito 2 %, crédito/prepaga 3 %, Amex 2,8 %**, todo + IVA. | Para crédito en 1 pago queda en **hasta ~4 % + IVA (≈ 4,84 %)** cobrando en 8 a 18 días hábiles, y para débito en **hasta ~3 % + IVA (≈ 3,63 %)** a 1 día hábil. Es más barato que MP a 10 días (4,39 % + IVA). ⚠️ Falta confirmar si el 1 % se suma al arancel máximo o ya está adentro. |
| 6 | **Cobro Anticipado viene activado por defecto** al adherirse, y tiene un costo (tasa por día adelantado). El ejemplo publicado para crédito a 1 día hábil es **6,30 % + IVA**, con la tasa de anticipo incluida. | El boliche tiene que decidir: o lo da de baja y cobra crédito a 8, 10 o 18 días hábiles, o paga casi lo mismo que MP "al instante". |
| 7 | **Ya no hay tope regulatorio al arancel del comercio.** El DNU 70/2023 sacó los topes de 3 % (crédito) y 1,5 % (débito). Hoy el BCRA solo topea la **tasa de intercambio** que cobra el emisor (0,60 % débito, 1,30 % crédito). | Los "máximos" de Payway son precios de lista de Payway, no un límite legal. |
| 8 | **Plazos:** débito 1 día hábil. El crédito en 1 pago lo fija el BCRA: **8 días hábiles** para micro/pequeña empresa o persona humana, **10** para medianas y gastronomía/turismo/salud, **18** para el resto. Prepaga: 2 días hábiles. | Moon probablemente caiga en 8 días hábiles (si es micro/pyme registrada). La plata va a una **cuenta bancaria** del boliche, no a una billetera. |
| 9 | **Rubro 5813 "Bares americanos/Confitería" está inhabilitado para cuotas** en Payway. Además, los TTCC prohíben presentar ventas **antes de entregar el servicio**, salvo autorización. | ⚠️ Hay que confirmar con qué rubro (MCC) se da de alta la venta de entradas de un boliche, y que la preventa de entradas esté autorizada. |
| 10 | **No hay webhooks documentados** en los SDK públicos. El estado se obtiene en la respuesta sincrónica del pago o consultando el pago. El formulario hospedado usa `success_url`, `cancel_url` y `redirect_url`. | Hay que diseñar con consulta activa (polling) o preguntar si existe un webhook en el portal nuevo. ⚠️ No confirmado. |

### Recomendación

**Para el MVP con Moon, seguir con Mercado Pago Split 1:1 como integración principal. Tomar Payway como complemento a evaluar en una fase 2, no como reemplazo.**

- **Por qué no Payway ahora:** el split de Payway (transacciones distribuidas) depende de que Payway dé de alta y vincule un site por cada boliche al site padre de TicketJuy, y de que TicketJuy también sea establecimiento Payway. Nada de eso está documentado como autoservicio: es una negociación comercial. El onboarding de MP, en cambio, es un OAuth de un clic. Además, en Payway no hay webhooks documentados.
- **Por qué sí mirarlo:** (a) para crédito y débito sale más barato que MP con plazos parecidos; (b) la plata cae en la cuenta bancaria del boliche; (c) muchos boliches ya tienen terminal Payway y número de establecimiento, así que para ellos el alta online es una extensión de algo que ya tienen.
- **Siguiente paso concreto:** pedir una reunión con el equipo de Ventas Online (integraciones-ventasonline@payway.com.ar) con las preguntas del final, sobre todo las de transacciones distribuidas y rubro. Si confirman que se puede tener "site padre TicketJuy + sub-sites por boliche" con distribución por monto, hay que diseñar una interfaz `PaymentProvider` que soporte los dos proveedores desde el principio.

---

## 1. Qué ofrece Payway para vender online y qué se necesita para darse de alta

### 1.1 Productos

- **Checkout / integración propia:** "Integrá nuestro checkout y aceptá pagos de manera rápida y segura". Hay "Soluciones prediseñadas" (plugins) y "Soluciones a medida: Conectá tu tienda online con desarrollo propio a nuestra solución de pagos a traves de API o SDK" ([Vender online](https://www.payway.com.ar/vender-online)). La página muestra SDK para .NET, Java, JavaScript, Node.js y PHP, y plugins para PrestaShop, Tiendanube, VTEX y WooCommerce (misma página).
- **Tienda online propia de Payway**, o integrar la solución de cobro al sitio web, WooCommerce o PrestaShop ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)).
- **API REST:** el flujo tiene dos pasos. (1) El frontend genera un **token de pago** con la *public API key* mandando los datos de la tarjeta. (2) El backend ejecuta el pago con la *private API key*, el token, el `site_transaction_id`, el monto, la moneda y las cuotas ([SDK JavaScript](https://github.com/payway-ar/sdk-javascript-ventaonline)). URLs: sandbox `https://developers.decidir.com/api/v2/` y producción `https://ventasonline.payway.com.ar/api/v2/` ([SDK Java – Ambientes](https://github.com/payway-ar/sdk-java-ventaonline#environments)). Las API keys "serán provistas por el equipo de Soporte de Payway ventas online" (misma página).
- **Formulario de pago hospedado ("validate" + "form"):** el comercio manda los datos de la operación a `validate`, recibe un hash y con él pide el formulario "renderizado propio para cada comercio". Requiere un `site.template.id` "generado previamente por Payway" y acepta `payment_type` `single` o `distributed` ([SDK .NET – Formulario de Pago](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)).
- **Link Checkout:** método para "obtener un hash de pago desde el checkout de payway" con productos y precio total ([SDK Java – Link Checkout](https://github.com/payway-ar/sdk-java-ventaonline#linkCheckout)). El SDK PHP lista "Creación y consulta de links de pago" entre sus funciones ([SDK PHP](https://github.com/payway-ar/sdk-php-ventaonline)).
- **Link de pago (manual, desde Mi Payway):** se crea con monto y descripción y se comparte por WhatsApp, email o redes. "Cada link se puede usar 1 sola vez y dura 24 horas sin abrir. Si tu cliente lo abre, tiene 2 horas para pagarte" ([Link de pago – ayuda](https://ayuda.payway.com.ar/cobros/medios-de-pago/link-de-pago)). "No necesitás un sitio web" ([Link de pago](https://www.payway.com.ar/cobrar-con-link-de-pago)).
- **Otras verticales en la API:** pago PCI (el comercio manda los datos de tarjeta), pago tokenizado, 3DS, Cybersource (antifraude, con una vertical específica **"Ticketing"**), dos pasos (preautorización y confirmación), pagos offline (Rapipago, Pago Fácil, PagoMisCuentas) y comercio agregador ([SDK Java](https://github.com/payway-ar/sdk-java-ventaonline); [SDK .NET](https://github.com/payway-ar/sdk-net-ventaonline)).
- "Botón de pago" no aparece como nombre de producto en las páginas actuales. Lo que existe es el "checkout" y la integración por API, SDK o plugin ([Vender online](https://www.payway.com.ar/vender-online)).

### 1.2 Qué necesita un establecimiento para darse de alta

- **Adhesión a Payway eligiendo "venta online":** "necesitás adherirte a Payway y seleccionar la opción de venta online. Luego, vas a recibir un email con tu número de establecimiento para operar con más de 30 medios de pago y los accesos para acceder a tu cuenta" ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)). La adhesión online está en [adherite.payway.com.ar](https://adherite.payway.com.ar/), y por teléfono en el 0810 333 0066 ([Vender online](https://www.payway.com.ar/vender-online)).
- **Número de establecimiento:** lo asigna Payway al adherir, no hay que tramitarlo antes con cada marca (misma página de ayuda). El Formulario de Adhesión registra "Número del Establecimiento, Plazo de Pago, Porcentaje Retención Crédito y Débito y demás condiciones" ([TTCC, 2.1.19](https://www.payway.com.ar/legales)). ⚠️ No confirmado si para Amex hace falta un número aparte. Los TTCC mencionan el programa **Amex OptBlue** y que un comercio de alta facturación según Amex "deberá firmar un contrato directo con dicha entidad" ([TTCC, 3.21.5](https://www.payway.com.ar/legales)).
- **CUIT y banco pagador:** para registrar el perfil *owner* en Mi Payway se piden "CUIT, número de establecimiento y banco pagador" ([Perfiles de Mi Payway](https://ayuda.payway.com.ar/cuenta-payway/perfiles)).
- **Cuenta bancaria:** el pago se acredita "en la cuenta bancaria que a esos efectos el Establecimiento deberá abrir en el Acreditador" ([TTCC, 3.9.1](https://www.payway.com.ar/legales)). La plata se deposita "en pesos en la cuenta bancaria que designaste al momento de registrarte" ([Tarjetas – ayuda](https://ayuda.payway.com.ar/cobros/medios-de-pago/tarjetas)). ⚠️ No confirmado si sirve una CVU (cuenta de billetera) o si tiene que ser una cuenta bancaria con CBU.
- **Condición fiscal:** no hay una lista pública de requisitos por condición fiscal. Lo que sí hay: el arancel "Puede variar ... en función de la condición fiscal del comercio. Para Monotributistas, el arancel percibido para productos de débito es 0%" ([Plazos y aranceles](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones)). El establecimiento tiene que avisar cualquier "modificación en su situación impositiva" ([TTCC, 3.10](https://www.payway.com.ar/legales)). Los acreditadores son "agentes naturales de retención/percepción de impuestos" ([TTCC, 3.16](https://www.payway.com.ar/legales)). ⚠️ No confirmado qué documentación exacta piden: estatuto, constancia de ARCA, habilitación municipal, etc.
- **Rubro:** cada establecimiento tiene un rubro, y eso define qué puede hacer. Por ejemplo, **5813 "Bares americanos/Confitería" no puede vender en cuotas** ([Cuotas – ayuda](https://ayuda.payway.com.ar/cobros/cuotas)). ⚠️ No confirmado con qué rubro se daría de alta la venta de entradas de un boliche. ⚠️ No confirmado: es conocido que en las marcas el MCC 5813 incluye bares y discotecas, pero no se encontró una fuente oficial de Payway que lo diga.
- **Requisitos del sitio web (e-commerce):** el sitio tiene que mostrar, entre otras cosas, la descripción de los servicios, la política de cancelaciones, devoluciones y reembolsos, el contacto, el domicilio legal, las marcas aceptadas, el derecho de revocación de 10 días corridos y la leyenda "Los bienes y/o servicios ofrecidos en esta página no son promovidos, auspiciados ni garantizados por Payway S.A.U". También tiene que mandar un email de confirmación sin datos de la tarjeta ([TTCC, 5.10 y 5.11](https://www.payway.com.ar/legales)).
- **Venta anticipada:** "queda expresamente prohibido al Establecimiento, presentar las operaciones de venta con anticipación a la entrega de los bienes y/o servicios al Usuario, con excepción de aquellos Establecimientos autorizados por el Acreditador o la Administradora" ([TTCC, 3.8.5](https://www.payway.com.ar/legales)). Para entradas de eventos futuros **hay que pedir esa autorización**. ⚠️ No confirmado cómo se tramita.
- **Mi Payway** es gratis y un mismo usuario "puede colaborar con hasta 12 comercios" con perfiles Owner, Administrador u Operador ([Mi Payway](https://www.payway.com.ar/cuenta-payway); [Perfiles](https://ayuda.payway.com.ar/cuenta-payway/perfiles)).

---

## 2. Split / pagos distribuidos

### 2.1 Transacciones distribuidas (lo más parecido al split de MP)

Según [SDK Java – Transacción distribuida](https://github.com/payway-ar/sdk-java-ventaonline#distributed):

- "Existen transacciones distribuidas definidas por monto o por porcentaje. Para indicar los sitios a distribuir, se debe enviar en el campo `sub_payments` cada uno de ellos. En el caso de transacción por monto se indicará: **Id del sitio receptor, monto a distribuir y la cantidad de cuotas**."
- **Por monto:** "la sumatoria de los montos distribuidos debe ser exactamente igual al monto total de la operación Padre."
- **Por porcentaje:** "el parámetro sub_payments no debe completarse, pues la distribución es estática y se configura en el SAC" (el backoffice de Payway). El SDK .NET lo llama "Adm Sites (SAC)" ([SDK .NET – Formulario de Pago](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)).
- Parámetros de cada sub_payment ([SDK Java – Parámetros Distribuido por Monto](https://github.com/payway-ar/sdk-java-ventaonline#parametrosDistMonto)):
  - `site_id`: "Numérico de 8 caracteres, se debe encontrar **habilitado y vinculado al site padre**".
  - `installments`: de 1 a 99.
  - `amount`: entero en centavos, que "es parte del amount Total".
- **Cada sub_payment sale con su propia autorización.** En la respuesta de ejemplo, cada elemento de `sub_payments` trae su `site_id`, `ticket`, `card_authorization_code`, `subpayment_id` y `tid` ([SDK .NET – respuesta distribuida](https://github.com/payway-ar/sdk-net-ventaonline)). Eso sugiere que cada sub-site se presenta y liquida como un establecimiento propio, en su propia cuenta. ⚠️ Esto se deduce del formato de la respuesta. Ninguna página dice explícitamente "cada sub-site cobra en su cuenta bancaria".
- El formulario hospedado también acepta `payment_type: "distributed"` con `sub_payments` ([SDK .NET](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)).
- Los pagos en dos pasos (preautorización) no admiten distribución: `sub_payments` "Nunca se utiliza en 2 pasos (se envia vacio)" ([SDK Java – dos pasos](https://github.com/payway-ar/sdk-java-ventaonline#twosteps)).

**Cómo se aplicaría a TicketJuy:**

```
Pago de $10.000 (payment_type = distributed, site padre = TicketJuy)
├── sub_payment 1: site_id = <site de Moon>       amount = 920000 (centavos)
└── sub_payment 2: site_id = <site de TicketJuy>  amount =  80000
```

- **Quién puede usarlo:** ⚠️ No confirmado. No hay una página pública que lo explique comercialmente. Por lo técnico, hace falta (a) un site padre, (b) un site por cada receptor "habilitado y vinculado al site padre", y (c) para el modo porcentaje, configuración en el SAC. Todo eso lo hace Payway.
- **¿Cada boliche necesita su propio establecimiento o site?** Sí, según lo técnico: cada receptor es un `site_id`. ⚠️ No confirmado si ese site tiene que salir de un establecimiento con CUIT propio del boliche (lo esperable) y si un boliche que ya tiene establecimiento Payway presencial puede sumar un site online vinculado al padre de TicketJuy.
- **Cómo se separa la comisión:** por monto, TicketJuy calcula su comisión y la manda como un sub_payment hacia su propio site. Es análogo al `marketplace_fee` de MP, pero acá TicketJuy **también necesita ser establecimiento Payway**. ⚠️ No confirmado cómo se cobra el arancel: lo esperable es que cada sub-site pague arancel por su parte, y que TicketJuy pague arancel de tarjeta sobre su comisión, cosa que en MP no pasa.
- **¿Hay que ser facilitador o agregador?** No para las transacciones distribuidas. Son un modelo en el que cada receptor es un establecimiento adherido, y la plata no pasa por el integrador. ⚠️ No confirmado contractualmente.

### 2.2 Modelo Agregador / Facilitador de pagos (PayFac)

Según el [Anexo de TTCC para Agregador (2025)](https://www.payway.com.ar/sites/default/files/2025-08/Anexo+Agrupador+2025.pdf) y la sección equivalente en los [TTCC](https://www.payway.com.ar/legales):

- El agregador "presta el servicio de Proveedor de Servicios de Pago ... a través del cual brinda el servicio de procesamiento y/o liquidación de pagos a sus clientes ('Vendedores')" (considerando b).
- "El Agregador es exclusivamente responsable de efectuar a los Vendedores los pagos por todas las transacciones ... En ningún caso la Administradora asumirá responsabilidad alguna respecto a la liquidación y pago de dichos fondos a los Vendedores" (2.16). **O sea, la plata entra al agregador.**
- Es "responsable de cada transacción procesada ... lo que incluye ... disputas/contracargos y/o desconocimientos" (2.7).
- Tiene que cumplir la Ley 25.246 y las resoluciones de la UIF "como sujeto obligado" (2.6), cumplir PCI DSS y PA DSS (2.13), tener un plan de recuperación ante desastres y "las licencias y permisos legales y reglamentarios vigentes requeridos para operar" (2.9).
- Tiene que dar de alta "tantos establecimientos como actividades y Vendedores tenga", informar el MCC de cada vendedor y mandar un *soft descriptor* "NOMBRE DEL PAYFAC*NOMBRE DEL VENDEDOR" (cláusula 3). En la API se informa con el objeto `aggregate_data` (CUIT, nombre, domicilio, rubro y otros datos del sub-comercio) ([SDK .NET – comercio agregador](https://github.com/payway-ar/sdk-net-ventaonline#payment-agregator); [SDK Java – Parámetros Agregador](https://github.com/payway-ar/sdk-java-ventaonline#parametrosAgregador)).

**Conclusión:** el modelo agregador obliga a TicketJuy a cobrar y redistribuir la plata, y a asumir el riesgo y la regulación de un PSP. **No encaja** con "la plata no pasa por nosotros".

### 2.3 Sin distribución: una cuenta, sin reparto

"La acreditación del pago será realizada de forma completa en la cuenta bancaria designada por el Establecimiento, no pudiendo parcializarse en diferentes cuentas, ya sean propias o de terceros ... tampoco podrá ceder en forma parcial los cupones correspondientes a sus ventas a terceros" ([TTCC, 3.9.2](https://www.payway.com.ar/legales)). Con un establecimiento común, la comisión de TicketJuy **no se separa sola**: habría que facturarla aparte. Tampoco se puede "ceder" parte del cupón.

Los TTCC definen además "Establecimiento Mayorista" y "Minorista" (este último opera "por sí mismo o por cuenta y orden del Establecimiento Mayorista") ([TTCC, 2.1.17–2.1.18](https://www.payway.com.ar/legales)). ⚠️ No confirmado si eso tiene alguna relación con la operatoria distribuida.

---

## 3. Medios de pago aceptados

| Medio | Online (API / checkout) | Fuente |
|---|---|---|
| **Crédito** (Visa, Mastercard, Cabal, Amex, Diners, Discover, UnionPay y otras) | ✅ Sí | [Tarjetas – ayuda](https://ayuda.payway.com.ar/cobros/medios-de-pago/tarjetas); [Vender online](https://www.payway.com.ar/vender-online) |
| **Débito** | ✅ Sí. "Las Tarjetas de Débito podrán ser utilizadas para transacciones bajo la venta por Comercio Electrónico" | [TTCC, sección débito (IV)](https://www.payway.com.ar/legales) |
| **Prepagas** | ✅ "Aceptá crédito, débito, prepagas y mucho más" | [Vender online](https://www.payway.com.ar/vender-online) |
| **Cuotas** | ✅ Cuotas Payway (hasta 18), Cuotas MiPyME y otros planes (hasta 50 según emisor). ⚠️ **No para el rubro 5813** | [Cuotas – ayuda](https://ayuda.payway.com.ar/cobros/cuotas) |
| **Efectivo (Rapipago / Pago Fácil)** y **PagoMisCuentas** | ✅ Como "pago offline" en la API (cupón con vencimiento) | [SDK Java – Parámetros Offline / PMC](https://github.com/payway-ar/sdk-java-ventaonline#parametrosOffline); [SDK .NET](https://github.com/payway-ar/sdk-net-ventaonline) |
| **QR interoperable** (MODO, Mercado Pago, Cuenta DNI, BNA+, Ualá, apps bancarias y otras; dinero en cuenta, débito y crédito) | ✅ **Presencial** (terminal o QR impreso) y desde Mi Payway. ⚠️ No confirmado en el checkout online por API. | [Cobrar con QR](https://www.payway.com.ar/cobrar-con-qr); [Mi Payway](https://www.payway.com.ar/cuenta-payway) |
| **Pagos con transferencia (PCT)** | ✅ Vía QR (arancel 0,8 %). ⚠️ No confirmado en e-commerce por API | [Plazos y aranceles](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones) |
| **Billeteras en la web** | La página de venta online muestra logos de Mercado Pago, MODO, Cuenta DNI y Tarjeta Alimentar como "medio de pago aceptado". ⚠️ No confirmado cómo se integran en el checkout API | [Vender online](https://www.payway.com.ar/vender-online) |
| **Monedas** | ARS y USD, pero "la legislación argentina sólo permite transacciones en Pesos Argentinos" (con matices) | [SDK Java – Divisas](https://github.com/payway-ar/sdk-java-ventaonline#divisasa) |

- **Restricción importante:** "Visa Debito no acepta devoluciones parciales en ecommerce" ([SDK Java – Medios de pago](https://github.com/payway-ar/sdk-java-ventaonline#codigos-de-medios-de-pago)).
- El monto mínimo de una transacción es el equivalente a US$ 0,02 ([TTCC, 3.2.3](https://www.payway.com.ar/legales)).
- ⚠️ No confirmado qué medios admite una **transacción distribuida**. El ejemplo usa Visa ([SDK Java](https://github.com/payway-ar/sdk-java-ventaonline#distributed)). Lo esperable es que no funcione con pagos offline ni con QR.

---

## 4. Costos

### 4.1 Comisión de Payway por venta online

- "Solo pagás un 1% + IVA por venta online que hacés. Recordá que a este valor tenés que sumarle el costo de vender con tarjeta" ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)).

### 4.2 Arancel por medio de pago (precios máximos de Payway)

Tabla "Arancel Máximo" de [Plazos de acreditación y aranceles](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones), consultada el 2026-11-17:

| Medio | Marca | Terminal / QR / Débito automático / Venta telefónica | **E-Commerce / Link de pago** |
|---|---|---|---|
| Débito | Visa / Cabal / Discover | 1,4 % | **2 %** |
| Débito | Mastercard | 1,6 % | **2 %** |
| Crédito o prepaga | Visa / Mastercard / Cabal / Diners / Discover / UnionPay | 2 % | **3 %** |
| Crédito | American Express | 2,8 % (todos los canales) | **2,8 %** |
| Pago con transferencia (PCT) | — | 0,8 % (QR) | — |

- "Puede variar el arancel facturado en función de la condición fiscal del comercio. Para Monotributistas, el arancel percibido para productos de débito es 0%" (misma página).
- **Inconsistencias entre páginas oficiales** (todas consultadas el 2026-11-17):
  - [Tarjetas – ayuda](https://ayuda.payway.com.ar/cobros/medios-de-pago/tarjetas): "Débito: 1,0% + IVA. Crédito: hasta 1,8% + IVA (American Express: hasta 2,90% + IVA)".
  - [Cobrar con QR](https://www.payway.com.ar/cobrar-con-qr): débito 1,2 % + IVA; crédito 2,0 % + IVA a 8 días hábiles o 6,30 % + IVA a 1 día hábil con cobro anticipado; dinero en cuenta 0 % los primeros 3 meses y después 0,8 % + IVA.
  - [Planes y precios](https://www.payway.com.ar/planes-precios): débito "hasta 1,4 % + IVA", crédito "hasta 2,0 % + IVA" a 8 días hábiles y crédito "hasta 6,30 % + IVA" a 1 día hábil (con Cobro Anticipado incluido). El ejemplo aclara que es "para pagos en terminales Payway con tarjetas Visa".
  - Todo eso es presencial. Para e-commerce, la única tabla específica es la de arriba (2 % / 3 %).
- ⚠️ **No confirmado:** si el 1 % + IVA de "venta online" se suma al arancel máximo e-commerce (que da hasta 3 % + IVA en débito y 4 % + IVA en crédito) o si los máximos e-commerce ya lo incluyen.
- **IVA:** todas las tasas se publican "+ IVA". Para Cuotas Payway: "IVA: 21% que se aplica sobre el costo financiero" ([Cuotas Payway](https://ayuda.payway.com.ar/cobros/cuotas/cuotas-payway)).
- **Costos fijos o mensuales:** Mi Payway es "¡100% gratis!" ([Mi Payway](https://www.payway.com.ar/cuenta-payway)). No hay un abono mensual publicado para venta online. Mi Payway Profesional es pago, pero no se publica el precio (misma página). Los TTCC mencionan un precio mensual por el servicio "LAPOS WEB" según una lista de precios ([TTCC, 5.19](https://www.payway.com.ar/legales)). ⚠️ No confirmado si aplica a la integración por API.
- **Multas:** si los contracargos superan el 1 % de las transacciones (en cantidad o monto) durante 2 meses consecutivos, hay una multa por cada contracargo entre el 3.er y el 6.º mes ([TTCC, 3.19](https://www.payway.com.ar/legales)). También hay multas por presentar fuera de plazo (TTCC, 3.19, "Multas").

### 4.3 Topes regulatorios: qué limita hoy el BCRA

- **Ya no hay tope al arancel que paga el comercio.** El BCRA dice que "between the end of 2023 and the beginning of 2024 ... One of the most relevant aspects was the elimination of maximum fees (previously, fees could not exceed 3% in the case of credit cards and 1.5% in the case of debit cards)", y que el cambio vino del "Decree DNU 70/2023 that amended Article 15 of Law 25,065" ([BCRA – Financial Inclusion Report, 1st half 2025](https://www.bcra.gob.ar/en/publicaciones/financial-inclusion-report-first-half-of-2025/)). El texto actualizado del art. 15 de la Ley 25.065 solo obliga al emisor a informar la tasa de financiación, con la nota "Artículo sustituido por art. 19 del Decreto N° 70/2023 B.O. 21/12/2023" ([Ley 25.065 actualizada](https://www.argentina.gob.ar/normativa/nacional/ley-25065-55556/actualizacion); [DNU 70/2023 – Boletín Oficial](https://www.boletinoficial.gob.ar/detalleAviso/primera/301122/20231221)). El mismo informe del BCRA dice que los adquirentes "generally maintained their commissions at 1.8%".
- **Lo que sí está topeado es la tasa de intercambio** (lo que cobra el banco emisor, no el adquirente): **0,60 % en débito y 1,30 % en crédito/compra**. Incluye "cualquier otro mecanismo de retribución o compensación a los emisores ... que tenga un objeto o efecto equivalente" ([BCRA Com. "A" 8303, punto 7.1](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8303.pdf), vigencia 20/08/2025).
- QR: la billetera que inicia el pago puede cobrarle al emisor hasta 0,07 % (A 8303, punto 7.3). El adquirente no puede discriminar comisiones ni plazos según la billetera (A 8303, punto 4.4).

### 4.4 Cuotas

- **Cuotas Payway** (hasta 18, según rubro; se cobra a 1 día hábil). El comercio absorbe un costo financiero. Tabla vigente "desde el 30/3/26" ([Cuotas Payway](https://ayuda.payway.com.ar/cobros/cuotas/cuotas-payway)):

| Cuotas | TNA | Tasa directa | Coeficiente |
|---|---|---|---|
| 2 | 103 % | 11,08 % | 1,1275 |
| 3 | 103 % | 14,47 % | 1,1733 |
| 6 | 103 % | 23,61 % | 1,3175 |
| 9 | 108 % | 32,54 % | 1,4971 |
| 12 | 108 % | 39,36 % | 1,6712 |
| 18 | 108 % | 50,20 % | 2,0502 |

  - Más IVA 21 % sobre el costo financiero. "Las variaciones de estas tasas pueden realizarse con una antelación de 1 día hábil" (misma página). Hay promociones temporales que bonifican 3 cuotas ([Legales – promociones](https://www.payway.com.ar/legales-terminos-y-condiciones)).
- **Cuotas MiPyME** (se cobra a 10 días hábiles) y **otros planes** (hasta 50 cuotas, el interés lo paga el cliente al emisor: Cabal, Cencosud, CMR Falabella, BSF Carrefour, DATA2000) ([Cuotas – ayuda](https://ayuda.payway.com.ar/cobros/cuotas)).
- **Rubros sin cuotas:** 4784 peajes, 5542 combustibles, **5813 bares americanos/confitería**, 5814 fast food, 7932 pool/billares, 7995 juegos de azar (misma página).
- **Cuotas Payway viene activado por defecto** al adherirse ([TTCC, 3.9.4](https://www.payway.com.ar/legales)).

### 4.5 Cobro Anticipado (costo por cobrar antes)

- **Viene activado por defecto:** "Al confirmar su adhesión al Programa de Medios de Pago, el Establecimiento, acepta operar desde el inicio con: (i) el Servicio de Cobro Anticipado ... En caso de querer optar por cobrar en los plazos de pago tradicionales, deberá gestionar y solicitar la baja" ([TTCC, 3.9.4](https://www.payway.com.ar/legales)).
- Paga "en el plazo estándar de 24 horas hábiles bancarias", descontando una "tasa directa por día hábil anticipado (Tasa de Aceleración), sobre el monto, neto de arancel y costo financiero" ([TTCC, Sección IX C, puntos 1 y 3](https://www.payway.com.ar/legales)). La tasa "se encuentra publicada en https://www.payway.com.ar/anticipacion-pagos", pero esa página no muestra el número en texto ([Cobro Anticipado](https://www.payway.com.ar/anticipacion-pagos)). ⚠️ No confirmado el valor vigente. Única referencia: crédito a 1 día hábil por **6,30 % + IVA** con el anticipo incluido ([Planes y precios](https://www.payway.com.ar/planes-precios)).
- Se da de baja por establecimiento desde Mi Payway ([TTCC, IX C 8.1](https://www.payway.com.ar/legales)).

### 4.6 Ejemplo ilustrativo (supuestos, no es una cotización)

Entrada de $10.000, 1 pago, e-commerce, IVA 21 %, el 1 % online se **suma** al arancel máximo y sin Cobro Anticipado:

| Medio | Payway (máximo publicado) | MP Checkout a 10 días (ver [MP §5](./mercado-pago-split.md)) |
|---|---|---|
| Crédito | (3 % + 1 %) × 1,21 = **4,84 % → $484**, cobra a 8/10/18 días hábiles | 4,39 % × 1,21 = 5,31 % → $531, a 10 días corridos |
| Débito | (2 % + 1 %) × 1,21 = **3,63 % → $363**, cobra a 1 día hábil | mismo 5,31 % (MP no diferencia por medio en la tabla publicada) |

Con transacción distribuida, a eso se suma el costo que Payway le cobre a TicketJuy por su sub_payment (⚠️ No confirmado). No incluye retenciones ni percepciones de Ingresos Brutos de Jujuy.

---

## 5. Plazos de acreditación

### 5.1 Lo que publica Payway

Tabla de [Plazos de acreditación y aranceles](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones). Los plazos se cuentan "a partir de la fecha de presentación de las ventas":

| Medio | Modalidad | Plazo |
|---|---|---|
| Débito (todas las marcas) | 1 pago | **1 día hábil** |
| Crédito Visa / Mastercard / Cabal nacional | 1 pago | **5, 8, 10 o 18 días hábiles**, según la categoría BCRA |
| Crédito internacional | 1 pago | 18 días hábiles |
| Crédito nacional | Cuotas fijas | 2 días hábiles |
| Crédito nacional | Cuotas Payway | 1 día hábil |
| Crédito nacional | Cuotas MiPyME | 10 días hábiles |
| American Express | 1 pago / cuotas fijas / MiPyME | 9 / 3 / 10 días hábiles |
| Prepaga nacional / internacional | 1 pago | 2 / 18 días hábiles |
| Pago con transferencia (PCT) | 1 pago | Inmediato |

- **Presentación:** "Los cierres de lote de las ventas online se realizan de forma automática todos los días a las 0 h" ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)). Cuando el cierre se hace después de las 18 h, la presentación pasa al día hábil siguiente ([TTCC, Cuotas Payway / MiPyME](https://www.payway.com.ar/legales)).
- Con **Cobro Anticipado** se puede cobrar en 24 h hábiles: 1 pago con tarjetas nacionales, internacionales y prepagas, más cuotas. Aplica a Visa, Mastercard, Cabal, Amex y UnionPay ([Plazos – FAQ](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones)).
- **Destino:** cuenta bancaria en pesos del establecimiento ([Tarjetas – ayuda](https://ayuda.payway.com.ar/cobros/medios-de-pago/tarjetas)).

### 5.2 La regla del BCRA

[Com. "A" 8303, punto 7.2](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8303.pdf) (texto ordenado "Sistema Nacional de Pagos – Servicios de Pago", vigencia 20/08/2025):

- **Crédito y compra en 1 pago (máximo):** "i. 5 (cinco) días hábiles" para estaciones de servicio que sean micro o pequeña empresa o persona humana; "ii. 8 (ocho) días hábiles cuando revistan la condición de micro o pequeña empresa y/o son personas humanas"; "iii. 10 (diez) días hábiles para aquellos categorizados como medianas empresas y aquellos cuya actividad sea 'servicio de alojamiento, turismo, gastronomía y/o salud'"; "iv. 18 (dieciocho) días hábiles para los restantes casos". El plazo se cuenta "desde la fecha de realización del correspondiente consumo". Las entidades "no podrán cargar a los comercios adheridos interés ni comisión vinculado a los plazos de liquidación señalados".
- **Prepagas:** máximo 2 días hábiles (punto 7.2.2).
- **Subadquirentes:** máximo 1 día hábil desde que reciben los fondos. Quedan **excluidas** las "compras efectuadas a través de plataformas de comercio electrónico" (punto 7.2.2).
- **Débito:** hoy no hay un plazo máximo regulatorio. El BCRA informa que se eliminó el "maximum period of 3 business days for the crediting of funds to merchant accounts for purchases made using debit cards" ([BCRA – Financial Inclusion Report, 1st half 2025](https://www.bcra.gob.ar/en/publicaciones/financial-inclusion-report-first-half-of-2025/)). El 1 día hábil es la política de Payway.
- **Desactualizado en Payway:** [Planes y precios](https://www.payway.com.ar/planes-precios) y [Cobro Anticipado](https://www.payway.com.ar/anticipacion-pagos) citan la "Comunicación A 7153 del BCRA". La norma vigente consolidada es el texto ordenado actualizado por la A 8303, aunque el contenido de los plazos coincide.
- **Para Moon:** si está registrada como micro o pequeña empresa (registro MiPyME), le toca el plazo de 8 días hábiles. Si no está registrada, o si la encuadran como "gastronomía", podría caer en 10 o 18 días. Payway lo dice explícitamente: "Si sos PYME y no estás registrado/a, inscribite" ([Plazos](https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones)). ⚠️ No confirmado en qué categoría cae un boliche.

---

## 6. Devoluciones, anulaciones y contracargos

### 6.1 Devoluciones y anulaciones

- **API:** hay anulación o devolución total, anulación de devolución total, devolución parcial y anulación de devolución parcial ([SDK Java – Devoluciones](https://github.com/payway-ar/sdk-java-ventaonline#refunds)). El campo `amount` funciona así: "Si se completa el campo antes del cierre por un monto menor al de la compra se toma como devolucion parcial. Si se ingresa el monto total o no se envia dicho campo se toma como anulacion" ([SDK Java – Parámetros de Devolución](https://github.com/payway-ar/sdk-java-ventaonline#parametrosDevolucion)).
- **Anulación vs devolución:** se anula si todavía no hubo cierre de lote y se devuelve si ya lo hubo. "Todas las Devoluciones que se realicen no podrán superar el monto original de la transacción" ([TTCC, sección débito](https://www.payway.com.ar/legales)). Online, el cierre es automático a las 0 h ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)). En la práctica, se anula en el mismo día y se devuelve desde el día siguiente.
- **Desde el panel:** Mi Payway > ventas online > transacciones > "devolver" ([Cómo cobrar online](https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online)).
- **Visa Débito no admite devoluciones parciales** en e-commerce ([SDK Java](https://github.com/payway-ar/sdk-java-ventaonline#codigos-de-medios-de-pago)).
- **Arancel e IVA:** "En caso de Contracargo y/o devolución de un Ticket después de su pago, la Administradora reintegrará proporcionalmente, de corresponder, los montos cobrados en concepto del impuesto del Arancel. La Administradora tendrá la potestad de realizar el débito de la devolución en un plazo variable de hasta 18 días hábiles" ([TTCC, 3.9.8](https://www.payway.com.ar/legales)).
- **Sin saldo:** el establecimiento autoriza a debitar "aun en descubierto" la cuenta bancaria informada ([TTCC, 3.12](https://www.payway.com.ar/legales)). A diferencia de MP, una devolución no queda bloqueada por falta de saldo: Payway la descuenta de liquidaciones futuras o la debita de la cuenta.
- **Fraude:** si el comercio detecta una venta sospechosa y no entrega, tiene que devolver "en un plazo no mayor a 48 hs." ([TTCC, 3.11](https://www.payway.com.ar/legales)).

### 6.2 Contracargos

- "Los contracargos son débitos de operaciones que ya cobraste ... el contracargo surge por un reclamo del titular de la tarjeta". Hay dos tipos: desconocimiento y error del proceso ([Contracargos – ayuda](https://ayuda.payway.com.ar/cobros/contracargos)).
- **Plazo para reclamar:** "15 días corridos desde la fecha de liquidación de los contracargos" para Visa y Mastercard (misma página). Los TTCC dicen 15 días corridos para todas las marcas y 7 para Amex OptBlue ([TTCC, 3.9.5](https://www.payway.com.ar/legales)). El reclamo se hace por teléfono con atención al cliente, presentando factura, detalle, comprador y receptor ([Contracargos – ayuda](https://ayuda.payway.com.ar/cobros/contracargos)).
- La documentación "no garantiza que el Contracargo aplicado oportunamente pueda ser reversado" ([TTCC, 3.11](https://www.payway.com.ar/legales)). Con más de 1 % de contracargos durante 2 meses hay multas, y desde el 6.º mes pueden dar de baja el establecimiento ([TTCC, 3.19](https://www.payway.com.ar/legales)).
- **Para entradas:** la vertical **Ticketing** de Cybersource agrega datos antifraude específicos ([SDK Java – Ticketing](https://github.com/payway-ar/sdk-java-ventaonline#ticketing)). Conviene usarla, junto con 3DS (`cardholder_auth_required`) ([SDK Java – 3DS](https://github.com/payway-ar/sdk-java-ventaonline#payment-simple-3ds)).

### 6.3 Efecto sobre una transacción distribuida

- Para la devolución parcial de una distribuida, el SDK indica cargar `sub_payments` en el pedido ("Llenar en caso de solicitar devolucion parcial en transaccion distribuida"), y el monto "se debe distribuir sobre los subpayments" ([SDK Java – Devolución parcial](https://github.com/payway-ar/sdk-java-ventaonline#partialrefund); [Parámetros de Devolución](https://github.com/payway-ar/sdk-java-ventaonline#parametrosDevolucion)). O sea, **el integrador elige cuánto devuelve cada sub-site**. Eso es más flexible que el reparto proporcional obligatorio de MP.
- ⚠️ No confirmado: en una devolución **total** de una distribuida, si cada sub-site devuelve su parte completa (incluida la comisión de TicketJuy).
- ⚠️ No confirmado: en un **contracargo** sobre una distribuida, si se debita a cada sub-site lo suyo o todo a uno. Como cada sub_payment tiene su propia autorización y su propio `ticket`, lo esperable es que el contracargo caiga por sub_payment.
- En el modelo **agregador**, el agregador responde por todos los contracargos de sus vendedores ([Anexo Agregador, 2.7](https://www.payway.com.ar/sites/default/files/2025-08/Anexo+Agrupador+2025.pdf)).

---

## 7. Webhooks / notificaciones y seguridad (PCI, tokenización)

### 7.1 Notificaciones

- **No se encontraron webhooks documentados** en los README de los SDK oficiales (Java, .NET, Node, PHP, JS). La palabra "webhook" no aparece, y "notificación" tampoco como mecanismo push ([SDK Java](https://github.com/payway-ar/sdk-java-ventaonline); [SDK .NET](https://github.com/payway-ar/sdk-net-ventaonline)).
- Lo que sí hay:
  - El **pago por API es sincrónico**: la respuesta trae `status` (`approved`, etc.) ([SDK .NET – respuesta](https://github.com/payway-ar/sdk-net-ventaonline)).
  - Se puede consultar con **Información de un pago** y **Listado de pagos** ([SDK Java – índice](https://github.com/payway-ar/sdk-java-ventaonline)).
  - En el **formulario hospedado** se usa `success_url`, `cancel_url` y `redirect_url`, que es la "Url en la cual se enviaran los datos de la operación una vez finalizada la misma para que el comercio pueda capturarlos" ([SDK .NET – Formulario](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)). ⚠️ No confirmado si ese envío va firmado.
  - El comercio tiene que mandarle al comprador un email con la operación autorizada ([TTCC, 5.11](https://www.payway.com.ar/legales)), y Payway puede mandar información del pago al `customer.email` ([SDK .NET](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)).
- **Idempotencia:** el `site_transaction_id` es el "ID de transaccion asignada por el comercio, no puede repetirse" ([SDK Java – distribuida](https://github.com/payway-ar/sdk-java-ventaonline#distributed)). Conviene usar el ID de la orden de TicketJuy.
- **Timeout:** los ejemplos del SDK usan 10 s (`int timeout = 10`) ([SDK Java – Ambientes](https://github.com/payway-ar/sdk-java-ventaonline#environments)). ⚠️ No confirmado cuál es el timeout recomendado en producción.
- **Diseño recomendado** (propio, no viene de Payway): emitir la entrada solo con `status=approved` en la respuesta sincrónica, y tener un job de conciliación que consulte los pagos `pending` o los que fallaron por timeout.

### 7.2 PCI y tokenización

- **Tokenización en el frontend (recomendado):** el SDK JS toma los datos de la tarjeta (PAN, vencimiento, CVV, titular, documento) con la *public key* y devuelve un token. El backend nunca ve el PAN ([SDK JavaScript](https://github.com/payway-ar/sdk-javascript-ventaonline)). La alternativa es el **formulario hospedado** de Payway ([SDK .NET – Formulario](https://github.com/payway-ar/sdk-net-ventaonline#getvalidateform)).
- **"Transacción PCI"** (el backend manda los datos de la tarjeta directo) también existe ([SDK Java – PCI](https://github.com/payway-ar/sdk-java-ventaonline#pci)), pero obliga a TicketJuy a tener cumplimiento PCI DSS completo. **No usarla.**
- **Tarjetas guardadas:** Payway genera un token en su backend para que la próxima compra pida solo el CVV ([SDK Java – Tokenización](https://github.com/payway-ar/sdk-java-ventaonline#tokenizaciontarjeta)).
- **Obligaciones del establecimiento:** "declara y garantiza en carácter de declaración jurada que conoce y cumple con la totalidad de las Normas de Seguridad de Datos de la Industria de Tarjetas de Pago (PCI)" ([TTCC, 3.21.2 y 5.9](https://www.payway.com.ar/legales)). Está "prohibido el almacenamiento ... fecha de vencimiento y código de seguridad". En Tarjeta No Presente, el número de tarjeta se puede guardar "hasta 60 días corridos" ([TTCC, 3.8.6](https://www.payway.com.ar/legales)). Los proveedores de plataforma (CSP) del establecimiento pueden acceder a esos datos solo si están "autorizados por la Administradora" (misma cláusula), y las plataformas tienen que estar en el listado de sistemas autorizados ([TTCC, 5.8](https://www.payway.com.ar/legales)).
- **Para TicketJuy como plataforma:** ⚠️ No confirmado si Payway exige que TicketJuy se registre como CSP o proveedor autorizado para integrar en nombre de varios boliches, y qué cuestionario PCI (SAQ A o A-EP) acepta. Los SDK permiten informar `grouper` ("partner que esté consumiendo el servicio") y `developer` ("desarrollador que cobra por transacción/otro") en cada llamada ([SDK Java – Ambientes](https://github.com/payway-ar/sdk-java-ventaonline#environments)). Esos campos están pensados justamente para identificar a una plataforma como TicketJuy.
- **Antifraude:** Cybersource (con vertical Ticketing) y 3DS ([SDK Java](https://github.com/payway-ar/sdk-java-ventaonline#cybersource)). Payway destaca "medidas antifraude y cumplimiento de normas PCI Compliance" ([Vender online](https://www.payway.com.ar/vender-online)).

---

## 8. Comparación Payway vs Mercado Pago Split para TicketJuy

El lado MP sale de [mercado-pago-split.md](./mercado-pago-split.md).

| Criterio | **Payway – transacción distribuida** | **Payway – establecimiento simple** | **Mercado Pago – Split 1:1** |
|---|---|---|---|
| ¿Quién recibe la plata? | Cada sub-site (boliche y TicketJuy) en su cuenta bancaria (⚠️ deducido de la respuesta de la API) | El boliche, completo, en su cuenta bancaria ([TTCC 3.9.2](https://www.payway.com.ar/legales)) | El boliche en su **cuenta MP**. TicketJuy recibe la `marketplace_fee` en la suya |
| Comisión de la plataforma | **Automática** con un `sub_payment` hacia el site de TicketJuy (por monto en cada pago, o porcentaje fijo configurado por Payway) | **No automática**: TicketJuy factura aparte | **Automática** con `marketplace_fee` (monto en pesos) |
| ¿TicketJuy tiene que ser cliente del procesador? | Sí: site padre y establecimiento Payway propio | No | Sí: cuenta MP con KYC nivel 6 y una app marketplace |
| ¿La plata pasa por TicketJuy? | No | No | No |
| Medios de pago | Crédito y prepaga confirmados (ejemplo con Visa). ⚠️ Débito, offline y QR sin confirmar en la distribuida | Crédito, débito, prepaga, cuotas, Rapipago/Pago Fácil/PMC (offline). QR/MODO/transferencias sobre todo presencial | ⚠️ Ambiguo: "sólo ... dinero en cuenta entre cuentas de Mercado Pago". No hay transferencias externas ni cuotas sin tarjeta |
| Cuotas | Sí, `installments` por sub_payment. ⚠️ **No para el rubro 5813** | Ídem | Con tarjeta, sí. Sin tarjeta (Mercado Crédito), no |
| Costo para el boliche (1 pago) | Hasta 1 % + arancel e-commerce (débito 2 %, crédito 3 %) + IVA → **≈ 3,63 % débito / 4,84 % crédito** (⚠️ falta confirmar si se suman). ⚠️ Costo extra de la distribuida sin confirmar | Igual | **6,29 % al instante / 4,39 % a 10 días / 3,39 % a 18 / 1,49 % a 35, todo + IVA** (sin distinguir medio) |
| Costo para TicketJuy | ⚠️ Probablemente el arancel sobre su sub_payment | Ninguno con Payway | ⚠️ No confirmado si MP le cobra algo sobre la fee |
| Plazo de acreditación | Débito 1 día hábil. Crédito 8/10/18 días hábiles (regla BCRA), o 24 h hábiles con Cobro Anticipado (pago, y **activado por defecto**) | Igual | Lo elige el vendedor: al instante, 10, 18 o 35 días corridos. El plazo de la fee no está documentado |
| Devoluciones | Total o parcial por API. En la parcial, **el integrador reparte entre sub-sites**. Se puede debitar en descubierto. Visa Débito sin parcial | Total o parcial | Proporcional automática. **Sin saldo del boliche no se puede devolver todo**. 180 días |
| Contracargos | ⚠️ Probablemente por sub_payment. 15 días corridos para reclamar | 15 días corridos | Retención en la cuenta del vendedor. ⚠️ Efecto sobre la fee sin confirmar |
| Webhooks | ⚠️ No documentados. Pago sincrónico + consulta | Ídem | Sí, con firma HMAC (`x-signature`), reintentos y varios tópicos |
| Onboarding del boliche | **Difícil:** adherir a Payway (CUIT, cuenta bancaria en el acreditador, rubro), pedir venta online, que Payway cree el site y lo **vincule al site padre** de TicketJuy, autorización de preventa | **Medio:** adhesión online y número de establecimiento por email. TicketJuy necesita las API keys del boliche (las da soporte de Payway) | **Fácil:** OAuth de un clic desde el panel de TicketJuy (token de 180 días con renovación) |
| Onboarding de TicketJuy | Negociación comercial con Payway (site padre, configuración en SAC) | Ninguno (integración por boliche) | App marketplace + KYC 6 |
| Riesgo regulatorio para TicketJuy | Bajo (⚠️ a confirmar) | Bajo | Bajo |

**Lectura rápida:** Payway gana en **costo** (sobre todo en débito) y en que la plata va **directo al banco**. MP gana en **onboarding**, **webhooks**, **autoservicio** y en que la comisión de TicketJuy no paga arancel de tarjeta. Para un MVP con un solo boliche y un equipo chico, MP tiene menos fricción. Payway conviene como segunda opción para boliches que ya trabajan con Payway, o si el costo de MP espanta a los clientes.

---

## Puntos no confirmados (consolidado)

1. ⚠️ Quién puede usar las **transacciones distribuidas**, qué pide Payway para crear el site padre y vincular sub-sites, y si cada sub-site tiene que ser un establecimiento con CUIT propio.
2. ⚠️ Que cada sub_payment se **liquide en la cuenta bancaria de su sub-site** (se deduce de la respuesta de la API, pero no está escrito).
3. ⚠️ Cuánto cobra Payway por una transacción distribuida, y si TicketJuy paga arancel de tarjeta sobre su sub_payment.
4. ⚠️ Qué medios de pago admite una distribuida: débito, prepaga, offline, QR/MODO.
5. ⚠️ Si el **1 % + IVA de venta online** se suma al arancel máximo e-commerce (2 % / 3 %) o ya está adentro. Además, las páginas oficiales publican aranceles distintos entre sí.
6. ⚠️ El valor vigente de la **Tasa de Aceleración** de Cobro Anticipado para venta online.
7. ⚠️ El **rubro (MCC)** con el que se da de alta la venta de entradas de un boliche, y si permite cuotas (el 5813 no las permite).
8. ⚠️ La **autorización para presentar ventas antes de prestar el servicio** (preventa de entradas, TTCC 3.8.5).
9. ⚠️ La categoría BCRA de un boliche para el plazo de crédito: 8, 10 ("gastronomía") o 18 días hábiles.
10. ⚠️ Si existen **webhooks** o notificaciones push en la API actual, y si el `redirect_url` del formulario va firmado.
11. ⚠️ Si TicketJuy tiene que registrarse como **CSP o proveedor autorizado**, y qué SAQ PCI acepta Payway con tokenización por SDK JS.
12. ⚠️ El efecto de **devoluciones totales y contracargos** sobre cada sub_payment de una distribuida.
13. ⚠️ Si la cuenta de acreditación puede ser una **CVU** o tiene que ser bancaria con CBU, y la documentación exacta que piden en la adhesión.
14. ⚠️ Si QR / MODO / transferencias (PCT) se pueden usar en el **checkout online por API**.
15. ⚠️ Si el servicio "LAPOS WEB" (precio mensual en los TTCC 5.19) aplica a la integración por API.

## Preguntas para el equipo comercial de Payway (Ventas Online)

Contacto de implementaciones: integraciones-ventasonline@payway.com.ar, +54 11 4379 3460 ([SDK Java – Soporte](https://github.com/payway-ar/sdk-java-ventaonline#Soporte)). Para ser cliente: 0810 333 0066 ([Vender online](https://www.payway.com.ar/vender-online)).

1. Somos una plataforma de venta de entradas para varios boliches. ¿Podemos tener un **site padre (TicketJuy) con un sub-site por boliche** usando **transacciones distribuidas por monto**, donde cada pago se reparte entre el boliche y un site de TicketJuy por la comisión? ¿Qué requisitos y contrato hacen falta?
2. ¿Cada sub-site cobra en **su propia cuenta bancaria** y con su propio número de establecimiento? ¿Un boliche que ya es cliente Payway (presencial) puede sumar un site online vinculado a nuestro site padre? ¿Cuánto tarda el alta de un sub-site?
3. ¿Qué costo tiene la distribuida? ¿Cada sub-site paga el arancel sobre su parte? ¿TicketJuy paga arancel de tarjeta sobre su comisión? ¿Hay un costo fijo o mensual por site?
4. ¿El **1 % + IVA de venta online** se suma al arancel máximo e-commerce (débito 2 %, crédito 3 %)? ¿Qué aranceles reales corresponden a un comercio de Jujuy, según condición fiscal? ¿Qué retenciones o percepciones aplican?
5. ¿Qué medios acepta una distribuida: débito, prepaga, Amex, cuotas, Rapipago/Pago Fácil, QR/MODO, transferencias?
6. ¿Con qué **rubro/MCC** se dan de alta las ventas de entradas de un boliche? ¿Se habilitan cuotas para ese rubro?
7. ¿Cómo se pide la **autorización para presentar ventas antes de prestar el servicio** (TTCC 3.8.5) en el caso de entradas para eventos futuros?
8. **Cobro Anticipado:** ¿cuál es la tasa de aceleración vigente para venta online? ¿Se puede dar de baja desde el alta? ¿Aplica igual a los sub-sites de una distribuida?
9. ¿Hay **webhooks** o notificaciones de cambios de estado: aprobación, devolución, contracargo? ¿Cómo se firman? Si no hay, ¿qué consulta recomiendan para conciliar?
10. En una distribuida, ¿cómo funcionan la **devolución total** y los **contracargos**? ¿Se debita a cada sub-site su parte? ¿Quién presenta la documentación?
11. ¿TicketJuy tiene que registrarse como **CSP / proveedor autorizado** (TTCC 5.8)? ¿Qué nivel de cumplimiento **PCI** exigen si usamos el SDK JS o el formulario hospedado y nunca tocamos el PAN? ¿Para qué se usan los campos `grouper` y `developer`?
12. ¿La cuenta de acreditación puede ser una CVU o tiene que ser una cuenta bancaria? ¿Qué documentación piden en la adhesión (persona jurídica vs monotributista)?
13. ¿Las API keys de cada boliche las entrega soporte por boliche? ¿Hay una forma de que el boliche **autorice a la plataforma** sin compartir su private key, como un OAuth?
14. ¿La documentación de `documentacion-ventasonline.payway.com.ar` tiene una sección de transacciones distribuidas más completa que los README de los SDK? ¿Nos pueden dar acceso al portal de desarrolladores y al sandbox con sites distribuidos de prueba?

---

## Fuentes consultadas (2026-11-17)

**Payway – sitio comercial y ayuda**
- Vender online: https://www.payway.com.ar/vender-online
- Planes y precios: https://www.payway.com.ar/planes-precios
- Cobrar con QR: https://www.payway.com.ar/cobrar-con-qr
- Link de pago: https://www.payway.com.ar/cobrar-con-link-de-pago
- Cobro Anticipado: https://www.payway.com.ar/anticipacion-pagos
- Mi Payway: https://www.payway.com.ar/cuenta-payway
- Términos y condiciones (TTCC) del Programa de Medios de Pago: https://www.payway.com.ar/legales
- Legales – promociones: https://www.payway.com.ar/legales-terminos-y-condiciones
- Anexo TTCC para Agregador (2025): https://www.payway.com.ar/sites/default/files/2025-08/Anexo+Agrupador+2025.pdf
- Ayuda – Cómo cobrar online: https://ayuda.payway.com.ar/cobros/medios-de-pago/venta-online
- Ayuda – Plazos de acreditación y aranceles: https://ayuda.payway.com.ar/cobros/plazos-acreditacion-y-comisiones
- Ayuda – Tarjetas: https://ayuda.payway.com.ar/cobros/medios-de-pago/tarjetas
- Ayuda – Link de pago: https://ayuda.payway.com.ar/cobros/medios-de-pago/link-de-pago
- Ayuda – Cuotas: https://ayuda.payway.com.ar/cobros/cuotas
- Ayuda – Cuotas Payway: https://ayuda.payway.com.ar/cobros/cuotas/cuotas-payway
- Ayuda – Contracargos: https://ayuda.payway.com.ar/cobros/contracargos
- Ayuda – Perfiles de Mi Payway: https://ayuda.payway.com.ar/cuenta-payway/perfiles

**Payway – documentación técnica (SDK oficiales en GitHub, org `payway-ar`)**
- SDK Java: https://github.com/payway-ar/sdk-java-ventaonline
- SDK .NET: https://github.com/payway-ar/sdk-net-ventaonline
- SDK PHP: https://github.com/payway-ar/sdk-php-ventaonline
- SDK Node: https://github.com/payway-ar/sdk-node-ventaonline
- SDK JavaScript (frontend / tokenización): https://github.com/payway-ar/sdk-javascript-ventaonline
- No legibles de forma automática (hay que revisarlos a mano): https://documentacion-ventasonline.payway.com.ar/ · https://developers-ventasonline.payway.com.ar/portal/login · https://developers.decidir.com/ (403)

**Regulatorio**
- BCRA Com. "A" 8303 (texto ordenado SNP – Servicios de Pago: tasas de intercambio y plazos de acreditación): https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8303.pdf
- BCRA – Financial Inclusion Report, first half of 2025 (eliminación de topes de arancel y del plazo de débito): https://www.bcra.gob.ar/en/publicaciones/financial-inclusion-report-first-half-of-2025/
- Ley 25.065, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-25065-55556/actualizacion
- DNU 70/2023 – Boletín Oficial: https://www.boletinoficial.gob.ar/detalleAviso/primera/301122/20231221

**Mercado Pago (lado MP de la comparación)**
- [mercado-pago-split.md](./mercado-pago-split.md)
