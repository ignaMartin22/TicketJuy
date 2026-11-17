# Cómo cobramos las entradas: Mercado Pago vs Payway vs cripto

> **Fecha:** 2026-11-17. Resume y compara las tres investigaciones:
> - [mercado-pago-split.md](./mercado-pago-split.md): Mercado Pago Split de Pagos 1:1.
> - [payway.md](./payway.md): Payway (transacciones distribuidas o establecimiento simple).
> - [rampas-web3.md](./rampas-web3.md): cripto con una rampa de pesos tokenizados (Settle/Latamex en Stellar, Ripio wARS).
>
> Las fuentes de cada dato están en esos documentos. Lo marcado con **⚠️** no está confirmado.

---

## Veredicto

**La opción más sólida para Moon es Mercado Pago Split.** Es la única que hoy se puede contratar en autoservicio y separa nuestra comisión sola. Además, no nos agrega ningún riesgo legal, y los compradores ya la usan.

- **Payway** es la segunda opción. Sale más barata con tarjeta y la plata va directo al banco del boliche, pero el split depende de una negociación comercial con Payway y no tiene webhooks documentados. Conviene para boliches que ya trabajan con Payway, en una fase 2.
- **Cripto** es la más barata y la más rápida en los papeles, pero **hoy no se puede contratar**: ninguna rampa registrada ofrece cobro para comercios, y hacerlo nosotros nos obliga a registrarnos como PSAV. Queda en pausa.

---

## Números para una entrada de $10.000

Supuestos: un pago, IVA 21 %, comisión de TicketJuy del 5 % ($500), sin retenciones ni Ingresos Brutos de Jujuy.

| | Mercado Pago a 10 días | Mercado Pago al instante | Payway débito | Payway crédito | Cripto (Settle) ⚠️ |
|---|---|---|---|---|---|
| Comisión del procesador | 4,39 % + IVA ≈ **$531** | 6,29 % + IVA ≈ **$761** | hasta (2 % + 1 %) + IVA ≈ **$363** ⚠️ | hasta (3 % + 1 %) + IVA ≈ **$484** ⚠️ | **$0** según su API pública |
| TicketJuy | $500 | $500 | $500 (+ costo de su sub-pago ⚠️) | $500 (+ costo de su sub-pago ⚠️) | $500 |
| **Le llega a Moon** | **≈ $8.969** | **≈ $8.739** | **≈ $9.137** | **≈ $9.016** | **≈ $9.500** |
| Cuándo cobra Moon | 10 días corridos | Al instante | 1 día hábil | 8 a 18 días hábiles | Al instante |

- En Mercado Pago, la comisión se calcula sobre el total ⚠️, y la tasa real para Jujuy puede variar.
- En Payway, falta confirmar si el 1 % online se suma al arancel o ya está adentro. Además, el Cobro Anticipado viene activado por defecto y lleva el crédito a ≈ 6,30 % + IVA.
- En cripto no hay precio publicado para comercios. Con Anclap serían ≈ 1 % + 2 % (≈ $300).

---

## Comparación completa

| Criterio | **Mercado Pago Split** | **Payway** | **Cripto (rampa + Stellar)** |
|---|---|---|---|
| **¿Se puede contratar hoy?** | ✅ Sí, en autoservicio | 🟡 Sí, pero el split requiere negociar con Payway | ❌ No: ninguna rampa registrada ofrece cobro para comercios |
| **Alta del boliche** | ✅ Un botón (OAuth) | 🟡 Adhesión, CUIT, cuenta bancaria, rubro, autorización de preventa y vinculación a nuestro sitio | 🟡 Alta como empresa en la rampa más una wallet con passkey (invisible) |
| **Alta de TicketJuy** | Cuenta MP con KYC nivel 6 y una app marketplace | Negociación comercial y ser establecimiento Payway | Acuerdo B2B con la rampa, o registrarnos como PSAV |
| **Nuestra comisión se separa sola** | ✅ `marketplace_fee` en cada venta | ✅ Con transacción distribuida. ❌ Con establecimiento simple (facturar aparte) | ✅ Pago atómico en cada venta |
| **Medios de pago** | ⚠️ Tarjeta, débito y dinero en cuenta, falta confirmar cuáles acepta el split | ✅ Crédito, débito, prepaga, efectivo | ❌ Solo transferencia en pesos o tokens. Con tarjeta se pierde el ahorro |
| **Costo para Moon** | 🔴 El más caro (≈ 5,3 % a 10 días, ≈ 7,6 % al instante) | 🟢 Más barato (≈ 3,6 % débito, ≈ 4,8 % crédito) ⚠️ | 🟢 El más barato (≈ 0–3 %) ⚠️ |
| **Velocidad de cobro** | 🟡 Al instante solo pagando más | 🟡 Débito en 1 día hábil, crédito en 8–18 | 🟢 Al instante |
| **Dónde recibe Moon** | Cuenta de MP | Cuenta bancaria | Wallet, y después pesos a su cuenta |
| **Webhooks** | ✅ Firmados, con reintentos | ❌ No documentados (consulta activa) | 🟡 Depende de la rampa |
| **Reembolsos** | ✅ Por API, proporcionales (no se puede devolver todo si Moon no tiene saldo) | ✅ Por API, total o parcial | ❌ Los programamos nosotros |
| **Contracargos** | 🔴 Existen (monto retenido en la cuenta de Moon) | 🔴 Existen (multas si superan el 1 %) | 🟢 No existen |
| **Riesgo legal para TicketJuy** | 🟢 Ninguno: el regulado es MP | 🟢 Bajo | 🔴 Si repartimos la comisión, podríamos quedar como PSAV ⚠️ |
| **Desarrollo** | 🟢 SDK, sandbox y documentación completa | 🟡 SDK y API, sin webhooks | 🔴 Wallets, reparto, conciliación y retiros, todo propio |
| **Costumbre del comprador** | 🟢 Todos usan MP | 🟢 Tarjeta común | 🟡 Transferencia (también pagan los usuarios de Lemon o Belo) |
| **Dependencia** | De MP (puede cambiar tasas) | De Payway | De una rampa chica (Anclap sin registro, Settle sin producto público) |

