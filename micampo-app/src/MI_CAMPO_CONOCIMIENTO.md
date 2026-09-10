# MI CAMPO — Conocimiento acumulado (para el proyecto de Claude)

_Compilado el 7/9/2026, cubre lo trabajado en sesiones de chat individuales antes de armar el proyecto._

---

## 1. Qué es MI CAMPO

Sistema propio de administración agropecuaria de Fran (distinto de CAYFE Export S.A., donde trabaja como agrónomo). Dos piezas:
- **Bot de WhatsApp**: la vía principal de carga de datos día a día (riego, siembra, fertilización, pulverización, compras, análisis de suelo/agua, consultas).
- **Panel web** (`/admin` para Fran, `/productor` para socios): visualización, cálculos, tarifarios, configuración.

**IMPORTANTE — leer primero:** el repo tiene 3 documentos que son la fuente de verdad real, más actualizados y confiables que reconstruir desde chats viejos:
- `ESTADO.md` — estado actual, mapa de archivos, riesgos activos
- `DECISIONES.md` — por qué las cosas no obvias están hechas así
- `GLOSARIO.md` — vocabulario del negocio (manchoneo, Zona 1/2, Peralta −8%, etc.)

Pedirle a Fran `cat ESTADO.md`, `cat DECISIONES.md`, `cat GLOSARIO.md` desde `/root/mi-campo-app-repo/micampo-app` en la consola del servidor es más confiable que reconstruir desde memoria de chats.

---

## 2. Infraestructura y archivos

- Servidor: DigitalOcean "Mi-Campo-Bot", IP 159.65.227.79, sitio en `https://159.65.227.79.nip.io` (Caddy + nip.io, sin dominio propio).
- Deploy: editar en GitHub → commit → en el servidor correr `mc` (alias de `cd /root/mi-campo-app-repo/micampo-app && git pull && pm2 restart micampo`) → verificar con `pm2 status`.
- **Hábito crítico**: el panel se edita en `public/admin/app.jsx` pero el navegador carga `public/admin/app.js` (no hay build en el servidor). Los dos archivos siempre se suben juntos, idénticos.
- Mapa de archivos: `src/server.js` (Express + webhook WhatsApp), `src/api.js` (endpoints del panel), `src/auth.js` (login), `src/botHandlers.js` (lógica de negocio de cada tipo de mensaje), `src/claudeParser.js` (todos los llamados a IA: interpretar mensajes, visión, búsqueda de Mercado), `src/db.js` (lectura/escritura de datos, búsqueda de lotes), `src/recetaImagen.js`, `src/resumenDiario.js`, `src/seed.js`.
- Dato: un solo `data/data.json` plano (no hay base de datos real — decisión deliberada, bajo volumen), backup diario automático (30 días).
- Scripts de carga puntual (`scripts/cargar*.js`, `scripts/corregir*.js`): se usan UNA VEZ para poner al día algo grande (siembras, compras, pulverizaciones históricas), no son parte del flujo normal. Todos con patrón dry-run / `--commit`, e idempotentes (no duplican si se corren de nuevo).

---

## 3. Datos reales — nombres y estructura

**Convención de nombres de lote con dueño**: varios campos con más de un socio nombran los lotes como "Código (Apellido)" — ej El Rosario: `C1 (Cadamuro)`, `C2 (Cadamuro)`, `C3 (Peressini)`, `C4 (Peressini)`, `C5 (Peressini)`, `Secano (Cadamuro)`, `Secano (Peressini)`. **Nunca adivinar el nombre exacto — pedir captura del panel si hay dudas.**

**Campos/lotes confirmados** (no exhaustivo, los que salieron hoy):
- **El Rosario**: C1-C5 (Cadamuro/Peressini como arriba), Secano (Cadamuro), Secano (Peressini). 545ha, 7 lotes.
- **La Nazarena**: C1, C2, C3 (105/105/35ha), Secano (Oeste) (47→43ha, corregido), Secano Resto (Sur, Este y Norte). 452ha, 5 lotes.
- **Cravero**: campo "Cravero", un solo lote "Cravero (Montoya)" de 200ha, Secano. Ojo: en sesiones viejas de fertilización este mismo lote aparecía referenciado como campo "Montoya" con sub-lotes "1 (Sur)"/"2" de 100ha c/u — es el MISMO lote físico, dos formas de nombrarlo en distintos contextos.
- **Micolini**: lotes "1", "2 (Norte)".
- **Bustamante**: "Secano", "C3".
- **Saúl**: "1 (contra silvina)", "2 (contra bracco)", "3 (Contra pueblo)", "4 (calle)".
- **La Silvina**: "C1", "C2", "Secano".
- **El Guri**, **Sanchez**, **Lelo Vaca**: un solo lote cada uno, nombrado "1".
- **Guma** (lote "Siton"), **Maldonado** (lote "1"): agregados 7/9.

