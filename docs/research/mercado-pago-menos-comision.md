# Cómo pagarle menos comisión a Mercado Pago

> **Fecha de consulta:** 2026-11-17. Complementa [mercado-pago-split.md](./mercado-pago-split.md) y [comparacion-cobro.md](./comparacion-cobro.md).
>
> Lo marcado con **⚠️** no está confirmado. Las tasas cambian seguido y varían por provincia.

---

## Resumen

La comisión no se puede eliminar del todo por una vía prolija, pero se puede bajar mucho. La tarifa de MP **no depende de que el pago sea online**. Depende del **producto** que se use (Checkout o QR), del **medio de pago** del comprador y del **plazo** en que se libera la plata.

| Vía | Comisión MP (+IVA) | Sobre $10.000 | Split automático | Estado |
|---|---|---|---|---|
| Checkout Pro al instante (plan actual) | 6,29 % | ≈ $761 | ✅ | Plan de la hoja de ruta |
| Checkout Pro a 35 días | 1,49 % | ≈ $180 | ✅ | Disponible, pero Moon cobra tarde |
| **QR dinámico, dinero en cuenta o transferencia** | **0,8 %** | **≈ $97** | ✅ `marketplace_fee` ⚠️ | **A probar en sandbox** |
| QR dinámico, débito | 1,35 % al instante / 0,85 % a 2 días | ≈ $163 / $103 | ✅ ⚠️ | A probar |
| QR dinámico, crédito | 5,99 % al instante / 4,19 % a 10 días | ≈ $725 / $507 | ✅ ⚠️ | No conviene empujarlo |
| Transferencia a un CVU por orden (Talo u otro), pagada desde MP | 0,8–1 % (del proveedor, no de MP) | ≈ $97–121 | ❌ Hay que separar la comisión aparte | Alternativa sin MP de por medio |
| Transferencia manual al alias del boliche | 0 % | $0 | ❌ | **Descartada** (ver abajo) |

**Recomendación:** que el **QR dinámico con `marketplace_fee`** sea el medio principal (dinero en cuenta y transferencia), y dejar **Checkout Pro como respaldo** para quien pague con tarjeta. Si funciona como dice la documentación, la comisión de MP baja de ≈ 7,6 % a ≈ 1 % para la mayoría de las compras, Moon cobra al instante y el split sigue siendo automático.

---

## 1. QR dinámico con split (la mejor opción)

**Qué es:** la API de Orders de MP crea una orden `type: "qr"` por compra y devuelve un `qr_data` que mostramos en pantalla. El comprador lo escanea con MP o con cualquier billetera o banco, porque el QR es interoperable (Transferencias 3.0).

