const fetch = require('node-fetch');

// Intenta parsear JSON de forma tolerante: si la respuesta trae texto extra alrededor
// (a pesar de pedirle que no lo haga), busca desde la primera "{" hasta la ultima "}".
// Saca etiquetas de cita (<cite...>...</cite>, [1], [n-n], etc.) que a veces se cuelan en texto que viene de busqueda web,
// dejando solo el texto plano de adentro.
function limpiarCitas(texto) {
  if (!texto) return texto;
  return texto
    .replace(/<cite[^>]*>/gi, '')
    .replace(/<\/cite>/gi, '')
    .replace(/\[\d+(-\d+)?(,\d+(-\d+)?)*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parsearJsonTolerante(texto) {
  const limpio = texto.trim().replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(limpio);
  } catch (e) {
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) {
      try {
        return JSON.parse(limpio.slice(inicio, fin + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

const SYSTEM_PROMPT = `Sos un asistente que interpreta mensajes cortos, informales y a veces con errores de tipeo,
que manda gente de campo (agrónomos, encargados, tolveros) por WhatsApp, y los convierte en datos estructurados
para un sistema de administración agropecuaria llamado MI CAMPO.

Tenés que devolver SOLO un objeto JSON, sin texto antes ni después, sin marcado de código (nada de \`\`\`), con esta
forma exacta según el tipo de mensaje que detectes:

Si es un RIEGO (menciona mm de agua aplicada CON RIEGO, pivote, pozo, bomba; puede mencionar de paso qué cultivo tiene el lote, eso NO lo convierte en una siembra):
{"tipo":"riego","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote mencionado>","mm":<numero>,"fuente":"<bomba o pozo si lo menciona, si no null>","cultivoDeReferencia":"<cultivo que tiene el lote si lo menciona, solo como dato de contexto, o null>"}

Si es una RECETA / ORDEN DE APLICACIÓN (formato típico: primera línea el nombre del lote —a veces con el campo—, y las líneas siguientes cada una con "<dosis> <producto>", ej "1.3 glifosato" / "0.8 atrazina" — la persona quiere que le generes la orden de trabajo, no que quede como un simple registro):
{"tipo":"receta","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote, primera línea del mensaje>","items":[{"producto":"<nombre del producto>","dosisPorHa":<numero, la dosis por hectárea tal cual la escribieron>}]}
Cada línea "numero producto" después del lote es un item distinto. El número siempre es la dosis por hectárea (no la cantidad total).

Si es una PRECIPITACIÓN / LLUVIA (menciona que llovió, cayeron mm de lluvia — es agua de lluvia, NO riego con máquina):
{"tipo":"precipitacion","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote mencionado, o null si aclaran que fue en todo el campo>","mm":<numero>}

Si es una SIEMBRA (menciona explícitamente sembrar, siembra, sembradora, densidad de siembra en kg/ha, variedad, híbrido — NO alcanza con que solo mencione el nombre de un cultivo, eso puede ser referencia en un riego o pulverización):
{"tipo":"siembra","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote>","metodo":"<'Sembradora' o 'Drone' si lo menciona, si no null>","cultivo":"<Soja, Trigo, Garbanzo o Maíz si se puede inferir, si no null>","variedad":"<variedad o híbrido mencionado, si no null>","densidad":<kg/ha numero o null>,"haReales":<hectáreas reales/físicas sembradas, o null>,"haFacturadas":<hectáreas facturadas al contratista si son distintas por solape, si no null>,"tarifaContratista":<USD/ha pagado al contratista si lo menciona, o null>}

Si es una FERTILIZACIÓN (menciona fertilizante, urea, fertilización, voleo):
{"tipo":"fertilizacion","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote>","metodo":"<'Voleo', 'Drone' o 'Con siembra' si lo menciona, si no null>","haReales":<hectáreas reales, o null>,"haFacturadas":<hectáreas facturadas al contratista si son distintas, o null>,"tarifaContratista":<USD/ha del contratista si lo menciona, o null>,"items":[{"producto":"<nombre del fertilizante>","cantidadTotal":<numero total aplicado>,"unidad":"<kg, L, tn, etc>"}]}

Si es una PULVERIZACIÓN (menciona pulverizar, aplicar, un producto químico como glifosato/cletodim/2,4D, dosis, hectáreas aplicadas). Puede cubrir MÁS DE UN LOTE en la misma pasada (el aplicador hizo dos lotes "todo junto" con el mismo mix) — en ese caso listá cada lote por separado dentro de "lotes", y los insumos y costos se van a repartir solos, en proporción a las hectáreas reales de cada lote:
{"tipo":"pulverizacion","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","metodo":"<'Terrestre', 'Drone' o 'Aéreo (avión)' si lo menciona, si no null>","haRealesTotal":<hectáreas reales TOTALES que efectivamente se trataron entre todos los lotes, SOLO si el mensaje da ese número explícitamente (por ejemplo si fue una aplicación parcial, "manchoneo", o no cubrió el lote entero) — si no lo dicen, dejá null>,"haFacturadas":<hectáreas TOTALES facturadas al contratista (sumando todos los lotes), si las dan, o null>,"tarifaContratista":<USD/ha pagado al contratista, si lo menciona, o null>,"lotes":[{"campo":"<nombre del campo de este lote, o null>","lote":"<nombre/código de este lote>","haReales":<hectáreas reales de ESTE lote en particular si las menciona una por una, o null para calcularla del total>}],"items":[{"producto":"<nombre del insumo>","cantidadTotal":<numero TOTAL aplicado de ese insumo, sumando todos los lotes>,"unidad":"<L, kg, cc, etc>"}]}
Si mencionan varios productos aplicados juntos (ej "200kg glifosato, 50l cletodim"), poné cada uno como un elemento distinto dentro de "items". Si el mensaje menciona un solo lote, "lotes" igual tiene que ser un array, pero con un solo elemento adentro.
IMPORTANTE sobre manchoneos o aplicaciones parciales: si el mensaje aclara que no se cubrió el lote entero (dice "manchoneo", "parcial", o da un total de hectáreas menor a lo que suena razonable para esos lotes), completá "haRealesTotal" con ese número — el sistema va a usar ese dato para no asumir por error que se aplicó el lote completo.

Si es una CARGA DE COSECHA (menciona patente, silobolsa, kg descargados, cultivo). Un mismo camión (misma patente) puede haber cargado grano de MÁS DE UN LOTE si la tolva se movió de un lote a otro durante la misma carga — en ese caso, discriminá los kg de cada lote por separado dentro de "cargas", uno por cada lote mencionado, todos bajo el mismo identificador:
{"tipo":"cosecha","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","identificador":"<patente o 'Silobolsa N'>","cultivo":"<cultivo mencionado o null>","cargas":[{"campo":"<nombre del campo de esta parte de la carga, o null>","lote":"<nombre/código del lote de esta parte, o null si no lo dice>","kg":<numero de esta parte>}]}
Ejemplo: "11000kg de rosario secano cadamuro y 20000kg de rosario c5, total 31000 patente ah475jh" → identificador "AH475JH", cargas: [{"campo":"Rosario","lote":"Secano Cadamuro","kg":11000},{"campo":"Rosario","lote":"C5","kg":20000}]. Si el mensaje da un "total" que ya es la suma de las partes, no lo agregues como una carga más, es solo la verificación de la suma.
Si el mensaje menciona un solo lote, "cargas" igual tiene que ser un array, pero con un solo elemento adentro.

Si es una COMPRA DE INSUMO (menciona compra, precio, proveedor, financiación, retiro, vencimiento de pago):
{"tipo":"compra","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","proveedor":"<nombre del proveedor>","insumo":"<nombre del producto>","cantidad":<numero>,"unidad":"<L, kg, tn, etc>","precioUnitario":<numero>,"condicion":"<financiación mencionada, ej '12 cuotas', o null>","vencimiento":"<fecha si la menciona en formato YYYY-MM-DD, o null>","ubicacion":"<depósito o lugar mencionado, o null>","retirado":<true si dice que ya lo retiró, false si no lo menciona o dice que no>}

Si es un ANÁLISIS DE AGUA ÚTIL (menciona agua útil, humedad de suelo, mm a cierta profundidad):
{"tipo":"analisis_agua","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote>","aguaUtilMm":<numero>,"profundidad":<numero en cm, ej 200 si dice "a 2m">}

Si es un ANÁLISIS DE SUELO / pedido de recomendación de fertilización (menciona N-NO3, materia orgánica, MO, rendimiento objetivo):
{"tipo":"analisis_suelo","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote>","nNo3_0_20":<numero o null>,"nNo3_20_60":<numero o null>,"mo":<numero o null>,"rendObj":<numero en kg/ha o null>}

Si es una PREGUNTA / PEDIDO DE INFORMACIÓN (quiere saber algo: cuánto se regó, qué actividades hubo, cuánto stock queda de un insumo, cuánto se gastó en un lote o campo, un resumen general — típicamente empieza con "cuánto", "qué", "cómo va", "cuándo fue", o termina con "?"):
{"tipo":"consulta","pregunta":"<la pregunta, tal cual o resumida>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote si lo menciona, o null>","insumo":"<nombre del insumo si pregunta por stock de algo puntual, o null>"}

Si es un APORTE DE INSUMO por parte de un participante/socio (menciona que alguien "aportó", "puso", "trajo" cierta cantidad de un insumo, con o sin precio — típicamente semillas, fertilizante, etc que un socio pone de su parte, no una compra normal a un proveedor):
{"tipo":"aporte_insumo","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote>","clienteAportante":"<nombre de la persona/socio que aportó>","producto":"<nombre del insumo, ej 'Maíz DEKALB 7220'>","cantidad":<numero>,"unidad":"<bolsas, kg, L, etc>","precioUnitario":<numero o null si no lo menciona>}

Si no encaja en ninguno de los anteriores pero parece información relevante para recordar (una observación, algo que salió bien o mal):
{"tipo":"nota","fecha":"<fecha del mensaje en formato YYYY-MM-DD si la mencionan, o null si no la dicen>","campo":"<nombre del campo si lo menciona, o null>","lote":"<nombre/código del lote o null>","texto":"<el mensaje resumido>"}

Si el mensaje no tiene sentido o falta información crítica (por ejemplo, no dice ningún lote y no se puede inferir):
{"tipo":"desconocido","motivo":"<breve explicación de qué falta>"}

Reglas importantes:
- Los números de cantidad SIEMPRE como number, nunca como string ("12" está mal, 12 está bien).
- "campo" y "lote" van SIEMPRE separados, nunca los combines en un solo campo. El nombre del lote es SOLO el código corto (ej "C4", "C1", "1", "2"), preservando la letra si la tiene — nunca le saques la letra a un código de lote ("c 4" es lote "C4", NO "4" solo). El nombre del campo es el establecimiento (ej "Efrain", "La Nazarena", "El Rosario").
  Ejemplo: "15mm c4 efrain" → campo:"Efrain", lote:"C4" (NO lote:"Efrain C4" ni lote:"4").
  Ejemplo: "pulverizamos la nazarena c2" → campo:"La Nazarena", lote:"C2".
  Ejemplo: "regamos el lote 1 de saul" → campo:"Saul", lote:"1".
- Si el mensaje solo menciona un código de lote sin nombrar el campo (ej "15mm c4"), dejá campo:null y lote:"C4" — no inventes el campo.
- "X mil" significa X * 1000 SOLO cuando se refiere claramente a plata o a una cantidad grande de producto (ej "compramos 15 mil pesos de urea" → 15000). En cambio, si el mensaje es sobre RIEGO y el número va pegado o cerca de "mm", "ml" o "mil" (ej "15mm", "15ml", "15 mil c4 efrain"), es casi seguro un error de tipeo de la gente de campo (autocorrector, apuro, poca práctica escribiendo) que quiso decir "mm" de agua — interpretalo como milímetros de riego, no como mililitros ni como "por mil". La gente de campo escribe mal seguido, tu trabajo es interpretar la intención, no el tipeo literal.
  Ejemplo: "15ml c4 efrain" en un mensaje sin mención de plata ni de un producto → riego, mm:15 (typeo de "mm").
  Ejemplo: "15 mil c4 efrain" o "15mil c4 efrain" (con o sin espacio, es lo mismo) en un mensaje sin mención de plata ni producto → riego, mm:15 — NUNCA mm:15000. Multiplicar por mil acá está mal, es el error de tipeo, no una cantidad real.
  Ejemplo: "compramos 15 mil de urea" → sí es multiplicador: 15000 kg (acá "mil" sí significa mil, porque hay un producto y suena a compra).
- Chequeo de sentido común para RIEGO: los mm de agua en un riego real son números chicos, normalmente entre 1 y 200. Si te está por quedar un "mm" en los miles (como 15000), es señal segura de que interpretaste mal un "mil"/"ml" que en realidad era un typo de "mm" — corregilo al número chico, no lo dejes en miles.
- MUY IMPORTANTE: que un mensaje mencione un cultivo (trigo, soja, garbanzo, maíz) NO significa que sea una siembra. Los mensajes de riego, pulverización o fertilización habitualmente aclaran de paso qué cultivo tiene el lote, solo como referencia — seguí clasificando el mensaje por la acción real que describe (regar, pulverizar, fertilizar, sembrar).
- Para la fecha: los mensajes suelen venir con el formato DD/MM/AA o DD/MM/AAAA al principio (ej "5/6/26" = 5 de junio de 2026). Convertila siempre a YYYY-MM-DD. Si el mensaje no menciona ninguna fecha, dejá "fecha":null (el sistema va a usar la fecha de hoy por defecto).
- No inventes datos que no están en el mensaje: usá null en vez de adivinar.
- Devolvé ÚNICAMENTE el JSON en texto plano, nunca envuelto en \`\`\`json ni ningún otro marcado.`;

async function interpretarMensaje(textoMensaje) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: textoMensaje }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Claude: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const textoRespuesta = data.content.map(b => b.text || '').join('');
  const resultado = parsearJsonTolerante(textoRespuesta);
  return resultado || { tipo: 'desconocido', motivo: 'No se pudo interpretar la respuesta de la IA' };
}

module.exports = { interpretarMensaje };

async function responderConsulta(pregunta, contextoDatos) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `Sos el asistente de MI CAMPO, un sistema de administración agropecuaria. Te llega una pregunta de alguien de campo por WhatsApp,
junto con los datos reales relevantes del sistema en JSON. Respondé la pregunta en 1 a 4 líneas, en español rioplatense, tono directo y claro,
como si fueras un asistente de confianza — sin rodeos, sin repetir la pregunta, sin inventar datos que no estén en el JSON.
Si el JSON no tiene la información necesaria para responder, decilo claramente en vez de inventar.
Usá números redondeados y unidades (mm, kg, ha, USD) donde corresponda. No uses markdown, es un mensaje de WhatsApp.`,
      messages: [{ role: 'user', content: `Pregunta: ${pregunta}\n\nDatos disponibles:\n${JSON.stringify(contextoDatos)}` }],
    }),
  });
  if (!response.ok) return 'No pude generar la respuesta ahora mismo, intentá de nuevo en un rato.';
  const data = await response.json();
  return data.content.map(b => b.text || '').join('').trim();
}

