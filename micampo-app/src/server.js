require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { configurarSesion, requireLogin } = require('./auth');
const apiRoutes = require('./api');
const { interpretarMensaje } = require('./claudeParser');
const { validar, procesar } = require('./botHandlers');
const { sacarPendiente, guardarPendiente, load } = require('./db');

const ETIQUETAS_TIPO = {
  riego: 'Riego', precipitacion: 'Lluvia', siembra: 'Siembra', fertilizacion: 'Fertilización', pulverizacion: 'Pulverización',
  cosecha: 'Cosecha', compra: 'Compra de insumo', analisis_agua: 'Análisis de agua', analisis_suelo: 'Análisis de suelo',
  nota: 'Nota', consulta: 'Consultas / preguntas', aporte_insumo: 'Aporte de insumo',
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
app.use(express.json());
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
    if (!mensaje || mensaje.type !== 'text') return;

    const textoRecibido = mensaje.text.body.trim();
    const numeroRemitente = mensaje.from;
    console.log(`Mensaje de ${numeroRemitente}: ${textoRecibido}`);

    const pendiente = sacarPendiente(numeroRemitente);
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

    const textoConfirmacion = await procesar(interpretado, permiso.contacto);
    await enviarMensajeWA(numeroRemitente, textoConfirmacion);
  } catch (err) {
    console.error('Error procesando mensaje:', err);
  }
});

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

app.listen(PORT, () => console.log(`MI CAMPO escuchando en el puerto ${PORT}`));
