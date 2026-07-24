# MI CAMPO

Sistema de gestión agrícola de Fran (CAYFE / campos propios y asociados). Bot de WhatsApp para cargar datos en lenguaje natural (texto, fotos, PDFs) + panel web (`/admin` para Fran, `/productor` para socios).

**Para el estado actual del proyecto, riesgos conocidos, y a dónde ir según lo que quieras tocar: ver [`ESTADO.md`](./ESTADO.md).**
**Para el porqué de decisiones no obvias: ver [`DECISIONES.md`](./DECISIONES.md).**
**Para vocabulario específico del negocio: ver [`GLOSARIO.md`](./GLOSARIO.md).**

## Stack

Node.js + Express (backend) · React 18 vía CDN, sin build tool (frontend) · JSON plano como base de datos (`data/data.json`) · WhatsApp Cloud API (Meta) · Anthropic API (interpretación de mensajes, visión, búsqueda web) · DigitalOcean + PM2 + Caddy (infraestructura).

## Cómo correr el proyecto localmente (desarrollo)

```bash
cd micampo-app
npm install
cp .env.example .env   # completar con tus propias claves
node src/seed.js admin "Tu Nombre" "usuario" "contraseña"
node src/server.js
```

## Cómo actualizar el servidor de producción (lo normal, día a día)

1. Editar el código en GitHub (interfaz web) y hacer commit.
2. En la Web Console de DigitalOcean, correr:
   ```bash
   mc
   ```
   (alias configurado en el servidor para `cd /root/mi-campo-app-repo/micampo-app && git pull && pm2 restart micampo`)
3. Si tocaste el panel (`public/admin/app.jsx`), compilarlo a `app.js` con Babel y subir **los dos archivos juntos** — es un hábito obligatorio, ver `ESTADO.md`.

Confirmar que quedó bien:
```bash
pm2 status
```

## Estructura

```
micampo-app/
├── public/
│   ├── admin/        → panel de administrador (app.jsx fuente, app.js compilado)
│   ├── productor/     → panel de productor
│   └── login.html
├── src/
│   ├── server.js      → servidor Express + webhook de WhatsApp
│   ├── api.js         → endpoints del panel (/api/...)
│   ├── auth.js        → login y sesiones
│   ├── botHandlers.js → lógica de negocio del bot (validar, procesar cada tipo de mensaje)
│   ├── claudeParser.js→ todas las llamadas a la IA (interpretar mensajes, visión, mercado)
│   ├── db.js          → lectura/escritura de datos, búsqueda de lotes
│   ├── recetaImagen.js→ generación de la imagen de órdenes de aplicación
│   ├── resumenDiario.js → script del resumen diario por WhatsApp (corre por cron, no por el server)
│   └── seed.js         → crear usuarios desde la terminal
└── data/               → datos reales (no se sube a git)
```

## Backup

Corre automático todos los días a las 3am (`/root/backup_micampo.sh`, programado con `crontab`). Copias en `/root/backups-micampo`, se borran solas las de más de 30 días.

## Resumen diario por WhatsApp

`src/resumenDiario.js` corre por `cron` (lunes a sábado, 7am), no por el servidor web — manda un resumen de precios, factores de mercado y novedades regulatorias al número configurado en `RESUMEN_DIARIO_NUMERO`.
