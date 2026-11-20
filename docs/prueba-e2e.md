# Prueba de punta a punta (front + core)

Checklist para probar todo a mano, en producción, con el celu y la compu. Cada paso dice qué hacer y qué tendría que pasar. Si algo no da lo esperado, anotá el número del paso, una captura y la hora.

- Front: https://ticketjuy-production.up.railway.app
- Back: https://api.66-97-35-67.sslip.io
- Panel de la plataforma (Franco): https://api.66-97-35-67.sslip.io/plataforma/

## 0. Antes de arrancar

- [ ] **Plata real.** Infinity cobra con su cuenta de Mercado Pago de verdad. Para todo lo que no sea la sección 3 usá **"Lista free" de "Cumbia hasta el alba"** ($0). Para el pago, una fecha de prueba de $50 que creás vos desde el panel (sección 6).
- [ ] **Usuarios:** uno con rol administración (`franco`) y uno de puerta (`puerta_demo`). Pedile las contraseñas a Franco.
- [ ] **Orden:** hacé primero las secciones 1, 2, 4 y 6 (hasta el punto 41, la fecha de $50 publicada); después la 3 (pago), la 5 (portería) y el resto de la 6.
- [ ] **Dos aparatos:** un celu (comprador y portería) y una compu (comprador y panel). Mejor si el celu es Android y además alguien prueba con iPhone.
- [ ] **Los pedidos de prueba quedan en la base real** y cuentan en la asistencia. Al final, pasale a Franco los números de pedido para que los anule.

## 1. Portada y fechas

1. [ ] Abrí la portada en el celu. Se ven el cartel INFINITY, las tarjetas de las fechas y las fotos. Ninguna tarjeta dice "En venta".
2. [ ] Deslizá con el dedo de arriba a abajo y de vuelta, rápido y lento. La página se queda donde soltás, **nunca te tira para atrás**.
3. [ ] En la compu, bajá con la ruedita: se desliza suave, sin frenadas.
4. [ ] La fecha con una entrada en pocas unidades muestra "últimas N". "Anticipada, 1ª tanda" de Luna Llena aparece agotada.
5. [ ] Tocá "Fechas" en la barra de arriba: baja hasta el listado.
6. [ ] Entrá a una fecha: se ven afiche, día, hora, lugar (el link abre Maps), edad, ingreso y las entradas con su precio.

## 2. Compra gratis (sin Mercado Pago)

En "Cumbia hasta el alba":

7. [ ] Tocá **+** en "Lista free": la fila se deshace en polvo, el polvo baja al total y el total queda en $0. La barra de abajo dice "1 entrada".
8. [ ] Tocá **−**: vuelve a 0 y la barra cambia a "Comprar entradas".
9. [ ] Sumá entradas hasta 10: el **+** se apaga y aparece "Máximo 10 entradas por compra".
10. [ ] Dejá 2 de "Lista free" y tocá **Continuar**.
11. [ ] En el checkout, tocá pagar con todo vacío: pide nombre y correo. Probá un correo mal escrito (`hola@`): lo rechaza.
12. [ ] No aparece ningún campo de WhatsApp.
13. [ ] Completá nombre y correo reales y confirmá. Tiene que ir directo al pedido **pagado**, con **2 QR**, sin pasar por Mercado Pago.
14. [ ] Guardá el link del pedido: lo usás en la portería.
15. [ ] Recargá la página del pedido: siguen los mismos QR.

## 3. Compra con Mercado Pago (plata real, monto chico)

Con la fecha de $50 que creás en el panel (sección 6, puntos 39 a 41):

16. [ ] Sumá 1 entrada, continuá, completá datos y tocá **Pagar**: te lleva a Mercado Pago (la dirección es de `mercadopago.com`).
17. [ ] Pagá con tu tarjeta o tu cuenta. Al terminar, Mercado Pago te devuelve a **`ticketjuy-production.up.railway.app/infinity/<fecha>/pedido/<número>`**. Si te devuelve a `localhost`, avisale a Franco (es el `FRONT_BASE_URL` de la VPS).
18. [ ] En la página del pedido, si todavía dice que espera el pago, en unos segundos pasa sola a pagado y aparecen los QR (consulta cada 4 segundos).
19. [ ] Otro intento: entrá a pagar y **volvé atrás sin pagar**. El pedido queda pendiente, con el botón para pagar de nuevo, y no aparecen QR.
20. [ ] Esperá más de 10 minutos con ese pedido sin pagar: la reserva vence y el cupo vuelve a estar disponible.
21. [ ] Que Franco confirme en `/plataforma/` → Infinity → Pedidos que el pedido pagado figura como pagado y el abandonado no.

## 4. Ingreso del personal