**Grupos de riego** (tarifario, no todos los lotes asignados): Riego Candelaria (eléctrico: La Silvina C1/C2, Bustamante C3, Efraín C4/C5), La Nazarena, El Rosario Bomba Este, El Rosario Bomba Oeste. Cada uno con tarifa "estimativa" (a mano) o "calculada" (de factura, pendiente de implementar del todo). Láminas: El Rosario 6,9mm/día, La Nazarena 5mm/día, La Silvina 7,2mm/día.

**Insumos con nombre unificado** (para que compras y aplicaciones apunten al mismo insumo, independiente de la marca comercial): Glifosato (agrupa Roundup Top, Platinum II, Control Max, La Tijereta Box, Power Plus II — todos "la misma concentración, se toma igual por ahora"), Urea, Nitrocomplex, Atrazina, Dicamba, Finesse, 2,4-D, **2,4-D Enlist** y **2,4-D ME** (Éster Metílico) — estos tres son productos DISTINTOS, no mezclar, Flumioxazim, Prometrina, Paraquat, Terbutilazina, Estabilizador de mezcla, Stern (mismo principio activo que Finesse, pero se lleva aparte por ser otra marca), Aceite Harrier, MCPA Amina, Flurocloridona, Curasemillas Amigo, Rizopack Garbanzo 313, K-Obiol.

**Proveedores de insumos**: Lartirigoyen (el principal), Nutritec, S.A.C., Grain.

---

## 4. Funcionalidades — estado completo

- **Campos y lotes**: alta/edición, participación de socios, ciclos de cultivo (con alerta si queda más de uno abierto a la vez), agua útil, orden natural (Lote 1 antes que Lote 2).
- **Riego**: balance completo (agua útil + riego + lluvia vs. objetivo por cultivo), múltiples lecturas en un mismo mensaje de WhatsApp (distintos lotes/fechas), no duplica automáticamente, tarifa por grupo de riego (con override por bomba específica en el mensaje, ej "bomba este").
- **Fertilización**: Trigo (Peralta-DISA, Zona 1/Zona 2 automáticas según 2 muestras, modo "Peralta" y "Peralta −8% calibrado" — este último es el estándar desde julio 2026), Maíz (7 modelos promediados, validado contra el Excel de Fran). Modo extra "Rendimiento con dosis fija" (inverso: dado un kg de urea, cuánto rinde). Cartel de "Urea a comprar" agregando todos los lotes de Trigo con datos completos.
- **Pulverización**: multi-lote en un mismo mensaje (reparte insumos proporcional a hectáreas reales), multi-producto, apodos de insumos reconocidos automáticamente, detecta manchoneo (<60% de cobertura) — **solo para pulverización**, no para otras actividades.
- **Compras/Insumos**: precio contado y financiado por separado (nunca se mezclan ni se promedian), tasa de interés como texto libre, estado retirado/pendiente (solo suma a stock si está retirado), "Marcar como retirado" desde el panel o por WhatsApp ("retiré de Grain todo lo pendiente").
- **Consultas por WhatsApp**: resumen de un lote puntual o de todos, formato en viñetas (siembra, rto objetivo, fertilizante a aplicar, agua útil, riego aplicado, riego faltante, gasto riego/ha).
- **Mercado**: precios de Rosario (BCR) y Chicago (CBOT) comparados (no uno como reemplazo del otro), precio de urea explícito, relación insumo/producto para trigo.
- **Tarifario**: labores (incluye "Monitoreo" para la mano de obra propia de Fran, USD/ha), grupos de riego, campo de "Gastos de administración y estructura" (cargado, todavía sin aplicar automáticamente a los cálculos de costo).
- **Permisos**: por tipo de mensaje y número de WhatsApp — empleados solo cargan (riego, pulverización, pesadas de cosecha a futuro), nunca ven resúmenes; socios podrían tener panel restringido a sus campos + consulta libre por WhatsApp (visión a futuro, no implementado aún).

---

## 5. Bugs encontrados y arreglados hoy — el patrón importa más que la lista

La mayoría de los bugs de hoy comparten una causa de fondo: **funciones que "adivinan por parecido" en vez de fallar limpio cuando falta un dato**. Vale la pena tenerlo en mente para lo que sigue apareciendo:

