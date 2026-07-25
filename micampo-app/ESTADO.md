# ESTADO — MI CAMPO

> Este archivo se lee ENTERO al arrancar cualquier sesión de trabajo nueva (mía o de otra IA), en vez de releer todo el código. Se actualiza a mano, solo cuando algo real cambia. Si algo de acá no coincide con el código, el código manda — pero avisar para corregir este archivo.

## Qué es
Sistema de gestión agrícola de Fran (CAYFE / campos propios y asociados). Dos puntas: bot de WhatsApp (carga de datos en lenguaje natural, fotos, PDFs) + panel web (`/admin` para Fran, `/productor` para socios).

## Mapa rápido — a dónde ir según lo que hay que tocar

| Si el cambio es sobre... | Mirar primero |
|---|---|
| Panel web (cualquier pestaña, UI, cálculos que corren en el navegador) | `public/admin/app.jsx` → compilar a `app.js` con Babel → subir LOS DOS |
| Cómo el bot interpreta un mensaje de WhatsApp (qué tipos reconoce, qué pregunta si falta algo) | `src/claudeParser.js` (prompt de interpretación) + `src/botHandlers.js` (función `validar()`) |
| Qué hace el bot una vez que ya interpretó el mensaje (guardar, calcular, responder) | `src/botHandlers.js` (funciones `manejarX`) |
| Webhook de WhatsApp, envío de mensajes/imágenes, permisos por número | `src/server.js` |
| Login, roles, sesiones | `src/auth.js` |
| Cualquier lectura/escritura de datos, búsqueda de lotes | `src/db.js` |
| Endpoints del panel (`/api/...`) | `src/api.js` |
| Generación de la imagen de la receta/orden de aplicación | `src/recetaImagen.js` (usa `sharp`) |
| Motor agronómico (Peralta-DISA, balance de riego) | Riego → `botHandlers.js` (servidor). Fertilización → `app.jsx` (navegador, función `CalculoFertilizacion`) |

## Vivo hoy (funciona en producción)
Campos/lotes/ciclos/participación · Riego (balance hídrico completo, agua útil multi-lote por WhatsApp) · WhatsApp (12 tipos de mensaje, multi-lote, manchoneo, token permanente sin vencimiento) · Insumos/Proveedores/Compras con stock por ubicación · Actividades · Tarifario · Usuarios/roles · **Fertilización Trigo** (Peralta-DISA + zonas automáticas) · **Fertilización Maíz** (7 modelos Peralta promediados: Balance MO, Balance Nan, Curva por Zona P75, Curva Única P75, Curva FG/CREA, Curva x RindeObj P90, T0 — verificado contra el Excel de referencia) · Lectura de análisis por foto/PDF (WhatsApp) · Recetas/órdenes por imagen · **Mercado** (precios en vivo con historial propio, relación insumo-producto urea/grano con escala graduada, "invertís en urea vs. te devuelve el trigo" con flete editable) · **Resumen diario automático por WhatsApp** (lun-sáb 7am: 7 noticias entre mercado/clima/geopolítica y regulatorio — Boletín Oficial, Bioagroindustria Córdoba, INASE — vía `src/resumenDiario.js` + cron) · Backup automático diario del `data.json`.

## Explícitamente fuera de alcance
Maquinaria, RRHH, combustible, facturación/AFIP, integraciones oficiales (SENASA/RENSPA), app nativa de celular. Ver diagnóstico técnico completo si hace falta más detalle.

## Riesgos activos (no resueltos todavía)
1. Doble implementación de lectura de análisis (`/api/analizar-foto` del panel vs. flujo WhatsApp) — desincronizadas entre sí, no unificadas todavía.
2. `.env.example` quedó subido en `src/.env.example` en vez de la raíz de `micampo-app/` — funciona igual, pero no es donde debería estar; mover cuando haya oportunidad.
3. Auto-recarga de crédito de Anthropic **no está activada** — si se corta de nuevo el saldo, el bot y Mercado dejan de funcionar sin aviso previo. Activar en console.anthropic.com → Settings → Billing.
4. Antecesor "Garbanzo" en la fórmula de Maíz tiene N extra = 20 (igual que gramíneas), lo cual es raro agronómicamente (las demás leguminosas están en 0) — Fran lo dejó así "por ahora", pendiente de confirmar si es un error de carga en su Excel original o es correcto.
5. WhatsApp: la cuenta sigue en modo **de prueba** (no producción) — solo unos pocos números autorizados a la vez. Migrar a número de producción real es un paso pendiente para poder sumar a los ~10 usuarios (empleados/productores).
6. A partir del 1° de octubre de 2026 Meta empieza a cobrar también los mensajes de servicio salientes (hoy son gratis dentro de la ventana de 24hs) — evaluar impacto cuando llegue esa fecha.

## Resueltos recientemente (ya no son riesgo)
`sharp` en `package.json` ✅ · `app.jsx` sincronizado con `app.js` real ✅ (compila idéntico, verificado) · Backup automático ✅ · Token de WhatsApp permanente ✅ · Bug de "9" en normalización de número (bot no respondía) ✅.

## Cómo se despliega
Editar en GitHub (web) → en el servidor: `mc` (alias de `cd /root/mi-campo-app-repo/micampo-app && git pull && pm2 restart micampo`) → verificar con `pm2 status`.

## Pendientes anotados (no urgentes, no perder de vista)
- Costo de riego eléctrico vía foto de factura de luz por WhatsApp.
- Nivel de acceso "empresario" (vista de alto nivel, sin definir todavía).
- PWA / logo (rechazado, a retomar).
- Migrar WhatsApp a número de producción real (ver riesgo #5 arriba).
- Considerar activar Stooq/MatbaRofex como fuente de precios CBOT real en vez de solo búsqueda por IA (evaluado, no implementado — agrega mantenimiento, ver `DECISIONES.md`).
