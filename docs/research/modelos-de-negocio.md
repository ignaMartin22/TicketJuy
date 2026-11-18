# Modelo de negocio: cómo cobra TicketJuy y cómo se mueve la plata con Moon

> **Fecha de consulta:** 2026-11-17. Casi todos los números de otras ticketeras salen de comparativas hechas por competidores, así que son **orientativos**. Lo marcado con **⚠️** no está confirmado.
>
> **Alcance:** cómo le cobra TicketJuy a Moon y por dónde pasa la plata. **El negocio de entradas es de Moon** (precios, tandas, listas, promociones) y no lo tocamos. Lo único que Moon decide de nuestro lado es si absorbe nuestro cargo o se lo pasa al comprador (`feeMode` en `mock-data.ts`).

---

## Resumen

**Recomendación:**
1. **Por las entradas online, una comisión por entrada** cobrada sola con el split de Mercado Pago (`marketplace_fee`). La plata nunca pasa por TicketJuy y no hay que perseguir ningún pago.
2. **Por lo que no pasa por MP** (listas free, cortesías, venta en puerta), **un monto fijo por ingreso escaneado**, facturado una vez por mes.
3. **Un tope mensual** para que Moon sepa cuánto es lo máximo que puede pagar, y **un mínimo mensual** chico para cubrir lo que nos cuesta operar en temporada baja.

---

## 1. Cómo cobran y mueven la plata otras ticketeras

| Ticketera | Cómo cobra | Por dónde pasa la plata | Cuándo cobra el organizador |
|---|---|---|---|
| **Alpogo** | ≈ 15 % final por entrada, sin costos fijos | **Por Alpogo:** recauda todo y después le paga al productor | 1–5 días hábiles después del evento, con **adelanto de hasta el 50 %** |
| **Passline** | ≈ 6–10 % al productor más cargo por QR, según acuerdo ⚠️ | Por la ticketera ⚠️ | No publicado |
| **Venti, Ticketek, AllAccess** | Cargo de servicio al comprador (≈ 15 %) ⚠️ | Por la ticketera | Según contrato |
| **Ticketmaster** | ≈ 5 % del total. El resto del cargo lo fija el venue y **≈ ⅔ vuelve al venue** | Por Ticketmaster | Según contrato, con **adelantos y garantías por exclusividad** |
| **DICE** | ≈ 10–13 % ⚠️ | Por DICE | Después del evento |
| **Shotgun** | Cargo al comprador (no publicado). 15 % en reventa | Por Shotgun | ≈ 24 h después del evento ⚠️ |
| **Posh** | 10 % + US$0,99 | Por Posh | Durante la venta o después, según la fuente ⚠️ |
| **SaaS de marca propia** (Ticket Tailor, Vemos) | **Fijo por entrada** (£0,22–0,60) o **por mes** | **Directo a la cuenta del organizador** | Al instante, según su procesadora |

**Qué se repite:**
- Casi todas **recaudan ellas y le pagan después al organizador**. Por eso Alpogo puede adelantar plata: la tiene.
- Las que no tocan la plata (las SaaS) cobran **fijo por entrada o por mes**, y le facturan aparte al organizador.
- Las grandes cuidan la exclusividad **compartiendo el cargo** o **adelantando plata**, no bajando la comisión.

---

## 2. Cómo puede cobrar TicketJuy

| Modelo | Cómo funciona | A favor | En contra |
|---|---|---|---|
| **A. % por entrada** | X % de cada venta, en `marketplace_fee` | Crece con Moon. Se cobra solo | En mes flojo cobramos poco |
| **B. Fijo por entrada** | $X por entrada (también en `marketplace_fee`, que es un monto) | Moon lo entiende fácil. No depende del precio de la entrada | Hay que actualizarlo por inflación |
| **C. Abono mensual** | $X por mes, venda lo que venda | Ingreso fijo | Con un solo cliente, si Moon corta, no queda nada. Hay que cobrarlo aparte y puede atrasarse |
| **D. Por ingreso escaneado** | $X por persona que entra, venga de venta online, lista o puerta | Cubre lo que hacemos en la puerta aunque no haya venta. Se cuenta solo con el escáner | Hay que facturarlo por mes. Moon puede sentir que paga por las listas free |
| **E. Sobre lo que crece** | % solo de lo que Moon venda online **por encima** de su promedio | Fácil de vender para un piloto | Depende de que Moon comparta sus números reales |
| **F. Mixto** ✅ | A o B para venta online + D para ingresos sin venta online + tope y mínimo mensual | Cubre todo el servicio y es predecible para los dos | Un poco más para explicar |

