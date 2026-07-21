# MI CAMPO — Sistema completo (bot + panel con login)

Reemplaza al bot que ya tenías corriendo. Incluye:
- El mismo bot de WhatsApp de antes (sin cambios de comportamiento)
- Panel web en `/admin` (todo lo que ya conocías, ahora con Usuarios y Consultas)
- Panel en `/productor` para que cada productor entre con su propio usuario y vea solo lo suyo
- Login obligatorio para entrar a cualquiera de los dos paneles

## Paso 1 — Subir el código a GitHub (una sola vez)

1. Andá a **github.com**, creá una cuenta si no tenés (gratis).
2. Arriba a la derecha, `+` → **"New repository"**.
3. Nombre: `micampo-app`. Dejalo **público** (el código no tiene contraseñas ni datos adentro, todo eso vive aparte en el servidor). Creá el repositorio.
4. En la página del repositorio recién creado, buscá el link **"uploading an existing file"**.
5. Descomprimí el archivo `micampo-app.zip` que te pasé en tu computadora.
6. Arrastrá **la carpeta entera descomprimida** (o todos los archivos y carpetas de adentro) a esa página de GitHub.
7. Abajo, botón verde **"Commit changes"**.

Con eso el código ya está en GitHub, listo para bajarlo al servidor con un solo comando.

## Paso 2 — Actualizar el servidor

Conectate a la Web Console de tu Droplet en DigitalOcean y corré, en orden:

```bash
# Frenar el bot viejo
pm2 stop micampo-bot
pm2 delete micampo-bot

# Bajar el código nuevo
cd /root
git clone https://github.com/TU_USUARIO/micampo-app.git
cd micampo-app

# Instalar dependencias
npm install

# Traer las credenciales que ya tenías configuradas
cp ../micampo-bot/.env .env
```

Ahora agregá una línea nueva al `.env` (la clave de sesión), y migrá los datos que ya cargaste con el bot viejo:

```bash
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
mkdir -p data
cp ../micampo-bot/data.json data/data.json 2>/dev/null || echo "no había datos previos, arranca vacío"
```

## Paso 3 — Crear tu usuario administrador

```bash
node src/seed.js admin "Fran" "fran" "ElijeUnaClaveSegura123"
```

Cambiá `"fran"` por el nombre de usuario que quieras, y la contraseña por una que vayas a recordar (guardala en algún lado seguro).

## Paso 4 — Prender el sistema

```bash
pm2 start src/server.js --name micampo
pm2 save
```

## Paso 5 — Probar

Andá a **https://159.65.227.79.nip.io** en el navegador — te debería aparecer la pantalla de login. Entrá con el usuario y contraseña que creaste en el Paso 3.

El bot de WhatsApp sigue funcionando exactamente igual que antes (mismo webhook, misma URL), no hace falta tocar nada en Meta.

## Crear accesos para productores

Una vez adentro del panel admin, andá a la pestaña **"Usuarios"** — ahí podés crear un login para cada productor, eligiendo a qué cliente queda asociado. Ese productor va a entrar por el mismo link, con su usuario y contraseña, y automáticamente va a ver solo sus campos.

También podés crearlos por comando, si preferís:
```bash
node src/seed.js productor "Nombre del productor" "usuario_productor" "clave123" ID_DEL_CLIENTE
```
(corriendo `node src/seed.js` sin nada más te muestra la lista de IDs de clientes disponibles)

## Actualizar el código más adelante

Cuando le agreguemos alguna función nueva, el proceso es simple:
```bash
cd /root/micampo-app
git pull
pm2 restart micampo
```