1. **Ciclos de cultivo duplicados** (dos ciclos abiertos a la vez en un lote) — `cicloActivo()` tomaba el primero de la lista en vez del más reciente. Arreglado + alerta visible si vuelve a pasar.
2. **Riego confundido con agua útil** en las respuestas del bot — nombres de campo ambiguos en el contexto que se le pasa a la IA. Arreglado con nombres de campo explícitos (`aguaUtilDelSueloMm_NO_es_riego`, etc.) — y ese MISMO bug (tratar un número como si fuera un objeto `{promedio, fecha}`) apareció DOS VECES en distintos lugares del código.
3. **Riego/lluvia/pulverización/fertilización duplicados** — no había ningún chequeo antes de guardar. Arreglado con firma (lote+fecha+productos+cantidades) para las 4 actividades.
4. **2,4-D mezclado con 2,4-D Enlist** — la búsqueda de insumo por texto parcial hacía que "2,4-D" matcheara con "2,4-D Enlist" (substring). Cambiado a coincidencia exacta en la carga de pulverizaciones. Costó separar 12 filas ya cargadas mal con un script de corrección aparte.
5. **Unidad de insumo pegajosa** — Atrazina quedó con unidad "L" por defecto aunque siempre se carga en kg, porque la función que crea insumos nuevos hardcodeaba "L". Las respuestas del bot mostraban la unidad GUARDADA del insumo en vez de la que el mensaje decía esa vez — corregido para que cada actividad muestre la unidad real de ese mensaje.
6. **Hectáreas reales ignoradas** — el bot solo guardaba el número de hectáreas que decías si "parecía" una aplicación parcial; si no, tiraba tu dato y usaba el (a veces desactualizado) tamaño del lote en el sistema. Corregido: el número que da el mensaje siempre vale.
7. **Mismo producto en dos unidades en un mensaje** (ej "120L glifo" y "30kg glifo") se sumaba sin sentido (150). Ahora el bot pregunta si son dos productos comerciales distintos en vez de sumarlos.
8. **Campo sin lote especificado no resolvía**, aunque ese campo tuviera un solo lote posible (ej "Guma" solo, sin decir el lote "Siton"). Dos funciones distintas tenían el mismo problema (`buscarLotes` y `resolverLote`) — la segunda ni siquiera llegaba a intentar la búsqueda si el nombre de lote venía vacío.
9. **Preguntas del bot que quedan trabadas para siempre** — cuando una pregunta de desambiguación no se contesta exactamente como se pide, el bot vuelve a guardar la pregunta con un timestamp nuevo cada vez, así que el timeout de 10 minutos nunca se cumple. Se agregó una palabra de escape: escribir **"cancelar"** (o "olvidalo", "dejalo", "salir", "reset") limpia cualquier pregunta pendiente al instante.
10. **Desambiguación de mensajes con varios lotes a la vez no se reconstruye bien** — si un mensaje de riego/pulverización con VARIOS lotes queda ambiguo en uno de ellos, contestar la aclaración no relaciona bien la respuesta con el resto del mensaje original. **Este quedó identificado pero sin arreglar de fondo** — por ahora la salida es cancelar y reenviar los lotes por separado.
11. **Manchoneo apareciendo en actividades que no son pulverización** — el cálculo de cobertura (hectáreas reales vs. tamaño del lote) se aplicaba a cualquier actividad. Ahora solo a pulverización.
12. **Densidad de siembra con unidad inventada** ("pl/m2" en vez de kg/ha o semillas/ha) — el bot no sabía qué unidad de densidad corresponde a cada cultivo. Corregido: Trigo = kg/ha, Garbanzo = semillas/ha.
13. **Riego faltante mal calculado** en el resumen del bot — restaba solo el riego aplicado del objetivo, sin descontar el agua útil ya en el perfil. Corregido para usar el mismo balance completo que ya usaba el panel.

---

## 6. Decisiones de diseño y supuestos aceptados (no son bugs, son elecciones)