**Recomendación: F.**
- La parte online (A o B) se cobra sola en cada venta, que es la mayor parte de la plata.
- D nos paga el trabajo de la puerta y las listas, que también usan el sistema, aunque no haya venta online.
- El tope le da a Moon un costo máximo conocido. El mínimo nos protege, porque dependemos de un solo cliente.
- **A o B:** con inflación, A se ajusta solo. B es más fácil de explicar, pero hay que actualizarlo. Recomiendo **A**.
- E sirve como oferta de la primera fecha piloto y después se pasa a F.

**Cargo al comprador:** en A y B, Moon decide si absorbe nuestra comisión o la suma al precio como cargo de servicio. No cambia nada para TicketJuy: el `marketplace_fee` es el mismo monto. ⚠️ Si se suma al comprador, hay que mostrarlo desde el primer precio (normativa de precio final, a consultar).

---

## 3. Cómo se mueve la plata

| Flujo | Cómo funciona | A favor | En contra |
|---|---|---|---|
| **1. Split de MP** ✅ | El comprador le paga a Moon y MP separa nuestro `marketplace_fee` en el momento | Cobramos al instante y sin perseguir a nadie. La plata no pasa por nosotros | Depende de MP. Hay que facturarle a Moon la comisión (una factura mensual que resuma las ventas) ⚠️ |
| **2. Moon cobra todo y le facturamos** | Moon recibe el 100 %. A fin de mes le facturamos y nos transfiere | Lo más simple. Transferir no cuesta nada | Riesgo de atraso o de no pago. Con un solo cliente, es todo nuestro ingreso |
| **3. TicketJuy recauda y le paga a Moon** (modelo Alpogo) | Todo entra a nuestra cuenta y le liquidamos a Moon | Podemos adelantarle plata y ganar con los días que la tenemos | **Rompe la regla "la plata no pasa por nosotros"**: la comisión de MP y el riesgo de contracargos caen sobre TicketJuy, y queda como ingreso nuestro ante ARCA (o hay que armar una figura de cobranza por cuenta de terceros) ⚠️ |

**Recomendación:**
- **Flujo 1 para la comisión online.**
- **Flujo 2 solo para la parte por ingreso escaneado, el abono mínimo o la diferencia con el tope.** Es una factura mensual, que Moon puede pagar por transferencia o con débito automático. ⚠️ Las suscripciones de MP podrían servir para el mínimo mensual. No está confirmado.
- **El flujo 3 queda descartado.** Si algún día queremos adelantarle plata a Moon como Alpogo, mejor hacerlo eligiendo el plazo de cobro de MP por fecha (ver [mercado-pago-menos-comision.md](./mercado-pago-menos-comision.md)) que tocando la plata.

---

## 4. Qué hay que definir con Moon

1. **Porcentaje por entrada online** (hoy figura 10 % provisorio en la hoja de ruta) y si Moon lo absorbe o lo pasa al comprador.
2. **Monto por ingreso escaneado** que no viene de venta online.
3. **Tope y mínimo mensual.**
4. **Quién paga la comisión de MP.** En el split se descuenta de la cuenta de Moon, así que si nuestro % se calcula sobre el total, Moon paga las dos.
5. **Exclusividad y plazo del acuerdo**, por ejemplo 12 meses, con salida si el servicio falla.
6. **Facturación:** con qué frecuencia le facturamos la comisión y qué tipo de factura según la situación fiscal de cada uno. Esto lo tiene que ver un contador.

---

## 5. Datos nuevos y decisiones (2026-11-17)

### Cómo trabaja Moon hoy
- Paga **15 % de comisión** a su ticketera actual. ⚠️ Falta confirmar si lo paga Moon o el comprador como cargo de servicio.
- La plata le llega **a la semana**.
- Quiere un sistema **exclusivo** con la marca **"Infinity Producciones"** hacia el público. TicketJuy queda como sistema interno, y su nombre es provisorio (opciones en evaluación: Tuta, Sello, Nocta).

Por entrada de $10.000, si Moon absorbe la comisión:

| | Hoy | Con nosotros (5 % + MP con QR) |
|---|---|---|
| Comisión total | 15 % → $1.500 | ≈ 6,5 % → ≈ $647 |
| Le llega a Moon | $8.500 | ≈ $9.353 |
| Cuándo cobra | A la semana | Al instante con QR o dinero en cuenta |

Con un 8 % Moon seguiría pagando la mitad que hoy (≈ 9,5 % con MP). La comisión final la decide el equipo.