---

## Pros y contras

### 1. Mercado Pago Split

**Pros**
- Se contrata hoy, sin negociar con nadie, y Moon conecta su cuenta con un botón.
- Nuestra comisión se separa sola en cada venta.
- Ningún tema legal para nosotros.
- Webhooks firmados, reembolsos por API, sandbox y SDK.
- Los compradores ya lo usan y no tienen que fondear nada.

**Contras**
- Es la más cara para Moon.
- Cobrar al instante cuesta 6,29 % + IVA.
- ⚠️ La documentación del split es ambigua: podría aceptar solo dinero en cuenta de MP. Hay que probarlo en sandbox antes de lanzar.
- Si Moon no tiene saldo, no se puede reembolsar el total.
- El token de Moon vence cada 180 días: hay que renovarlo solo.

### 2. Payway

**Pros**
- Más barata que MP con tarjeta, sobre todo con débito.
- La plata va directo a la cuenta bancaria del boliche.
- Muchos boliches ya tienen terminal Payway y número de establecimiento.
- Acepta todas las tarjetas y efectivo.

**Contras**
- El split (transacción distribuida) no es autoservicio: Payway tiene que dar de alta y vincular cada boliche a nuestro sitio.
- No tiene webhooks documentados.
- El alta del boliche es pesada: cuenta bancaria, rubro y autorización para vender antes del evento.
- El Cobro Anticipado viene activado por defecto y lo encarece.
- El rubro de bares (5813) no permite cuotas.

### 3. Cripto (rampa + Stellar)

**Pros**
- Moon cobra al instante y con la menor comisión.
- No hay contracargos.
- Nuestra comisión se separa sola, sin depender de MP.
- Los usuarios de Lemon o Belo ya pueden pagar con su cripto por transferencia, sin integrar nada.

**Contras**
- **No hay quién haga el cambio:** las rampas de pesos son para personas. Ninguna registrada ofrece que un comprador pague en pesos y el boliche cobre en tokens.
- **Hacerlo nosotros es ser PSAV:** registro en la CNV, UIF, compliance, auditorías, abogados y un banco que acepte una empresa cripto.
- Sigue siendo de peso a peso: el comprador paga en pesos y Moon quiere pesos.
- Con tarjeta se pierde el ahorro.
- Reembolsos, conciliación y retiros, todo propio.

---

## Por qué Mercado Pago es la más sólida

1. **Es la única que no depende de que otro diga que sí.** Payway y cripto requieren una negociación comercial que hoy no tenemos.
2. **Cumple la regla "la plata no pasa por nosotros"** sin ningún riesgo legal.
3. **Es la que menos desarrollo y operación pide** para un equipo chico con un solo boliche.
4. **Es la que el público ya usa.**

Lo que pierde (costo y velocidad para Moon) se puede compensar después. La idea es sumar Payway o cripto como segundo medio detrás de una interfaz `PaymentProvider`, sin tocar el resto del sistema.

## Qué hay que hacer

1. **Mercado Pago:** probar en sandbox cada medio de pago con split activo (tarjeta, débito, dinero en cuenta) y revisar `marketplace_fee` y `fee_details`.
2. **Payway:** si un boliche ya trabaja con Payway, pedir reunión con Ventas Online por la transacción distribuida (preguntas en [payway.md](./payway.md)).
3. **Cripto:** mail a Settle por un producto de cobro para comercios, y consulta legal sobre PSAV (preguntas en [rampas-web3.md](./rampas-web3.md)).