22. [ ] Entrá a `/admin` sin sesión: te manda a `/ingresar`.
23. [ ] Contraseña incorrecta: muestra un error y no entra.
24. [ ] Entrá con `franco`: va al **panel** (`/admin`).
25. [ ] Cerrá sesión y entrá con `puerta_demo`: va **directo a la portería** (`/puerta`).
26. [ ] Con `puerta_demo`, escribí `/admin` en la barra: no te deja entrar al panel.
27. [ ] En el celu, agregá la portería a la pantalla de inicio y abrila desde ahí: sigue con la sesión iniciada.

## 5. Portería (con el celu)

28. [ ] En `/puerta` aparecen las fechas de Infinity, y la de esta noche (empieza en menos de 16 horas) tiene la marca "Hoy".
29. [ ] Entrá a "Cumbia hasta el alba": pide permiso para la cámara y la abre a pantalla completa.
30. [ ] Desde otro aparato, abrí el pedido del paso 14 y escaneá el **primer QR**: pantalla verde, **"Adelante"**, con el nombre del comprador y el tipo de entrada. El celu vibra corto y el contador de ingresados sube.
31. [ ] Escaneá **el mismo QR otra vez**: **"Ya ingresó"**, con la hora del primer ingreso y quién lo escaneó. Vibra largo.
32. [ ] Escaneá el **segundo QR**: verde.
33. [ ] Entrá al escáner de **otra fecha** (Luna Llena) y escaneá un QR de Cumbia: **"Es de otra fecha"**, con el nombre y el día de esa fecha.
34. [ ] Escaneá cualquier QR que no sea de TicketJuy (el de un menú, por ejemplo): **"Entrada no válida"**.
35. [ ] Tocá "Escribir código", pegá el texto de un QR y tocá "Revisar": da el mismo resultado que escaneando.
36. [ ] Abrí la asistencia de Cumbia: los ingresos coinciden con lo que escaneaste.
37. [ ] Dejá el celu sin internet (modo avión) y escaneá: **"Sin conexión"**, que pide volver a escanear (no dice "no válida").

## 6. Panel del boliche (`/admin`, en la compu)

Entrá con `franco`. Lo que guardes acá va al back y se ve en la web.

38. [ ] **Eventos**: aparecen las fechas de Infinity con lo vendido de verdad.
39. [ ] **Nuevo evento**: cargá nombre "Prueba interna, no comprar", una fecha lejana y hora. En "Entradas comunes" poné General, **$50** y **cantidad 2**. Quitá la fila de VIP con su botón de quitar (si queda vacía, no te deja guardar).
40. [ ] "Publicada en la web" arranca **sin tildar**. Creala así: queda con la marca "Borrador" y **no aparece** en la portada.
41. [ ] Tocá **Publicar**: aparece en la portada y en su página. Se ve a $50 (hoy Infinity no le pasa el cargo de servicio al comprador; si se lo pasara, se vería un poco más).
42. [ ] Hacé la sección 3 (pago con Mercado Pago) con esta fecha.
43. [ ] **Editar**: cambiá el nombre de la entrada y guardá; en la web se ve el nombre nuevo.
44. [ ] Bajá la cantidad por debajo de lo que ya se vendió: muestra un error y no guarda.
45. [ ] **Pausar la venta** (destildar "Venta abierta"): la fecha se sigue viendo, pero al intentar comprar el checkout avisa que la venta está pausada.
46. [ ] Intentá **eliminar** la fecha ya con un pedido: no te deja (tiene ventas). Dejala en **borrador** para que no se vea.
47. [ ] Creá otra fecha, sin ventas, y eliminala: desaparece de la lista.
48. [ ] El **resumen** del panel muestra las ventas reales (la compra del paso 42).

## 7. Panel de la plataforma (lo prueba Franco)

49. [ ] `/plataforma/` pide login y muestra los boliches.
50. [ ] En Infinity: datos, comisión, equipo (agregar y quitar a alguien), pedidos y conexiones.
51. [ ] Conexiones → Mercado Pago: muestra la cuenta conectada (cobro directo).

## 8. App instalable

52. [ ] En Android, aparece la opción de instalar; instalada, se abre a pantalla completa con el ícono y el nombre "Infinity".
53. [ ] En iPhone, aparecen las instrucciones para agregarla a la pantalla de inicio.

## 9. Pruebas automáticas del back

Las corre quien tenga el back en su máquina, antes de cada despliegue:

```bash
cd ticketera-core
.venv/bin/python manage.py test catalog backoffice
```

Tienen que pasar todas (hoy son 292). Del front, antes de mergear: `npm run lint` y `npm run build`.

## Lo que todavía no se puede probar

- **`/entrada/[código]`**: muestra datos de prueba hasta que el back tenga el endpoint de entrada suelta.
- **Botón "Conectar Mercado Pago" en el panel**: pendiente; hoy se conecta desde `/plataforma/`.
- **Portada de la fecha y entradas gratis desde el panel**: la API de gestión todavía no las tiene.
- **Portería sin internet**: no guarda nada para después; sin conexión no valida.