**Por qué es más barato:** MP publica para cobros con QR **0,8 % + IVA al instante con dinero en cuenta** (de MP, otras billeteras o bancos), contra 6,29 % del Checkout online ([Cobrar con QR](https://www.mercadopago.com.ar/herramientas-para-vender/cobrar-con-qr), [Checkout](https://www.mercadopago.com.ar/herramientas-para-vender/check-out)). Además, el BCRA fija un tope de 0,8 % para la comisión que pagan los comercios por pagos con transferencia y QR ([El Economista](https://eleconomista.com.ar/economia/transferencias-30-claves-entender-nuevo-sistema-pagos-digitales-n48337)).

**Split:** la referencia de *Create order (QR Code)* acepta `marketplace_fee` en órdenes QR. El único error documentado es `marketplace_fee_not_allowed` cuando no se encuentra el marketplace a partir del token, así que funciona con el token OAuth del boliche, igual que Checkout Pro ([Create order](https://www.mercadopago.com.ar/developers/en/reference/in-person-payments/qr-code/orders/create-order/post)). Sirve la misma app marketplace y la misma conexión del boliche que ya están en la hoja de ruta.

**Detalles técnicos:**
- Hace falta crear una sucursal (*store*) y una caja (*POS*) por boliche, con `external_pos_id`.
- `expiration_time` en formato ISO 8601 (el ejemplo usa `PT16M`), que viene bien para reservar el cupo mientras se paga.
- `X-Idempotency-Key` obligatorio y `external_reference` con nuestro id de orden.
- Los endpoints viejos `/instore/...` están deprecados: hay que usar la API de Orders.

**Problemas a resolver:**
1. ⚠️ **El celular no puede escanear su propia pantalla.** La mayoría compra desde el celular. En compu se muestra el QR. En el celular hay que ver si existe un deep link para abrir la app de MP con el `qr_data`, o si alcanza con copiar el código. Hay que probarlo antes de comprometernos.
2. ⚠️ **Uso fuera de lo previsto.** MP presenta el QR como cobro presencial en el punto de venta. No encontré nada que prohíba usarlo en una web, pero tampoco que lo permita. Si MP lo considera uso indebido, podría recategorizar la tasa o bloquear la integración. **Hay que preguntarlo por escrito.**
3. ⚠️ **No sabemos si la tasa QR se aplica con el split.** Hay que confirmarlo en sandbox mirando `fee_details`.
4. Con tarjeta de crédito, el QR sale casi igual que el Checkout (5,99 %), así que el ahorro viene solo de que el comprador pague con saldo, transferencia o débito.

---

## 2. Ajustar el Checkout Pro que ya está planeado

Sirve para quien pague con tarjeta, aunque el QR funcione.

- **Plazo de liberación:** 10 días (4,39 %), 18 días (3,39 %) o 35 días (1,49 %). Como las entradas se venden antes del evento, Moon podría elegir 10 o 18 días en la preventa y cobrar igual antes o cerca de la fecha. Con preventas largas, hasta 35 días puede servir.
- **Pasarle el costo al comprador:** el cargo de servicio en modo `buyer` (ya modelado en `mock-data.ts`) cubre la comisión de MP sobre el total. No ahorra plata, pero el boliche recibe el 100 %.
- **Incentivar el medio barato:** mostrar primero "Pagar con QR o transferencia", o un precio menor con ese medio. ⚠️ La Ley de Tarjetas de Crédito (25.065) prohíbe cobrar recargo por pagar con tarjeta. Un descuento por transferencia es la práctica habitual, pero hay que consultarlo con un contador o abogado.
- ⚠️ En Checkout Pro, limitar los medios a `account_money` **no baja la tasa**: la tabla online es por plazo, no por medio de pago.

---

## 3. CVU por orden con un tercero (Talo u otro)

El comprador paga por transferencia desde MP (o cualquier banco) a un CVU único por orden, y un webhook confirma el pago. Talo declara 0,8–1 % + IVA, acreditación inmediata y sin contracargos, con un CVU que vence a los ≈ 5 días ([Payments API](https://docs.talo.com.ar/transfers/payments-api), [precios según Talo](https://talo.com.ar/blogs/alternativas-mercado-pago)).

- Tiene el mismo costo que el QR, pero **no separa nuestra comisión sola**: o la plata entra a TicketJuy (rompe "la plata no pasa por nosotros" y suma riesgo fiscal y legal), o le facturamos al boliche aparte.
- ⚠️ Los datos son de Talo. No verifiqué su registro como PSP ante el BCRA.
- Tiene sentido como opción de fase 2 detrás de `PaymentProvider`, si el QR de MP no funciona en celulares.

---

## 4. Lo que descartamos

**Que el comprador le transfiera al alias del boliche y nosotros lo confirmemos a mano (o leyendo movimientos).** Es la forma de pagar 0 %, pero:
- Recibir transferencias no tiene costo para MP ([Talo, citando la ayuda de MP](https://talo.com.ar/blogs/mercado-pago-cobra-por-transferencia)), y por eso MP vigila el uso comercial de cuentas personales. Puede limitar o cerrar la cuenta.
- No hay split ni webhook confiable de transferencias entrantes en una cuenta común, así que la conciliación es manual y propensa a errores (montos repetidos, comprobantes falsos).
- Igual hay que declarar los ingresos ante ARCA: lo que no se paga de comisión se paga de riesgo.
- La entrada no se puede emitir al instante, y eso rompe el recorrido de compra.

---

## 5. Otras plataformas y caminos evaluados (2026-11-17)

**Con dinero en cuenta, el piso es ≈ 0,6–0,8 % + IVA para todos**, porque el BCRA fija el tope para pagos con transferencia y QR. Ninguna plataforma lo baja de manera significativa, y **solo MP tiene split automático**. Tasas según el comparador [LupaPago](https://lupapago.com/) ⚠️:

| Plataforma | QR / dinero en cuenta | Comentario |
|---|---|---|
| Personal Pay Mi Negocio, GOAT | 0,6 % + IVA | Lo más barato. Sin split. Ahorraría ≈ $24 por entrada de $10.000 a cambio de facturarle a Moon aparte: no compensa |
| Cuenta DNI Comercios | 0,6 % final | Solo comercios de la provincia de Buenos Aires |
| Ualá Bis, Naranja X, Getnet, Payway, Fiserv/Clover, Nave, Openpay | 0,8 % + IVA | Igual que MP, sin split |
| **MODO** | 0 % extra (se paga lo del adquirente) | Interesante para el celular: su botón online abriría la app del banco en el mismo dispositivo ⚠️. Pendiente investigar |
| **Rebill** | **1,6 % + IVA** (tarjetas 4 % + IVA) | Capa sobre los procesadores, pensada para suscripciones. Con dinero en cuenta cuesta el doble que MP, y el split se negocia aparte ([ficha](https://lupapago.com/fichas/rebill/)) |
| Payway | 0,8 % por QR presencial | Más barato con tarjeta, pero no está confirmado el QR online por API, el split se negocia y no hay webhooks documentados ([payway.md](./payway.md)) |

**Cripto (Belo, Twin, stablecoins):**
- **Cobrar por QR, pasar a stablecoin y volver a pesos no ahorra nada:** la comisión del QR en pesos es el piso, y cada conversión suma un spread (≈ 0,5–2 % por tramo). Además, si TicketJuy hace la conversión o el reparto, pasa a ser PSAV ([rampas-web3.md](./rampas-web3.md)).
- **Twin Finance** emite stablecoins latinoamericanas (ARGt). La CNV frenó ARGt el 12/03/2026 por ofrecerlo con un 32 % anual garantizado ([Digital Assets Hub](https://digitalassetshub.la/noticias/argentina-cese-stablecoin-argt/)). No tiene producto de cobro para comercios: descartado.
- **Belo** (PSAV, CVU propio) no tiene producto de cobro para comercios. Sus usuarios ya pueden pagar nuestro QR de MP sin que integremos nada. Podría servir para la tesorería propia de TicketJuy (pasar nuestra comisión a dólares), a ver con un contador.

**Decisión:** Mercado Pago, con QR o dinero en cuenta y split. Payway queda para una fase 2 detrás de una interfaz `PaymentProvider`, si Moon ya trabaja con Payway o si en el piloto la proporción de pagos con tarjeta es alta.

---

## Qué hacer

1. **Sandbox:** crear una orden QR con `marketplace_fee` usando el token OAuth de una cuenta de prueba, pagarla con dinero en cuenta, débito y crédito, y revisar `fee_details`, cuánto le llega a cada parte y el webhook.
2. **Celular:** probar si el `qr_data` abre la app de MP desde el mismo celular (deep link) o si hay que mostrar "abrí esta página en la compu".
3. **Preguntar a MP por escrito:**
   - ¿Se puede usar la API de Orders QR en una venta online de entradas?
   - ¿Qué tasa se aplica a una orden QR con `marketplace_fee`?
   - ¿Hay tasa preferencial de Checkout por volumen o por rubro?
4. **Moon:** qué plazo de cobro le sirve (al instante, 10 o 18 días) y si acepta mostrar primero el pago por QR o transferencia.
5. **Contador:** si se puede ofrecer descuento por pagar con transferencia.
