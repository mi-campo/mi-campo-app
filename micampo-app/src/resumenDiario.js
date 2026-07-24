// Resumen diario de mercado + novedades regulatorias, mandado por WhatsApp.
// Pensado para correr una vez por dia via cron (lunes a sabado, 7am) — no es parte del servidor web.
// Uso: node src/resumenDiario.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = require('node-fetch');
const { consultarPrecios, consultarResumenDiarioCompleto } = require('./claudeParser');

async function enviarMensajeWA(numeroDestino, texto) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: numeroDestino.replace(/^549/, '54'),
      type: 'text',
      text: { body: texto },
    }),
  });
  const respBody = await resp.text();
  console.log('Respuesta de Meta al enviar resumen diario:', resp.status, respBody);
}

const ETIQUETA_IMPACTO = { alcista: '↑', bajista: '↓' };

function armarMensaje(precios, noticias) {
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  let texto = `☀️ Buen día — resumen de MI CAMPO, ${fecha}\n`;

  if (precios?.granos?.length > 0) {
    texto += `\n💰 PRECIOS\n`;
    precios.granos.forEach(g => {
      texto += `${g.nombre}: USD ${g.precioUSDtn}/tn (${g.tendencia})\n`;
    });
  }
  if (precios?.urea?.precioUSDtn) {
    texto += `Urea: USD ${precios.urea.precioUSDtn}/tn\n`;
  }

  const noticiasMercado = (noticias || []).filter(n => n.categoria === 'mercado');
  const noticiasRegulatorias = (noticias || []).filter(n => n.categoria === 'regulatorio');

  if (noticiasMercado.length > 0) {
    texto += `\n📰 MERCADO Y CLIMA\n`;
    noticiasMercado.forEach(n => {
      texto += `${ETIQUETA_IMPACTO[n.impacto] || '·'} ${n.tema}: ${n.detalle}\n`;
    });
  }

  if (noticiasRegulatorias.length > 0) {
    texto += `\n⚖️ REGULATORIO\n`;
    noticiasRegulatorias.forEach(n => {
      texto += `· ${n.tema} (${n.fuente}): ${n.detalle}\n`;
    });
  }

  if (noticiasMercado.length === 0 && noticiasRegulatorias.length === 0) {
    texto += `\nSin novedades relevantes hoy.\n`;
  }

  return texto.trim();
}

(async () => {
  const numeroDestino = process.env.RESUMEN_DIARIO_NUMERO;
  if (!numeroDestino) {
    console.error('Falta RESUMEN_DIARIO_NUMERO en el .env — no se puede mandar el resumen diario.');
    process.exit(1);
  }
  try {
    console.log('Armando resumen diario...');
    const [precios, noticias] = await Promise.all([consultarPrecios(), consultarResumenDiarioCompleto()]);
    const mensaje = armarMensaje(precios, noticias);
    await enviarMensajeWA(numeroDestino, mensaje);
    console.log('Resumen diario enviado OK.');
  } catch (e) {
    console.error('Error armando/enviando el resumen diario:', e);
    process.exit(1);
  }
})();
