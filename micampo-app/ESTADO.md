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
Campos/lotes/ciclos/participación · Riego (balance hídrico completo) · WhatsApp (12 tipos de mensaje, multi-lote, manchoneo) · Insumos/Proveedores/Compras con stock por ubicación · Actividades · Tarifario · Usuarios/roles · Fertilización Trigo (Peralta-DISA + zonas automáticas) · Lectura de análisis por foto/PDF (WhatsApp) · Recetas/órdenes por imagen · Mercado (con fallas de estabilidad recientes, en revisión)

## Explícitamente fuera de alcance
Maquinaria, RRHH, combustible, facturación/AFIP, integraciones oficiales (SENASA/RENSPA), app nativa de celular. Ver diagnóstico técnico completo si hace falta más detalle.

## Riesgos activos (no resueltos todavía)
1. `sharp` no está en `package.json` (usado en `recetaImagen.js`) — causa real de una caída de producción.
2. `app.jsx` puede desincronizarse de `app.js` si no se suben juntos — **hábito obligatorio: siempre los dos juntos**.
3. Sin backup automático de `data/data.json` — es el único lugar donde vive todo el histórico.
4. Token de WhatsApp de prueba vence cada 24hs — sin token permanente configurado.
5. Doble implementación de lectura de análisis (`/api/analizar-foto` del panel vs. flujo WhatsApp) — desincronizadas entre sí.

## Cómo se despliega
Editar en GitHub (web) → en el servidor: `mc` (alias de `cd /root/mi-campo-app-repo/micampo-app && git pull && pm2 restart micampo`) → verificar con `pm2 status`.

## Pendientes anotados (no urgentes, no perder de vista)
- Fórmula Peralta-DISA para Maíz.
- Costo de riego eléctrico vía foto de factura de luz por WhatsApp.
- Nivel de acceso "empresario" (vista de alto nivel, sin definir todavía).
- PWA / logo (rechazado, a retomar).
