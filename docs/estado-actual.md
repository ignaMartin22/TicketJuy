# Estado actual de TicketJuy

Foto del proyecto al 20/11/2026: qué anda, qué falta y quién lo tiene que hacer.

## Dónde corre cada cosa

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Front (este repo) | Railway | Rama `main`. Con `TICKETERA_API_URL` apuntando al back de pruebas. |
| Back (`ticketera-core`) | VPS, en `/opt/ticketjuy` | `https://api.66-97-35-67.sslip.io`. Corre `main` del back (incluye pago, gestión de fechas y conexión de Mercado Pago). |
| Base de datos de pruebas | VPS, contenedor `db` (Postgres 16) | Propia de TicketJuy, separada de los otros servicios de la VPS. Se puede reiniciar: se pierden los pedidos de prueba. |
| Mercado Pago | Modo prueba | Infinity está conectado a una cuenta vendedora de prueba cargada a mano (`mp_set_test_account`). |

En la VPS corren también la VPN de Rentas y otros servicios: no reiniciar la VPS, no tocar nada fuera de `/opt/ticketjuy`, y para Caddy usar `caddy reload`, nunca `restart`.

## Qué anda

### Comprador

- Portada de Infinity, página de cada boliche y de cada fecha, con el catálogo del back.
- Checkout sin cuenta: reserva el cupo 10 minutos con clave de idempotencia.
- Pedido gratis (por ejemplo "Lista free" de "Cumbia hasta el alba"): sale pagado y con las entradas al instante.
- Pago con Mercado Pago (#23): el botón pide el link al back y redirige; al volver se consulta el pago (`sync`) cada 4 segundos hasta que se confirma; aviso cuando el pago queda en revisión (`paymentReview`); mensaje para cada error del link de pago.
- Entradas con QR en la página del pedido pagado.
- App instalable (PWA).

### Personal

- Portería en `/puerta` (#22): login, escáner de QR y asistencia de la fecha.

### Back (listo para usar desde el front)

- Login del personal (`/api/v1/auth/login/`) con roles por boliche: `admin`, `door`, `cashier`.
- API de gestión de fechas (alta, edición, pausa y baja). Probada de punta a punta en local: 20 de 20 casos bien, incluidos los errores.
- Conexión de Mercado Pago del boliche por OAuth, también desde el panel de la plataforma (Django) con un link para el dueño.

## En curso

- **Multi-boliche (rama `feat/multi-boliche`)**: la barra de cada boliche llevaba el logo y "Fechas" a la portada de Infinity; ahora van a la página y a las fechas de ese boliche. La identidad del sitio quedó en `src/lib/site.ts`. Probado con un segundo boliche ("Fuego Austral") en un back local.
- **Login del panel (rama `feat/login-staff`, de Samuel)**: conecta `/admin/ingresar` con el login del personal del back. Sin mergear.

## Qué falta

### Front (no depende del back)

1. **Conectar el panel `/admin` a la API de gestión.** Hoy guarda las fechas en el navegador (`localStorage`) con Infinity fijo (`ADMIN_VENUE_SLUG`). Va arriba del login de Samuel. Además de cambiar el guardado:
   - Sumar "Publicar / Borrador" (`isPublished`): una fecha nueva arranca sin publicar y no aparece en la web.
   - Cambiar "quitar entrada" por "desactivar" (`isActive: false`): la API no borra tipos de entrada.
   - Traducir los tipos: el panel usa `general` y la API `common`.
   - Mostrar un mensaje por cada error de la API (cupo por debajo de lo vendido, fecha con pedidos, etc.).
   - Ojo: una fecha en borrador viene con `status: "on_sale"`; para mostrarla como borrador hay que mirar `isPublished`.
2. **Selector de boliche en el panel**: una persona puede ser admin de varios boliches (`memberships` del login).
3. **Mensaje para `sales_paused`** en el checkout (cuando el dueño pausa la venta de una fecha).
4. **Botón "Conectar Mercado Pago" en el panel** (estado, conectar, reconectar, desconectar). No es urgente: la plataforma ya puede mandarle el link al dueño desde su panel.
5. **Probar la portería en celulares reales**: cámara, vibración y vencimiento de sesión.
6. **Pulir las pantallas del comprador en el celu**: pedido, checkout y entrada.

### Back (pedirle a Franco)

1. **Portada de la fecha**: el formulario del panel deja subir una foto, pero la API de gestión no tiene campo de imagen.
2. **Entradas gratis desde el ABM**: la API exige precio mayor a 0, así que el dueño no puede crear una "Lista free".
3. **`/entrada/[code]`**: sigue con datos de prueba; falta el endpoint de entrada individual.
4. **Usuario dueño de prueba** (rol `admin` en Infinity) en el back de pruebas, para probar el panel contra la VPS. Hoy solo está `puerta_demo`.

### Pago con Mercado Pago: prueba trabada

El front y el back hacen su parte: el link se crea, el comprador llega al checkout y el webhook llega al back. Pero el checkout de Mercado Pago rechaza el pago ("No pudimos procesar tu pago") **antes de crearlo**: la order queda en `created` sin ningún pago.

Ya se descartó: saldo, tarjeta, pagar como invitado y que el email del pedido no coincida con el del comprador de prueba.

Sospechas, en orden:

1. El vendedor de prueba de Infinity lo creó Franco y el comprador de prueba lo creó Mauricio. Mercado Pago suele exigir que los dos los haya creado la misma cuenta de desarrollador. **Siguiente paso:** que Franco cree el comprador desde su cuenta y pruebe.
2. La comisión (`marketplace_fee`) en una cuenta conectada con el atajo de prueba, sin el OAuth de una app marketplace.

## Correr todo en local

### Back

Postgres 18 está instalado en el usuario (sin `sudo` ni Docker) en `~/.local/pg18`, puerto 5433. Las variables del back están en `ticketera-core/.env.dev.sh` (no se sube).

```bash
# Postgres
LD_LIBRARY_PATH=~/.local/pg18/root/usr/lib/x86_64-linux-gnu \
  ~/.local/pg18/root/usr/lib/postgresql/18/bin/pg_ctl -D ~/.local/pg18/data -l ~/.local/pg18/pg.log \
  -o "-p 5433 -k $HOME/.local/pg18/run -c listen_addresses=127.0.0.1" start

# Back
cd ~/projects/ticketera-core && . ./.env.dev.sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 127.0.0.1:8765
```

Datos de la base local: Infinity con sus 4 fechas, un segundo boliche de prueba (Fuego Austral), el admin de Django `admin` y el dueño de Infinity `dueno_demo` (contraseñas en el equipo, no en el repo).

Si cambian las migraciones en `main` del back y no aplican, la base local se puede borrar y volver a crear: `migrate` y `seed_infinity`.

### Front

```bash
npm install
npm run dev
```

Con `.env.local` (no se sube) eligiendo a qué back se conecta:

```
# Back local
TICKETERA_API_URL=http://127.0.0.1:8765
# o el de pruebas en la VPS
# TICKETERA_API_URL=https://api.66-97-35-67.sslip.io
```

Abrir en `localhost:3000`, no en `127.0.0.1`.

## Referencias

- Guía del back para el front: `docs/integracion-front.md` en `ticketera-core`.
- Hoja de ruta interna: `docs/hoja-de-ruta.md` en este repo.