### Porcentaje o monto fijo por entrada
**Porcentaje con un piso por ingreso** (por ejemplo, 5 % con un mínimo de ≈ $350):
- El porcentaje acompaña la inflación sin renegociar con nuestro único cliente.
- Es parejo para Moon: un monto fijo de $500 equivale a 7,1 % en una general de $7.000 y a 2,8 % en una VIP de $18.000.
- El piso cubre nuestro costo por entrada (WhatsApp, infraestructura) en entradas baratas o promociones.
- Se cuenta por ingreso, no por compra: un pack de 4 son 4 ingresos.
- Opcional: un tope por ingreso para mesas VIP caras. El piso y el tope se actualizan cada 6 meses.
- Todo se calcula al crear el pago y viaja en `marketplace_fee`, que es un monto.

### Si el comprador paga nuestro cargo
MP cobra su comisión sobre el total y la descuenta de la cuenta de Moon. Hay tres variantes:

| Variante | El comprador paga | Le llega a Moon (QR) | Le llega a TicketJuy (QR) |
|---|---|---|---|
| `marketplace_fee` = cargo completo | $10.500 | ≈ $9.898 (Moon paga MP sobre nuestro cargo) | $500 |
| **Cada uno paga MP sobre lo suyo** ✅ | $10.500 | ≈ $9.903 | ≈ $495 |
| El cargo cubre toda la comisión de MP | ≈ $10.603 | $10.000 | $500 |

Supuesto: todo pagado con dinero en cuenta por QR (0,8 % + IVA ≈ 0,97 %).

⚠️ Si el cargo se suma al precio, hay que mostrarlo desde el primer precio (normativa de precio final, a consultar), y facturárselo al comprador (a ver con un contador).

### Simulación de un mes (orientativa)
Supuestos: entrada de $10.000, 5 % con IVA incluido, mezcla de pagos con 80 % de dinero en cuenta por QR.
- **Volumen:** no encontramos el aforo de Moon publicado. Por boliches comparables de San Salvador (600–750 personas habilitadas), estimamos ≈ 870 ingresos por fin de semana, ≈ 3.700 por mes. Si la mitad compra online: ≈ 1.850 entradas online por mes.
- **TicketJuy:** cobra ≈ $925.000 brutos. Le quedan ≈ $300.000 netos, después de IVA, Ingresos Brutos, impuesto a los débitos y créditos, infraestructura, WhatsApp, contador y Ganancias. Las tasas de impuestos y los costos fijos son estimados ⚠️.
- **Lo que le cuesta TicketJuy a Moon es solo nuestro 5 %.** La comisión de MP la pagaría igual vendiendo por MP sin nosotros.

---

## Fuentes

- Alpogo: [alpogo.com](https://alpogo.com/), [qrTicket vs Alpogo](https://qrticket.app/vs/alpogo), [Cultura Caníbal](https://culturacanibal.com.ar/alpogo-com-3-anos-de-musica-y-e-commerce/), [LM Diario](https://lmdiario.com.ar/contenido/94582/entradas-y-algo-mas)
- Argentina: [Tickean – Passline](https://www.tickean.com/passline), [Avantti – alternativa a Passline](https://avantti.com.ar/productores/alternativas/alternativa-a-passline), [Tikzet – tendencias 2026](https://www.tikzet.com/blog/tendencias-ticketing-2026-argentina/), [Fanz – costos de ticketeras](https://fanz.com.ar/blog/costos-reales-de-las-ticketeras-en-argentina-2025-comparativa-completa-para-organizadores)
- Ticketmaster: [CRS – Tickets for Live Entertainment Events](https://www.everycrsreport.com/reports/R48179.html), [Ticketmaster – The Truth About Ticket Prices](https://blog.ticketmaster.com/the-truth-about-ticket-prices/), [Live Nation – Facts](https://www.livenationentertainment.com/facts2)
- Nightlife: [Ticket Fairy – Posh vs Shotgun](https://www.ticketfairy.com/compare/ticketing/posh-vs-shotgun), [Ticket Fairy – DICE vs Shotgun](https://www.ticketfairy.com/compare/ticketing/dice-vs-shotgun), [TickPick – nightlife](https://www.tickpick.com/blog/organizer/best-ticketing-platform-nightlife)
- SaaS: [TicketNews – white label 2026](https://www.ticketnews.com/2026/09/7-best-white-label-ticketing-software-platforms-in-2026/), [Vemos](https://vemos.io/industry-nightclubs)