- **Costo promedio de insumos siempre usa precio CONTADO**, nunca el financiado — el costo de financiación es aparte, no forma parte del costo del producto.
- **Flujo físico de stock**: Proveedor (pendiente) → retiro → Planta o directo a Campo → traslado Planta→Campo → solo el stock de Campo se puede consumir en una aplicación. (Este circuito de traslados entre ubicaciones existe en el modelo pero está poco usado en la práctica todavía.)
- **Peralta −8% (calibrado)** es el método estándar de Fran desde julio 2026, no el original — surge de comparar 3 lotes de la campaña pasada con rinde conocido, dio -4% de desvío promedio, se usa -8% como margen conservador. Diferencia real entre las dos versiones: 10-25kg urea/ha en la mayoría de los lotes.
- **Maíz — el modelo genérico de mercado se sacó** (7/9): al evaluar la respuesta marginal a una dosis fija de urea en escenarios de cero N disponible, las curvas "por zona" y "única" daban resultados fuera de rango (45-54 kg grano/kgN, anormalmente alto) comparado con las curvas de balance simple y la curva propia de Fran (27-36 kg grano/kgN, más razonable). El modelo de maíz POR LOTE (con datos reales de suelo) sigue validado y anda bien — el problema es solo el escenario genérico "sin datos" para el cartel de Mercado.
- **Glifosato/Atrazina en distintas formulaciones (líquida/sólida) se tratan como el mismo insumo por ahora** — mismas concentraciones, se revisará cuando se carguen más compras.
- **Empleados nunca ven costos** en las confirmaciones de WhatsApp de riego/siembra/fertilización/pulverización (sí en compras y aportes, que son inherentemente sobre plata).

---

## 7. Backlog pendiente (en orden)

1. **Cosecha** — cargar (dejado para el final a propósito).
2. **Aplicar "Gastos de administración y estructura"** a los cálculos de costo (dividido por cantidad de ciclos del lote en el año) — el campo ya existe en Tarifario, falta la lógica.
3. **Costo real vs. presupuestado por lote** — no existe el concepto de presupuesto todavía.
4. **Rentabilidad/márgenes con y sin financiación** — usar el texto de financiación ya guardado en cada compra.
5. **Tarifario de riego — modo "calculado" de factura real**: Riego Candelaria = (factura de luz del mes − IVA) convertida a USD (BNA divisa del primer día hábil del mes) ÷ ha×mm regados ese mes en los 5 lotes del grupo. El Rosario Bomba Este/Oeste: falta definir si el costo sale de tickets reales de gasoil o de la tasa de consumo (litros/hora × lámina). Antes de programar, hacer una prueba manual con una factura de luz real.
6. **Arreglar de fondo la desambiguación multi-lote** (bug #10 de la lista de arriba).
7. **Revisar si quedan más productos con nombres cruzados** por el mismo patrón que el de 2,4-D/Enlist (búsqueda por texto parcial) — no se hizo un barrido completo de todos los insumos, solo el que Fran detectó a simple vista.

---

## 8. Visión de reorganización de fondo (no urgente, para cuando se termine de cargar todo)

Hoy la app organiza por **tipo de dato** (una pestaña de Riego, otra de Fertilización, etc.) — hay que ir a buscar cada pedacito a mano. La idea de fondo, cuando se encare:

**Unidad central: el lote-campaña**, no el tipo de dato — entrar a un lote y ver toda su línea de vida junta: **Planificación → Siembra → Manejo (riego+fertilización+protección) → Cosecha → Cierre productivo**.

**Dos grandes áreas**: Producción (todo lo anterior) y Comercial/financiero (insumos, compras, proveedores, tarifario, costos y presupuesto) — se tocan solo en un punto: el rinde final de cada lote alimenta el costo real.

**Modelo de roles**: Fran (todo), Socios (panel restringido a sus campos, ven producción y costos pero no de otros socios, + consulta libre por WhatsApp), Empleados (sin panel, solo cargan por WhatsApp lo operativo — riego, pulverización, pesadas de cosecha — nunca siembra/fertilización, sin ver nada de vuelta salvo la confirmación).

**Decisión marco**: primero terminar de cargar toda la información pendiente con la estructura actual, recién después encarar este rediseño — no mezclar las dos cosas.

---

## 9. Cómo seguir trabajando (acuerdos de proceso)

1. Cargar datos reales primero, corregir sobre la marcha — los bugs de verdad aparecen recién con datos reales adentro.
2. Pausar solo ante pedidos grandes y nuevos, no en cada bug chico — anotarlo para después.
3. Podar funciones no usadas mediante revisión conjunta periódica (Fran + Claude, desde los dos lados) — no podar unilateralmente.
4. Nombres de lote exactos siempre, nunca adivinar — pedir captura si hay duda (el buscador tolera typos y falta/sobra de paréntesis, pero ante la duda, confirmar igual).
5. La carga del día a día es por WhatsApp — los scripts de carga masiva son solo para ponerse al día con el pasado.
6. El resumen del sistema tiene que servir para 3 momentos distintos: chequeo rápido diario, foto completa de un lote puntual, cierre de campaña — pensar cuál de los tres cubre cada cosa que se construye.
7. **Probar las cuentas numéricas antes de entregar el código**, no solo que compile — varios bugs de hoy fueron fórmulas mal aplicadas, no errores de tipeo.
