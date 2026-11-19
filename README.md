# TicketJuy

Ticketera virtual para boliches y eventos nocturnos de Jujuy. El primer cliente es **Infinity Producciones**, con su boliche Infinity en San Salvador de Jujuy (antes se llamaba Moon).

La idea: que el boliche venda todas sus entradas (online, punto de venta físico, Instagram y puerta) desde **un solo sistema**, que la plata de cada venta entre **directo a su cuenta de Mercado Pago**, y que la comisión de la plataforma se separe sola en cada venta (split de pagos). El boliche no paga nada por adelantado: solo paga por lo que vende.

> Estado: **etapa de diseño**. Todavía no hay código. Este README define la base del proyecto.

---

## Problema

Hoy un boliche como Infinity vende entradas anticipadas por varios canales separados, sin un panel que los junte:

| Canal | Problema |
| --- | --- |
| Ticketeras nacionales (según el evento) | Otro panel, otra liquidación, comisiones poco claras |
| Punto de venta físico | Se controla a mano |
| Venta directa por Instagram | Transferencias verificadas a mano |
| Puerta (efectivo / QR) | Fuera de cualquier sistema |

## Propuesta

- **Todo en un solo sistema**: online, punto de venta, transferencias y puerta en un panel unificado.
- **La plata no pasa por nosotros**: cada venta entra a la cuenta de Mercado Pago del boliche.
- **Sin pago por adelantado**: cargar un evento y definir cupos no cuesta nada. Si no vende, no paga.
- **Pensada para boliches**: mesas VIP, RRPP, listas free y de cumpleaños.
- **Equipo local**: soporte en la puerta y por WhatsApp las noches de evento.

---

## Funcionalidades

### MVP

- [ ] Alta de boliche (multi-tenant desde el inicio: varios boliches, no solo Infinity)
- [ ] Vinculación de la cuenta de Mercado Pago del boliche por OAuth
- [ ] Carga de eventos y tipos de entrada con cupo por tipo
- [ ] Checkout sin crear cuenta, en 2 toques, accesible desde el link de Instagram
- [ ] Pago con Mercado Pago (Checkout Pro) con split de pagos
- [ ] Entrada con **QR firmado de un solo uso**, enviada por WhatsApp / email
- [ ] App web de escaneo en puerta que **funciona sin señal** (validación offline + sincronización)
- [ ] Panel del boliche: ventas, ingresos y asistencia por evento
- [ ] Página de compra con la marca del boliche

### Siguiente etapa

- [ ] **Códigos de RRPP** con reporte y **ranking en vivo**, con comisión automática por relacionador
- [ ] **Mesas y reservados VIP** con mapa y seña online
- [ ] **Listas free y de cumpleaños**: el cumpleañero gestiona sus invitados desde un link
- [ ] **Modo punto de venta** para venta física y en puerta (efectivo y QR) dentro del mismo sistema
- [ ] Transferencia de entradas entre personas (sin reventa)
- [ ] Beneficios dentro de la entrada (consumiciones, VIP)
- [ ] Base de clientes del boliche para fidelización
- [ ] Checkout embebible en la web del boliche

---

## Modelo de cobro: split de pagos

Se usa el **Split de Pagos 1:1 (marketplace) de Mercado Pago**.

```
Comprador ──paga──▶ Cuenta MP del boliche
                         │
                         ├─ MP descuenta su comisión
                         └─ marketplace_fee ──▶ Cuenta MP de TicketJuy
```

1. El boliche vincula su cuenta de Mercado Pago con un botón (OAuth). Guardamos su `access_token` / `refresh_token`.
2. El boliche carga el evento y define el cupo de cada tipo de entrada.
3. Un comprador paga: la plata entra a la cuenta del boliche.
4. Mercado Pago descuenta su comisión de la parte del boliche y separa nuestra comisión (`marketplace_fee`) a nuestra cuenta.
5. Facturamos solo nuestra comisión.

### Notas técnicas (documentación oficial de Mercado Pago)

- `marketplace_fee` (Checkout Pro) o `application_fee` (Checkout API) es un **monto en pesos, no un porcentaje**. El porcentaje lo calcula nuestro sistema.
- Los pagos se crean con el **token del vendedor** (el boliche), no con el nuestro.
- En un reembolso, la devolución se reparte en proporción entre el boliche y nosotros. Si el boliche no tiene saldo, no se puede hacer el reembolso completo.
- El split solo permite pagos entre cuentas de Mercado Pago; hay que confirmar qué medios de pago acepta.

### Reglas de comisión configurables

La comisión se calcula por venta y tiene que poder variar:

