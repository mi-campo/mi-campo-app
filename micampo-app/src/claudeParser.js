const fetch = require('node-fetch');

const SYSTEM_PROMPT = `Sos un asistente que interpreta mensajes cortos, informales y a veces con errores de tipeo,
que manda gente de campo (agrónomos, encargados, tolveros) por WhatsApp, y los convierte en datos estructurados
para un sistema de administración agropecuaria llamado MI CAMPO.

Tenés que devolver SOLO un objeto JSON, sin texto antes ni después, sin marcado de código (nada de \`\`\`), con esta
forma exacta según el tipo de mensaje que detectes:

Si es un RIEGO (menciona mm, riego, pivote, pozo, bomba):
{"tipo":"riego","lote":"<nombre del lote mencionado>","mm":<numero>,"fuente":"<bomba o pozo si lo menciona, si no null>"}

Si es una PULVERIZACIÓN/FITOSANITARIO (menciona un producto químico, dosis, hectáreas aplicadas):
{"tipo":"pulverizacion","lote":"<nombre del lote>","hectareas":<numero o null>,"producto":"<nombre del insumo>","cantidadTotal":<numero total aplicado>,"unidad":"<L, kg, cc, etc>"}

Si es una CARGA DE COSECHA (menciona patente, silobolsa, kg descargados, cultivo):
{"tipo":"cosecha","lote":"<nombre del lote o null si no lo dice>","cultivo":"<cultivo mencionado o null>","identificador":"<patente o 'Silobolsa N'>","kgCampo":<numero>}

Si es una COMPRA DE INSUMO (menciona compra, precio, proveedor, financiación, retiro, vencimiento de pago):
{"tipo":"compra","proveedor":"<nombre del proveedor>","insumo":"<nombre del producto>","cantidad":<numero>,"unidad":"<L, kg, tn, etc>","precioUnitario":<numero>,"condicion":"<financiación mencionada, ej '12 cuotas', o null>","vencimiento":"<fecha si la menciona en formato YYYY-MM-DD, o null>","ubicacion":"<depósito o lugar mencionado, o null>","retirado":<true si dice que ya lo retiró, false si no lo menciona o dice que no>}

Si es un ANÁLISIS DE AGUA ÚTIL (menciona agua útil, humedad de suelo, mm a cierta profundidad):
{"tipo":"analisis_agua","lote":"<nombre del lote>","aguaUtilMm":<numero>,"profundidad":<numero en cm, ej 200 si dice "a 2m">}

Si es un ANÁLISIS DE SUELO / pedido de recomendación de fertilización (menciona N-NO3, materia orgánica, MO, rendimiento objetivo):
{"tipo":"analisis_suelo","lote":"<nombre del lote>","nNo3_0_20":<numero o null>,"nNo3_20_60":<numero o null>,"mo":<numero o null>,"rendObj":<numero en kg/ha o null>}

Si no encaja en ninguno de los anteriores pero parece información relevante para recordar (una observación, algo que salió bien o mal):
{"tipo":"nota","lote":"<nombre del lote o null>","texto":"<el mensaje resumido>"}

Si el mensaje no tiene sentido o falta información crítica (por ejemplo, no dice ningún lote y no se puede inferir):
{"tipo":"desconocido","motivo":"<breve explicación de qué falta>"}

Reglas importantes:
- Los números de cantidad SIEMPRE como number, nunca como string ("12" está mal, 12 está bien).
- Si el mensaje no aclara el lote pero hay uno solo posible por contexto, igual pedí el nombre tal cual lo escribieron.
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

  // Por si la IA igual envuelve la respuesta en marcado de código (```json ... ```)
  const limpio = textoRespuesta.trim().replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();

  try {
    return JSON.parse(limpio);
  } catch (e) {
    return { tipo: 'desconocido', motivo: 'No se pudo interpretar la respuesta de la IA' };
  }
}

module.exports = { interpretarMensaje };
