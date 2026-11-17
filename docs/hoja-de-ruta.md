# Hoja de ruta (interna)

Para el equipo: qué está hecho y qué falta. No se publica en el sitio.

Enfoque acordado: **por dentro es una plataforma** (varios boliches desde el día uno), **por fuera arranca solo con Moon**. La página principal es la landing de TicketJuy, con un apartado de Moon y sus próximas fechas. Moon tiene su página propia en `/moon`.

Estados: ✅ hecho · 🔄 en curso · ⏳ pendiente · ⛔ bloqueado

## 0. Diseño y validación 🔄

Saber qué construimos y cómo cobramos antes de escribir backend.

- [x] README con problema, propuesta y modelo de cobro
- [x] Investigación del Split de Pagos de Mercado Pago (`docs/research/mercado-pago-split.md`)
- [x] Investigación de Payway como alternativa (`docs/research/payway.md`)
- [x] Decisión: usar Mercado Pago
- [x] Investigación de rampas web3: Stellar, Ripio wARS, Settle (`docs/research/rampas-web3.md`)
- [x] Decisión: cripto en pausa. Se reactiva si una rampa registrada ofrece cobro para comercios y un abogado confirma que TicketJuy no queda como PSAV
- [x] Decisión: plataforma por dentro, solo Moon por fuera
- [ ] Respuestas de Moon: procesadora, comisión actual y plazo de cobro
- [ ] Confirmar con Mercado Pago qué medios de pago acepta el split
- [ ] Definir comisión por defecto y quién paga el cargo de servicio (hoy figura 10 % provisorio)

## 1. Front del comprador con datos de prueba 🔄

Ver y probar el recorrido completo de compra antes de conectar nada.

- [x] Landing de TicketJuy con apartado de Moon
- [x] Página de Moon con sus fechas
- [x] Página del evento con tipos de entrada y cupos
- [x] Checkout sin cuenta
- [x] Entrada con QR y sus estados (válida, usada, transferida)
- [x] Estética neón nocturna, con el color de cada boliche
- [x] Logo, lema ("noches infinitas"), color celeste neón, foto y ubicación de Moon
- [ ] Flyers reales de cada fecha y fotos en mejor resolución
- [ ] Usuario de Instagram de Moon (hoy no se muestra)
- [ ] Probarlo en celulares reales, también Android de gama baja

## 2. Base de datos y cuentas ⏳

Reemplazar los datos de prueba (`src/lib/mock-data.ts`) por Supabase.

- [ ] Esquema: boliches, eventos, tipos de entrada, órdenes, entradas, pagos
- [ ] Seguridad por fila (RLS): cada boliche ve solo lo suyo
- [ ] Acceso del personal del boliche: admin, puerta y caja
- [ ] Flyers y logos en Supabase Storage

## 3. Cobro con Mercado Pago ⛔

Que la plata entre al boliche y la comisión se separe sola.
**Espera:** confirmar los medios de pago del split.

- [ ] Crear la aplicación de marketplace en Mercado Pago
- [ ] Botón para que el boliche conecte su cuenta (OAuth) y renovación del token
- [ ] Checkout Pro con `marketplace_fee` calculado por nuestras reglas
- [ ] Webhooks firmados e idempotentes para confirmar pagos
- [ ] Reembolsos

## 4. Entradas reales ⏳

Una entrada, un ingreso.

- [ ] QR firmado de un solo uso
- [ ] Envío por WhatsApp y email apenas se aprueba el pago

## 5. Puerta ⏳

Que la puerta no falle un sábado a la 1:30.

- [ ] Escáner en el navegador del celular del personal
- [ ] Funciona sin señal y sincroniza cuando vuelve
- [ ] Pantalla clara de entrada válida, usada o falsa

## 6. Panel del boliche ⏳

Que el boliche cargue fechas solo y vea la noche en vivo.

- [ ] Cargar eventos, tipos de entrada y cupos
- [ ] Ventas, plata e ingresos por fecha
- [ ] Marca del boliche en su página de venta

## 7. Piloto con Moon ⏳

Vender una fecha real de punta a punta.

- [ ] Una fecha vendida solo por TicketJuy
- [ ] Nosotros en la puerta esa noche
- [ ] Revisión con el boliche: plata, tiempos y quejas

## 8. Siguiente etapa ⏳

- [ ] Códigos de RRPP con ranking en vivo
- [ ] Mesas VIP con mapa y seña
- [ ] Listas free y de cumpleaños
- [ ] Venta en caja y puerta en el mismo sistema
- [ ] Transferir entradas y guardarlas en Wallet
- [ ] Sumar el segundo boliche

## Pantallas para probar (con `npm run dev`)

| Pantalla | Ruta |
| --- | --- |
| Landing con apartado de Moon | `/` |
| Página de Moon | `/moon` |
| Evento con tanda agotada y últimas entradas | `/moon/noche-de-luna-llena` |
| Evento con mesa VIP de precio alto | `/moon/fin-de-ano` |
| Checkout con 3 entradas | `/moon/noche-de-luna-llena/checkout?t=anticipada-2:2,vip:1` |
| Checkout vacío | `/moon/noche-de-luna-llena/checkout` |
| Entrada válida | `/entrada/TJ-7K3M-Q9XA` |
| Entrada usada | `/entrada/TJ-2PLR-8WDE` |
| Entrada transferida | `/entrada/TJ-9QZT-4HNB` |
