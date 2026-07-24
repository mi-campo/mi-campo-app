require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { configurarSesion, requireLogin } = require('./auth');
const apiRoutes = require('./api');
const { interpretarMensaje, interpretarAnalisisDocumento, resolverMuestrasPorTexto } = require('./claudeParser');
const { validar, procesar, manejarAnalisisDocumento, manejarAclaracionMuestras } = require('./botHandlers');
const { sacarPendiente, guardarPendiente, load } = require('./db');

const ETIQUETAS_TIPO = {
  riego: 'Riego', precipitacion: 'Lluvia', siembra: 'Siembra', fertilizacion: 'Fertilización', pulverizacion: 'Pulverización',
  cosecha: 'Cosecha', compra: 'Compra de insumo', analisis_agua: 'Análisis de agua', analisis_suelo: 'Análisis de suelo',
  nota: 'Nota', consulta: 'Consultas / preguntas', aporte_insumo: 'Aporte de insumo', analisis_foto: 'Análisis por foto/PDF',
  receta: 'Receta / orden de aplicación',
};

function normalizarNumero(n) {
  return (n || '').replace(/\D/g, '').replace(/^549/, '54');
}

function verificarPermiso(numero, tipo) {
  const data = load();
  const buscado = normalizarNumero(numero);
  const contacto = (data.contactosBot || []).find(c => normalizarNumero(c.numero) === buscado);
  if (!contacto) return { ok: false, motivo: 'no_registrado' };
  if (tipo && tipo !== 'desconocido' && !(contacto.tipos || []).includes(tipo)) return { ok: false, motivo: 'tipo_no_permitido', contacto };
  return { ok: true, contacto };
}

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(configurarSesion());

const PORT = process.env.PORT || 3000;

/* ---------- API del panel ---------- */
app.use('/api', apiRoutes);

/* ---------- Páginas protegidas: exigen sesión antes de servir el HTML ---------- */
app.get('/admin', (req, res, next) => {
  if (!req.session.user || req.session.user.rol !== 'admin') return res.redirect('/login.html');
  next();
}, express.static(path.join(__dirname, '..', 'public', 'admin')));

app.get('/productor', (req, res, next) => {
  if (!req.session.user || req.session.user.rol !== 'productor') return res.redirect('/login.html');
  next();
}, express.static(path.join(__dirname, '..', 'public', 'productor')));

app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
app.use('/productor', express.static(path.join(__dirname, '..', 'public', 'productor')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  if (req.session.user?.rol === 'admin') return res.redirect('/admin');
  if (req.session.user?.rol === 'productor') return res.redirect('/productor');
  res.redirect('/login.html');
});