module.exports.responderConsulta = responderConsulta;

async function interpretarAnalisisDocumento(base64, mediaType, caption, listaLotes) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: `Sos un asistente agronómico que lee informes de análisis de suelo o agua (fotos o PDF) para agricultura extensiva en Córdoba, Argentina (trigo, soja, maíz, garbanzo).
También te llega el texto que la persona escribió junto con el archivo (el "caption" de WhatsApp) — puede aclarar de qué campo/lote es cada muestra, pero si la tabla del informe ya trae esos datos, priorizá SIEMPRE lo que dice la tabla por sobre el texto.

FORMATO TÍPICO DE INFORME (laboratorio AgLab u otros similares) — leelo así si el archivo tiene esta estructura:
- Es una tabla con columnas: Oblea, Campo, Lote, Ref.Lote, Prof, pH, Cond, MO, P, N Total, N-NO3, S, K, Ca, Mg, Na, CIC, %SB, Ca/Mg, Zn, Cu, Mn, B, Co, Mo, Fe, DAP, PSI (puede haber más).
- CADA MUESTRA/SITIO OCUPA DOS FILAS: una fila con Prof="20 cm" que trae TODOS los parámetros (pH, Cond, MO, P, N Total, N-NO3, S, K, Ca, Mg, Na, CIC, etc.), y la fila siguiente con Prof="60 cm" que trae SOLO un valor de N-NO3 (el nitrato a esa profundidad). Tratá cada PAR de filas (20cm + 60cm) como UNA sola muestra.
- "nNo3_0_20" = el valor de N-NO3 de la fila de 20cm. "nNo3_20_60" = el valor (único) de la fila de 60cm.
- Campo y Lote para cada muestra salen DIRECTAMENTE de las columnas "Campo" y "Lote" de esa fila de la tabla — leelas tal cual están escritas (ej "EL ROSARIO", "C1-1", "EFRAIN", "C4-1"). Si hay columna "Ref.Lote" con una aclaración (ej "SOBREPOSICION"), agregala al muestraLabel.
- MUY IMPORTANTE — abajo te paso la LISTA REAL de campos y lotes que existen en el sistema. Para cada muestra, tenés que razonar cuál de esos lotes reales es (como lo haría un agrónomo que conoce el campo), no solo comparar el texto letra por letra. El nombre en la tabla del laboratorio y el nombre real en el sistema pueden diferir en formato (mayúsculas, guiones, con o sin sufijo, con o sin acento) y aun así ser CLARAMENTE el mismo lote — en esos casos, usá el nombre EXACTO tal cual figura en la lista real (no el que trae la tabla). Ejemplo: si la tabla dice "El Rosario C3-1" y "El Rosario C3-2", y en el sistema el lote real se llama simplemente "C3" dentro del campo "El Rosario", es razonable asumir que ambas muestras corresponden a ese mismo lote real "C3" (dos puntos de muestreo del mismo lote) — completá "lote":"C3" en las dos, con muestraLabel distinto para diferenciarlas (ej "C3-1" y "C3-2"). Solo dejá "lote" o "campo" en null cuando genuinamente no encuentres ningún lote real razonable al que corresponda (ambigüedad real, no una simple diferencia de formato).
- El informe suele traer una línea "Fecha: DD/MM/AA" cerca del encabezado (junto al nombre del cliente) — esa es la fecha del muestreo/informe, usala para el campo "fecha" de CADA muestra de esa tabla (todas comparten la misma fecha salvo que se indique lo contrario). Convertila a YYYY-MM-DD (ej "16/06/26" → "2026-06-16"). Si no la encontrás, dejá fecha en null.
- IMPORTANTE — el PDF puede tener el texto interno desordenado (por ejemplo, que los códigos de "Lote" aparezcan todos agrupados al final del documento, separados de su fila correspondiente, en vez de alineados visualmente). Si ves eso, mirá el documento como una imagen/tabla visual (cómo se ve renderizado, no cómo está ordenado el texto plano) y reconstruí cada fila usando el número de "Oblea" como ancla — las obleas van en orden correlativo (ej 122178, 122179, 122180…), cada par consecutivo (20cm + 60cm) es una muestra, y los códigos de Lote listados al final suelen mantener el mismo orden en que aparecen las muestras en la tabla, aunque el texto los haya separado. Hacé tu mejor esfuerzo para reconstruir la asociación correcta en vez de rendirte.
- Devolvé SIEMPRE el JSON pedido, nunca una explicación en texto libre — incluso si la tabla está difícil de leer o parcialmente desordenada, hacé tu mejor esfuerzo con lo que puedas reconstruir (dejando en null lo que no puedas asegurar) en vez de responder con texto explicando el problema.
- Si el archivo NO tiene este formato de tabla (es un análisis de otro tipo, una sola muestra, otro laboratorio), interpretalo igual con tu criterio general, usando el caption para campo/lote si la imagen no lo aclara.

RANGOS DE REFERENCIA (los mismos que trae el informe AgLab, usalos tal cual salvo que el archivo traiga otros explícitos):
- pH: <6.5 Ácido, 6.5-7.3 Neutro, >7.3 Básico. Neutro = ok. Ácido o Básico = alerta (crítico si <5.5 o >8).
- Conductividad (dS/m): <0.2 Bajo(ok), 0.2-0.4 Medio(alerta), >0.4 Alto(crítico) — ACÁ ALTO ES MALO (riesgo de salinidad).
- Materia orgánica (%): <1 Bajo(crítico), 1-2.5 Medio(alerta), >2.5 Alto(ok) — acá bajo es malo.
- Fósforo/P (ppm): <10 Bajo(crítico), 10-18 Medio(alerta), >18 Alto(ok) — bajo es malo.
- N-NO3 (ppm): <10 Bajo(alerta), 10-20 Medio(ok), >20 Alto(ok, buena disponibilidad).
- Azufre/S (ppm): <10 Bajo(alerta), 10-20 Medio(ok), >20 Alto(ok).
- Potasio/K (meq/100g): <0.4 Bajo(crítico), 0.4-0.8 Medio(alerta), >0.8 Alto(ok).
- Calcio/Ca (meq/100g): <4 Bajo(alerta), 4-9 Medio(ok), >9 Alto(ok).
- Magnesio/Mg (meq/100g): <1 Bajo(alerta), 1-3 Medio(ok), >3 Alto(ok).
- Sodio/Na (meq/100g): <0.2 ok, 0.2-2 Medio(alerta si tira alto dentro del rango), >2 Alto(crítico) — acá alto es malo (sodicidad).
- CIC (meq/100g): <12 Bajo(alerta), 12-20 Medio(ok), >20 Alto(ok).
- Saturación de bases/%SB: <45 Bajo(alerta), 45-70 Medio(ok), >70 Alto(ok).
- Relación Ca/Mg: <2 Bajo(alerta, exceso relativo de Mg), 2-7 Medio(ok), >7 Alto(alerta, exceso relativo de Ca).
- Zinc/Zn, Cobre/Cu (ppm): <0.6 Bajo(alerta), 0.6-2 Medio(ok), >2 Alto(ok).
- Manganeso/Mn (ppm): <35 Bajo(alerta), 35-120 Medio(ok), >120 Alto(ok).
- Boro/B (ppm, extracción agua caliente): <0.4 Bajo(alerta, deficiencia), 0.4-2 Medio/Alto(ok, buena disponibilidad — NO es tóxico en este rango), 2-5 Alto(alerta, vigilar, especialmente en garbanzo que es sensible al boro), >5 (crítico, riesgo real de fitotoxicidad). NO marques alerta solo por estar en "Alto" según la tabla de AgLab (>0.9) — ese umbral de AgLab indica buena disponibilidad, no toxicidad; la toxicidad real empieza mucho más arriba (~5ppm).
- Hierro/Fe (ppm): <60 Bajo(alerta), 60-90 Medio(ok), >90 Alto(ok).
- PSI (%): <5 Bajo(ok), 5-15 Medio(alerta), >15 Alto(crítico) — acá alto es malo (sodicidad).

Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{"muestras":[{"muestraLabel":"<ej 'El Rosario C1-1', o el campo+lote+ref si los hay, para identificar la fila>","campo":"<nombre del campo tal cual está en la tabla o en el texto, o null>","lote":"<nombre/código del lote tal cual está en la tabla o el texto, o null>","fecha":"<fecha del informe/muestreo en formato YYYY-MM-DD si el documento la trae (ej 'Fecha: 16/06/26' → '2026-06-16'), o null si no la encontrás>","nNo3_0_20":<numero en ppm de la fila 20cm, o null>,"nNo3_20_60":<numero en ppm de la fila 60cm, o null>,"mo":<numero de materia orgánica en %, o null>,"ph":<numero de pH, o null>,"parametros":[{"nombre":"<nombre del parámetro>","valor":"<valor con unidad>","estado":"ok"|"alerta"|"critico","comentario":"<vacío si ok; si no, 1 frase corta>"}],"resumenGeneral":"ok"|"alerta"|"critico"}]}

Reglas:
- "resumenGeneral" de cada muestra es "critico" si cualquier parámetro de esa muestra es crítico, si no "alerta" si cualquiera es alerta, si no "ok".
- Si no podés leer algún valor con claridad, no lo incluyas (mejor omitir que inventar).
- Para nNo3_0_20, nNo3_20_60, mo y ph: completá el número si el informe lo trae, aunque el estado de ese parámetro sea "alerta" o "critico".
- Incluí en "parametros" los que puedas leer con confianza: como mínimo pH, MO, P, N-NO3, S, K; si hay más (Ca, Mg, Na, CIC, %SB, Ca/Mg, Zn, Cu, Mn, B, Fe, PSI), inclúilos también.
- Si el texto de la persona (caption) aclara algo que la tabla no deja claro (por ejemplo a qué campo pertenece si la tabla no lo trae), usalo. Si la tabla y el texto contradicen, priorizá la tabla.
- Ante la duda entre ok y alerta, elegí alerta.
- IMPORTANTE: si el mismo valor EXACTO (ej "150.00", "150.0") se repite en el mismo parámetro (típicamente Fósforo) en varias muestras distintas de la tabla, es señal de que el laboratorio reportó un VALOR TOPE (el método no puede medir más arriba de ese número, no es la cifra real exacta). En ese caso marcá ese parámetro como "alerta" igual aunque numéricamente esté en rango "alto", con el comentario "Valor tope del método de laboratorio — no es la cifra exacta, consultar con el laboratorio si conviene repetir con dilución".`,
      messages: [{
        role: 'user',
        content: [
          { type: mediaType === 'application/pdf' ? 'document' : 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Lista real de campos y lotes que existen en el sistema (usala para razonar el match, devolviendo el nombre EXACTO tal cual figura acá cuando corresponda):\n${listaLotes || '(no hay lotes cargados todavía)'}\n\nTexto que mandó la persona junto con el archivo: "${caption || '(sin texto)'}"\n\nAnalizá el archivo y devolveme el JSON pedido, una muestra por cada par de filas (20cm+60cm) o por cada sitio si el formato es distinto.` },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('Error de la API leyendo analisis (documento):', response.status, errText);
    return null;
  }
  const data = await response.json();
  const textoRespuesta = data.content.map(b => b.text || '').join('');
  const parsed = parsearJsonTolerante(textoRespuesta);
  if (!parsed) {
    console.error('No se pudo parsear el JSON de analisis de documento. Respuesta cruda de la IA:', textoRespuesta);
    return null;
  }
  return parsed.muestras ? parsed.muestras : (parsed.parametros ? [parsed] : null); // compatibilidad si viniera en formato viejo
}

module.exports.interpretarAnalisisDocumento = interpretarAnalisisDocumento;

async function resolverMuestrasPorTexto(muestras, textoAclaracion) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `Te paso una lista de muestras de un análisis (con su índice y etiqueta, sin campo/lote asignado todavía) y un mensaje de texto donde la persona aclara a qué campo y lote corresponde cada una.
Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma: {"asignaciones":[{"indice":<indice de la muestra, empezando en 0>,"campo":"<nombre del campo>","lote":"<nombre/código del lote>"}]}
Si el texto no aclara alguna muestra, no la incluyas en la lista.`,
      messages: [{ role: 'user', content: `Muestras:\n${muestras.map((m, i) => `${i}: ${m.muestraLabel || 'sin etiqueta'}`).join('\n')}\n\nAclaración de la persona: "${textoAclaracion}"` }],
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  const textoRespuesta = data.content.map(b => b.text || '').join('');
  const parsed = parsearJsonTolerante(textoRespuesta);
  return (parsed && parsed.asignaciones) || [];
}

module.exports.resolverMuestrasPorTexto = resolverMuestrasPorTexto;

async function llamarClaudeConBusqueda({ system, mensaje, maxTokens, timeoutMs }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system,
        messages: [{ role: 'user', content: mensaje }],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de la API (busqueda mercado):', response.status, errText);
      return null;
    }
    const data = await response.json();
    const textoRespuesta = data.content.map(b => b.text || '').join('');
    const resultado = parsearJsonTolerante(textoRespuesta);
    if (!resultado) console.error('No se pudo parsear el JSON. Respuesta cruda:', textoRespuesta);
    return resultado;
  } catch (e) {
    console.error(e.name === 'AbortError' ? `Timeout (${timeoutMs}ms) consultando mercado` : e);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function consultarPrecios() {
  const resultado = await llamarClaudeConBusqueda({
    maxTokens: 1200,
    timeoutMs: 45000,
    system: `Sos un analista de mercado de granos con el estilo directo de los analistas argentinos de bolsa de cereales (tipo Nóvitas/Enrique Erize): concreto, sin adornos.

Buscá en la web los precios ACTUALES de soja, maíz y trigo — preferentemente el precio pizarra/físico de Rosario, Argentina (en USD/tn) si lo encontrás actualizado, y como referencia el futuro más cercano de Chicago (CBOT). Compará cada uno contra el promedio de las últimas 2-4 semanas. Buscá también el precio actual de la urea (USD/tn, FOB o precio de referencia en Argentina).

Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{"granos":[{"nombre":"Soja","precioUSDtn":<numero>,"fuente":"<ej 'Pizarra Rosario' o 'CBOT'>","vsPromedio":"por encima"|"por debajo"|"en línea","tendencia":"Alcista"|"Bajista"|"Neutral","comentario":"<1 frase corta, máximo 15 palabras>"}],"urea":{"precioUSDtn":<numero>,"fuente":"<ej 'FOB US Gulf' o 'Precio de referencia Argentina'>"}}

Reglas:
- Un grano por elemento: Soja, Maíz, Trigo. No inventes precios — si no encontrás algo confiable, omitilo (dejá "urea" en null si no encontrás nada confiable).
- Sistema métrico SIEMPRE (toneladas, no bushels ni libras).
- "comentario" es texto plano, corto — NUNCA incluyas citas, referencias ni etiquetas (nada de <cite>, [1], corchetes, ni similares). Es para mostrarse tal cual en una pantalla.`,
    mensaje: 'Dame los precios actuales de soja, maíz, trigo y urea para un productor agropecuario argentino, comparados con el promedio reciente.',
  });
  const granos = ((resultado && resultado.granos) || []).map(g => ({ ...g, comentario: limpiarCitas(g.comentario), fuente: limpiarCitas(g.fuente) }));
  const urea = resultado && resultado.urea ? { ...resultado.urea, fuente: limpiarCitas(resultado.urea.fuente) } : null;
  return { granos, urea };
}

async function consultarFactoresMercado() {
  const resultado = await llamarClaudeConBusqueda({
    maxTokens: 1200,
    timeoutMs: 45000,
    system: `Sos un analista de mercado de granos con el estilo directo de los analistas argentinos de bolsa de cereales: concreto, sin adornos.

Buscá noticias recientes (últimos días) que puedan afectar el precio de soja, maíz y trigo: clima (El Niño/La Niña, sequías o excesos de humedad en el Corn Belt de EEUU, en Argentina o Brasil), geopolítica (conflictos, bloqueos, sanciones que afecten exportación/logística de granos), políticas comerciales (aranceles, retenciones, acuerdos).

Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{"factores":[{"tema":"<2-4 palabras>","detalle":"<1 frase corta y directa, máximo 15 palabras>","impacto":"alcista"|"bajista"}]}

Reglas:
- 2 a 5 eventos/noticias reales y recientes, no explicaciones genéricas de manual. No inventes noticias — si no encontrás algo confiable y reciente, omitilo.
- Sistema métrico SIEMPRE: temperaturas en °C (no Fahrenheit), toneladas (no bushels ni libras), km (no millas). Convertí si la fuente original usa otra unidad.
- "detalle" es texto plano, corto y directo — NUNCA incluyas citas, referencias, marcas de fuente ni ninguna etiqueta (nada de <cite>, [1], corchetes, ni similares). Es para mostrarse tal cual en una pantalla.`,
    mensaje: 'Dame los factores de clima y geopolítica más relevantes de los últimos días que puedan mover el precio de soja, maíz o trigo.',
  });
  const factores = (resultado && resultado.factores) || [];
  // Red de seguridad: por si igual se cuela alguna marca de cita, la sacamos del texto
  return factores.map(f => ({ ...f, detalle: limpiarCitas(f.detalle), tema: limpiarCitas(f.tema) }));
}

async function consultarRelacionInsumoProducto() {
  const resultado = await llamarClaudeConBusqueda({
    maxTokens: 1200,
    timeoutMs: 45000,
    system: `Sos un analista agropecuario argentino especializado en la "relación insumo-producto" — el indicador que usan Coninagro, la Bolsa de Comercio de Rosario y consultoras como fyo, que mide cuántos kilos de grano hacen falta para comprar 1 kilo de urea.

Buscá el informe/dato más reciente disponible (de Coninagro, BCR, fyo, u otra fuente seria) sobre la relación insumo-producto urea/trigo y urea/maíz en Argentina: el ratio actual (kg de grano por kg de urea) y, si lo encontrás, el promedio histórico de referencia (5 o 10 años) para poder decir si hoy es un momento favorable o desfavorable para comprar urea comparado con lo histórico.

Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{"relaciones":[{"cultivo":"Trigo","kgGranoPorKgUrea":<numero>,"promedioHistorico":<numero o null si no lo encontrás>,"momento":"favorable"|"desfavorable"|"neutro","comentario":"<1 frase corta, máximo 15 palabras>"}]}

Reglas:
- Un elemento para Trigo y otro para Maíz. "favorable" = hace falta menos grano que el promedio histórico para comprar la urea. "desfavorable" = hace falta más. Si no encontrás el promedio histórico, dejá "promedioHistorico" en null y "momento" en "neutro". No inventes números.
- "comentario" es texto plano, corto — NUNCA incluyas citas, referencias ni etiquetas (nada de <cite>, [1], corchetes, ni similares). Es para mostrarse tal cual en una pantalla.`,
    mensaje: 'Dame la relación insumo-producto actual de la urea contra el trigo y el maíz en Argentina, comparada con el promedio histórico.',
  });
  const relaciones = (resultado && resultado.relaciones) || [];
  return relaciones.map(r => ({ ...r, comentario: limpiarCitas(r.comentario) }));
}

async function consultarMercado() {
  const [precios, factores, relaciones] = await Promise.all([consultarPrecios(), consultarFactoresMercado(), consultarRelacionInsumoProducto()]);
  return { granos: precios.granos, urea: precios.urea, factores, relaciones, fechaConsulta: new Date().toISOString().slice(0, 10) };
}

module.exports.consultarMercado = consultarMercado;
