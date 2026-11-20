# Estado actual de TicketJuy

Foto del proyecto al 20/11/2026 (a la tarde): qué anda, qué falta y quién lo tiene que hacer.

## Dónde corre cada cosa

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Front (este repo) | Railway | Rama `main`, se despliega sola. Con `TICKETERA_API_URL` apuntando al back de la VPS. |
| Back (`ticketera-core`) | VPS, en `/opt/ticketjuy` | `https://api.66-97-35-67.sslip.io`. Corre `main` del back (incluye pago, gestión de fechas y conexión de Mercado Pago). |
| Base de datos | VPS, contenedor `db` (Postgres 16) | Propia de TicketJuy, separada de los otros servicios de la VPS. Ya tiene pedidos reales: antes de desplegar el back, `deploy/backup.sh`. |
| Mercado Pago | **Producción, plata real** | Infinity cobra directo en la cuenta de Mercado Pago de Franco (cobro directo, sin comisión de la plataforma). Para probar, usar "Lista free" o una fecha de prueba de monto chico. |

En la VPS corren también la VPN de Rentas y otros servicios: no reiniciar la VPS, no tocar nada fuera de `/opt/ticketjuy`, y para Caddy usar `caddy reload`, nunca `restart`.

## Qué anda

### Comprador

- Portada de Infinity, página de cada boliche y de cada fecha, con el catálogo del back.
- Checkout sin cuenta, solo nombre y correo (#30): reserva el cupo 10 minutos con clave de idempotencia.
- Al sumar una entrada, la fila se deshace en polvo que viaja hasta el total (#31).
- Pedido gratis (por ejemplo "Lista free" de "Cumbia hasta el alba"): sale pagado y con las entradas al instante.
- Pago con Mercado Pago (#23): el botón pide el link al back y redirige; al volver se consulta el pago (`sync`) cada 4 segundos hasta que se confirma; aviso cuando el pago queda en revisión (`paymentReview`); mensaje para cada error del link de pago.
- Entradas con QR en la página del pedido pagado.
- App instalable (PWA).

### Personal

- Ingreso único en `/ingresar` (#24): administración al panel, puerta al escáner, con una sola sesión.
- Portería en `/puerta` (#22, rediseñada en #25): escáner de QR a pantalla completa y asistencia de la fecha.
- Panel en `/admin` protegido con login (#21) y **conectado a la API de gestión** (#34): alta, edición, publicar o pasar a borrador, pausar la venta y eliminar fechas, con las estadísticas del resumen sacadas de las ventas reales. Cada dueño ve las fechas del boliche de su membresía.

### Back (listo para usar desde el front)

- Login del personal (`/api/v1/auth/login/`) con roles por boliche: `admin`, `door`, `cashier`.
- API de gestión de fechas (alta, edición, pausa y baja), ya usada por el panel.
- Conexión de Mercado Pago del boliche por OAuth, también desde el panel de la plataforma (Django) con un link para el dueño.

## Hecho el 20/11

- **Ingreso único del personal (#21 y #24)**: `/ingresar` para panel y portería, con una sola sesión. Administración va al panel; puerta, directo al escáner.
- **Portería rediseñada (#25)**: escáner a pantalla completa, resultados por color y la fecha de hoy marcada.
- **Tarjeta de la fecha como flyer (#26)** y **scroll suave con Lenis (#27)** en la portada. El scroll guiado del celu, que tiraba la página para atrás, se sacó (#32 y #33): con el dedo queda el scroll nativo.
- **Multi-boliche (#28)**: la barra de cada boliche lleva a su página y a sus fechas; la identidad del sitio está en `src/lib/site.ts`.
- **Checkout solo con nombre y correo (#30)**: el WhatsApp se sacó hasta que haya envío por WhatsApp. El back lo acepta vacío (core #22); la columna sigue en la base.
- **Polvo de entrada (#31)** en la página de cada fecha.
- **Pago con Mercado Pago probado de punta a punta**: pedido pagado, webhook recibido y vuelta a la página del pedido en Railway.
- **Panel conectado a la API de gestión (#34)**: las fechas se guardan en ticketera-core, no en el navegador. Suma "Publicada en la web" (borrador), desactiva en vez de borrar las entradas quitadas, muestra el mensaje de cada error de la API y refresca la web pública al guardar. Sin `TICKETERA_API_URL` sigue el modo demo en el navegador. Una fecha nueva arranca en borrador. Probado contra el back local: crear una fecha de $50, publicarla (aparece en la portada), pasarla a borrador y eliminarla.
- **Flyer de cada fecha** (front y core, sin desplegar todavía): el dueño sube la portada desde el panel; el back la achica a WebP, la guarda en el volumen `media` de la VPS y la sirve en `/media/`. La tarjeta de la portada, la página del boliche y el afiche de la fecha la muestran a color; sin flyer, siguen con la foto del boliche teñida. Probado en local: 14 de 14 (subir, ver en la web, sacar, volver a subir y borrar la fecha borra el archivo).
- **Checkout**: mensaje para cuando el dueño pausa la venta (`sales_paused`).

## Qué falta

### Front

1. **Probar la portería en un celular real** cuando esté en producción: cámara, vibración y vencimiento de sesión (Mauricio).
2. **Botón "Conectar Mercado Pago" en el panel**: estado de la conexión, conectar, reconectar cuando `needsReconnect` y desconectar. El back ya tiene las rutas (`/manage/venues/<boliche>/mercadopago/`). Mientras tanto, la plataforma le puede mandar el link al dueño desde su panel.
3. **Selector de boliche en el panel**, solo si aparece un dueño con más de un boliche a cargo (por ejemplo, una productora con varios lugares). Hoy cada dueño administra uno.
4. **Pulir las pantallas del comprador en el celu**: pedido, checkout y entrada.

### Back (pedirle a Franco)

1. **Anular los pedidos de prueba** que se hagan en producción (pasarle los números).
2. **Entradas gratis desde el ABM**: la API exige precio mayor a 0, así que el dueño no puede crear una "Lista free".
3. **Estado de borrador**: una fecha sin publicar viene con `status: "on_sale"`. Sería más claro `draft` (el panel ya mira `isPublished`).
4. **`/entrada/[code]`**: sigue con datos de prueba; falta el endpoint de entrada individual.

### Pendiente grande, sin dueño todavía

- **Portería sin señal**: hoy escanear necesita conexión. El README pide que la puerta funcione sin señal (validación offline y cola de sincronización).

### Cómo probar todo

La guía paso a paso está en `docs/prueba-e2e.md`.

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