/* ---------- Webhook de WhatsApp (igual al del bot que ya probamos) ---------- */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente por Meta');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const mensaje = change?.value?.messages?.[0];
    if (!mensaje) return;

    const numeroRemitente = mensaje.from;

    // Documento (PDF) o foto de un análisis
    if (mensaje.type === 'document' || mensaje.type === 'image') {
      const permisoDoc = verificarPermiso(numeroRemitente, 'analisis_foto');
      if (!permisoDoc.ok) {
        if (permisoDoc.motivo === 'no_registrado') {
          await enviarMensajeWA(numeroRemitente, '🚫 Tu número no está autorizado para usar este sistema.');
        } else {
          await enviarMensajeWA(numeroRemitente, '🚫 Tu número no está autorizado a mandar análisis por foto.');
        }
        return;
      }
      const media = mensaje.type === 'document' ? mensaje.document : mensaje.image;
      const caption = media.caption || '';
      console.log(`Documento/foto de ${numeroRemitente}, caption: "${caption}"`);
      try {
        const { base64, mimeType } = await descargarMediaWhatsApp(media.id);
        const dataActual = load();
        const listaLotes = dataActual.campos.map(c => {
          const lotesDelCampo = dataActual.lotes.filter(l => l.campoId === c.id).map(l => l.nombre).join(', ');
          return `${c.nombre}: ${lotesDelCampo || '(sin lotes)'}`;
        }).join('\n');
        const muestras = await interpretarAnalisisDocumento(base64, mimeType, caption, listaLotes);
        const { texto, pendientes } = await manejarAnalisisDocumento(muestras, permisoDoc.contacto);
        if (pendientes) guardarPendiente(numeroRemitente, { tipoPendiente: 'analisis_doc', muestras: pendientes });
        await enviarMensajeWA(numeroRemitente, texto);
      } catch (err) {
        console.error('Error procesando documento de WhatsApp:', err);
        await enviarMensajeWA(numeroRemitente, '⚠️ Hubo un error leyendo ese archivo. Probá de nuevo, o mandalo como foto en vez de PDF (o al revés).');
      }
      return;
    }

    if (mensaje.type !== 'text') return;

    const textoRecibido = mensaje.text.body.trim();
    console.log(`Mensaje de ${numeroRemitente}: ${textoRecibido}`);

    const pendiente = sacarPendiente(numeroRemitente);

    // Si lo pendiente es una aclaración de muestras de un análisis (foto/PDF), va por un camino aparte
    if (pendiente?.tipoPendiente === 'analisis_doc') {
      const textoNormalizado = textoRecibido.toLowerCase();
      if (['no', 'cancelar', 'borrar'].includes(textoNormalizado)) {
        await enviarMensajeWA(numeroRemitente, '❌ Descartado.');
        return;
      }
      const permisoDoc = verificarPermiso(numeroRemitente, 'analisis_foto');
      let asignaciones;
      const esAfirmacion = ['si', 'sí', 'dale', 'ok', 'correcto', 'confirmo'].includes(textoNormalizado);
      if (esAfirmacion && pendiente.muestras.length === 1 && pendiente.muestras[0]._sugerencia) {
        const [campoSug, loteSug] = pendiente.muestras[0]._sugerencia.split(' — ');
        asignaciones = [{ indice: 0, campo: campoSug, lote: loteSug }];
      } else {
        asignaciones = await resolverMuestrasPorTexto(pendiente.muestras, textoRecibido);
      }
      const { texto, pendientes } = await manejarAclaracionMuestras(pendiente.muestras, asignaciones, permisoDoc.contacto);
      if (pendientes) guardarPendiente(numeroRemitente, { tipoPendiente: 'analisis_doc', muestras: pendientes });
      await enviarMensajeWA(numeroRemitente, texto);
      return;
    }

    let interpretado;
    if (pendiente) {
      const textoNormalizado = textoRecibido.toLowerCase();
      if (['no', 'cancelar', 'borrar'].includes(textoNormalizado)) {
        await enviarMensajeWA(numeroRemitente, '❌ Descartado. Mandalo de nuevo.');
        return;
      }
      interpretado = { ...pendiente.interpretado, [pendiente.campoFaltante]: parsearRespuesta(pendiente.campoFaltante, textoRecibido) };
    } else {
      interpretado = await interpretarMensaje(textoRecibido);
    }

    const permiso = verificarPermiso(numeroRemitente, interpretado.tipo);
    if (!permiso.ok) {
      if (permiso.motivo === 'no_registrado') {
        await enviarMensajeWA(numeroRemitente, '🚫 Tu número no está autorizado para usar este sistema. Pedile al administrador que te registre desde el panel (pestaña WhatsApp).');
      } else {
        const permitidos = (permiso.contacto.tipos || []).map(t => ETIQUETAS_TIPO[t] || t).join(', ') || '(ninguno)';
        await enviarMensajeWA(numeroRemitente, `🚫 Tu número solo está autorizado a reportar: ${permitidos}.`);
      }
      return;
    }

    const chequeo = validar(interpretado);
    if (!chequeo.ok) {
      if (chequeo.campoFaltante) guardarPendiente(numeroRemitente, { interpretado, campoFaltante: chequeo.campoFaltante });
      await enviarMensajeWA(numeroRemitente, chequeo.pregunta);
      return;
    }

    const resultado = await procesar(interpretado, permiso.contacto);
    if (resultado && resultado.esImagen) {
      await enviarImagenWA(numeroRemitente, resultado.imagenBuffer, resultado.caption);
    } else {
      await enviarMensajeWA(numeroRemitente, resultado);
    }
  } catch (err) {
    console.error('Error procesando mensaje:', err);
  }
});

async function descargarMediaWhatsApp(mediaId) {
  const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  const meta = await metaRes.json();
  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } });
  const buffer = await fileRes.buffer();
  return { base64: buffer.toString('base64'), mimeType: meta.mime_type };
}

const CAMPOS_NUMERICOS = ['mm', 'cantidadTotal', 'kgCampo', 'cantidad', 'precioUnitario', 'aguaUtilMm', 'haReales', 'densidad'];
function parsearRespuesta(campo, texto) {
  if (CAMPOS_NUMERICOS.includes(campo)) {
    const match = texto.replace(',', '.').match(/[\d.]+/);
    return match ? Number(match[0]) : null;
  }
  return texto.trim();
}

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
  console.log('Respuesta de Meta al enviar:', resp.status, respBody);
}

async function enviarImagenWA(numeroDestino, imagenBuffer, caption) {
  // OJO: uso globalThis.fetch (el nativo de Node 18+), no el "fetch" importado de node-fetch de arriba —
  // node-fetch v2 no entiende FormData/Blob nativos, y el fetch global de Node si.
  const fetchNativo = globalThis.fetch;
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', new Blob([imagenBuffer], { type: 'image/png' }), 'orden.png');
  const uploadResp = await fetchNativo(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: formData,
  });
  const uploadBody = await uploadResp.json();
  if (!uploadBody.id) {
    console.error('No se pudo subir la imagen a WhatsApp:', uploadBody);
    return enviarMensajeWA(numeroDestino, `${caption}\n\n⚠️ No pude adjuntar la imagen de la orden, pero quedó guardada en el sistema.`);
  }
  // Paso 2: mandar el mensaje de imagen referenciando el media id subido (este si puede ir por el fetch normal, es JSON)
  const resp = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: numeroDestino.replace(/^549/, '54'),
      type: 'image',
      image: { id: uploadBody.id, caption },
    }),
  });
  const respBody = await resp.text();
  console.log('Respuesta de Meta al enviar imagen:', resp.status, respBody);
}

app.listen(PORT, () => console.log(`MI CAMPO escuchando en el puerto ${PORT}`));