- por boliche,
- por tipo de entrada (0% en listas free, distinta en VIP),
- por volumen,
- mixta (fijo + %), con tope por entrada,
- con períodos promocionales (ej. 0% el primer mes).

También hay que soportar dos formas de presentar el precio:

- **Comisión al boliche**: el comprador paga el precio de la entrada; el boliche absorbe MP + nuestra comisión.
- **Cargo al comprador**: el comprador paga entrada + cargo de servicio, y al boliche le llega el 100% del precio.

### Ventas que no pasan por Mercado Pago

Venta en puerta en efectivo, punto de venta físico, listas free y cortesías: la comisión no se separa sola. El sistema las registra igual y las deja listas para liquidar a fin de mes (o con comisión 0%).

---

## Arquitectura propuesta

> A confirmar al arrancar el desarrollo.

| Capa | Propuesta |
| --- | --- |
| Frontend + API | Next.js (App Router) + TypeScript |
| Base de datos | Postgres en Supabase (conexión vía pooler desde Vercel; migraciones SQL versionadas en el repo) |
| Auth | Supabase Auth: personal del boliche (admin, puerta, caja, RRPP) y comprador sin cuenta por código OTP |
| Multi-boliche | Row Level Security (RLS) de Supabase: cada boliche ve solo sus datos |
| Tiempo real | Supabase Realtime: ranking de RRPP y panel de ventas en vivo |
| Archivos | Supabase Storage: flyers, logos y marca de cada boliche |
| Pagos | Mercado Pago Checkout Pro + Split de Pagos (OAuth marketplace) |
| Webhooks | Notificaciones IPN / webhooks de Mercado Pago para confirmar pagos |
| Entradas | QR firmado (HMAC / JWT) de un solo uso |
| Escaneo | PWA con cache offline y cola de sincronización |
| Envío de entradas | WhatsApp + email |
| Hosting | Vercel |

### Entidades principales

- `Venue` (boliche) — cuenta de MP vinculada, marca, reglas de comisión
- `Event` — fecha, estado, tipos de entrada
- `TicketType` — precio, cupo, regla de comisión
- `Order` — comprador, medio de pago, canal (online / POS / puerta / lista), estado
- `Ticket` — QR firmado, estado (válida / usada / transferida / anulada)
- `Promoter` (RRPP) — código, ventas, comisión
- `GuestList` — lista free o de cumpleaños, invitados
- `Payment` — id de MP, monto, `marketplace_fee`, reembolsos

### Requisitos no funcionales

- **La puerta no puede fallar**: el escaneo tiene que funcionar sin conexión y ser rápido un sábado a la noche.
- **Multi-boliche** desde el día uno, para no depender de un solo cliente.
- Idempotencia en webhooks de pago y en validación de QR (una entrada = un ingreso).
- Producción en un plan pago de Supabase: el plan gratis pausa la base tras 7 días sin uso.

---

## Pendientes antes de construir

- [ ] Leer los requisitos para habilitar el Split de Pagos 1:1 y crear la aplicación de marketplace en Mercado Pago
- [ ] Confirmar qué medios de pago acepta el split (tarjeta, débito, dinero en cuenta, transferencia)
- [ ] Confirmar qué pasa con nuestra comisión y la de MP en un reembolso
- [ ] Evaluar sumar MODO o Ualá Bis y cómo dividen pagos
- [ ] Definir cómo se factura la comisión (monotributo o empresa)
- [ ] Definir la forma de cobro por defecto y el porcentaje de comisión
- [ ] Armar una calculadora: precio de entrada + plazo de cobro + comisión → cuánto paga el comprador, cuánto recibe el boliche y cuánto ganamos

---

## Desarrollo

```bash
npm install
npm run dev
```

Sin configuración, el sitio usa los datos de prueba de `src/lib/mock-data.ts` y la compra termina en una entrada de ejemplo.

### Con el backend (ticketera-core)

Levantá [ticketera-core](https://github.com/ignaMartin22/ticketera-core) y cargá Infinity con `python manage.py seed_infinity`. Después creá `.env.local` con:

```
TICKETERA_API_URL=http://127.0.0.1:8000
```

Con la variable, la portada, la página del boliche y las fechas leen el catálogo de la API desde el servidor de Next (el navegador nunca habla directo con Django). El catálogo se vuelve a pedir cada minuto. El checkout reserva el cupo por 10 minutos (`POST .../orders/`) con una clave de idempotencia por intento y lleva a `/<boliche>/<fecha>/pedido/<id>`. El pago con Mercado Pago todavía no está conectado: esa página muestra la reserva y el tiempo que queda.
