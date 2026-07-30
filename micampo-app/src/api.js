const express = require('express');
const fetch = require('node-fetch');
const { consultarMercado } = require('./claudeParser');
const { load, save, uid, loadUsers, saveUsers } = require('./db');
const { login, requireLogin, requireAdmin, hashPassword } = require('./auth');

const router = express.Router();

/* ---------- LOGIN ---------- */
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = login(usuario || '', password || '');
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  req.session.user = user;
  res.json(user);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  res.json(req.session.user);
});

/* ---------- DATOS (filtrados según el rol) ---------- */
router.get('/data', requireLogin, (req, res) => {
  const data = load();
  if (req.session.user.rol === 'admin') return res.json(data);

  // Productor: solo ve sus campos, lotes, actividades con detalle de insumo, y su liquidación
  const clienteId = req.session.user.clienteId;
  const campos = data.campos.filter(c => c.clienteId === clienteId);
  const campoIds = campos.map(c => c.id);
  const lotes = data.lotes.filter(l => campoIds.includes(l.campoId));
  const loteIds = lotes.map(l => l.id);
  const actividades = data.actividades.filter(a => loteIds.includes(a.loteId));
  const insumoIdsUsados = new Set();
  actividades.forEach(a => (a.items || []).forEach(it => insumoIdsUsados.add(it.insumoId)));
  const insumos = data.insumos.filter(i => insumoIdsUsados.has(i.id));
  const cargas = data.cargas.filter(c => loteIds.includes(c.loteId));
  const consultas = data.consultas.filter(c => c.clienteId === clienteId);

  res.json({ campos, lotes, actividades, insumos, cargas, consultas, soyProductor: true });
});

// Reemplazo completo de datos — solo admin (así se guarda el panel entero de una)
router.put('/data', requireAdmin, (req, res) => {
  save(req.body);
  res.json({ ok: true });
});

/* ---------- CONSULTAS ---------- */
router.post('/consultas', requireLogin, (req, res) => {
  const data = load();
  const clienteId = req.session.user.rol === 'productor' ? req.session.user.clienteId : req.body.clienteId;
  const nueva = {
    id: uid(),
    clienteId,
    campoId: req.body.campoId || null,
    fecha: new Date().toISOString().slice(0, 10),
    texto: req.body.texto,
    autor: req.session.user.nombre || req.session.user.usuario,
    respuesta: '',
    respondida: false,
  };
  data.consultas.push(nueva);
  save(data);
  res.json(nueva);
});

router.put('/consultas/:id', requireAdmin, (req, res) => {
  const data = load();
  const consulta = data.consultas.find(c => c.id === req.params.id);
  if (!consulta) return res.status(404).json({ error: 'No encontrada' });
  consulta.respuesta = req.body.respuesta;
  consulta.respondida = true;
  save(data);
  res.json(consulta);
});

/* ---------- USUARIOS (solo admin) ---------- */
router.get('/usuarios', requireAdmin, (req, res) => {
  const users = loadUsers().map(u => ({ id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, clienteId: u.clienteId }));
  res.json(users);
});

router.post('/usuarios', requireAdmin, (req, res) => {
  const { nombre, usuario, password, rol, clienteId } = req.body;
  const users = loadUsers();
  if (users.find(u => u.usuario.toLowerCase() === (usuario || '').toLowerCase())) {
    return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });
  }
  const nuevo = { id: uid(), nombre, usuario, passwordHash: hashPassword(password), rol, clienteId: rol === 'productor' ? clienteId : null };
  users.push(nuevo);
  saveUsers(users);
  res.json({ id: nuevo.id, nombre, usuario, rol, clienteId: nuevo.clienteId });
});

router.delete('/usuarios/:id', requireAdmin, (req, res) => {
  const users = loadUsers().filter(u => u.id !== req.params.id);
  saveUsers(users);
  res.json({ ok: true });
});

/* ---------- ANÁLISIS POR FOTO (visión) ---------- */
router.post('/analizar-foto', requireLogin, async (req, res) => {
  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Falta la imagen' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: `Sos un asistente agronómico que lee fotos de análisis de suelo o agua (de laboratorios como AgLab u otros, de la zona de Córdoba, Argentina) y evalúa cada parámetro contra rangos normales de referencia para agricultura extensiva (trigo, soja, maíz, garbanzo).

Devolvé SOLO un JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{"parametros":[{"nombre":"<nombre del parámetro, ej 'pH', 'P (Bray)', 'N-NO3 0-20cm', 'M.O.', 'S', 'B'>","valor":"<valor tal cual lo leíste, con unidad>","estado":"ok"|"alerta"|"critico","comentario":"<vacío si estado es ok; si no, 1 frase corta explicando qué está fuera de lo normal, ej 'Fósforo bajo para el objetivo de rendimiento' o 'pH elevado'>"}],"resumenGeneral":"ok"|"alerta"|"critico"}

Reglas:
- "ok" (verde): el valor está dentro de rango normal para la región.
- "alerta" (amarillo): está algo fuera de lo normal, pero no es grave — amerita atención.
- "critico" (rojo): está muy fuera de lo normal, requiere acción.
- "resumenGeneral" es "critico" si CUALQUIER parámetro es crítico, si no "alerta" si CUALQUIERA es alerta, si no "ok".
- Si no podés leer algún valor con claridad, no lo incluyas en la lista (mejor omitir que inventar).
- Sé conservador: ante la duda entre ok y alerta, elegí alerta.`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: 'Analizá los parámetros de esta foto de análisis y devolveme el JSON pedido.' },
          ],
        }],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de la API de vision:', errText);
      return res.status(502).json({ error: 'No se pudo analizar la imagen ahora mismo' });
    }
    const data = await response.json();
    const textoRespuesta = data.content.map(b => b.text || '').join('');
    const limpio = textoRespuesta.trim().replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    let resultado;
    try {
      resultado = JSON.parse(limpio);
    } catch (e) {
      return res.status(502).json({ error: 'No se pudo interpretar el resultado del análisis' });
    }
    res.json(resultado);
  } catch (e) {
    console.error('Error analizando foto:', e);
    res.status(500).json({ error: 'Error interno analizando la imagen' });
  }
});

/* ---------- MERCADO (precios + panorama, con cache de 6hs) ---------- */
const KG_UREA_POR_TN_TRIGO = 97.4; // 28kgN/tn / 0.625 eficiencia / 0.46 urea — requerimiento bruto Peralta-DISA

function actualizarHistorialYPromedios(data, mercado) {
  const historial = data.mercado?.historial || [];
  const hoy = new Date().toISOString().slice(0, 10);
  const sinHoy = historial.filter(h => h.fecha !== hoy); // evita duplicar si se actualiza mas de una vez el mismo dia
  const precioRef = g => g.precioRosarioUSDtn != null ? g.precioRosarioUSDtn : g.precioChicagoUSDtn;
  const nuevoHistorial = mercado.granos && mercado.granos.length > 0
    ? [...sinHoy, {
        fecha: hoy,
        granos: mercado.granos.map(g => ({ nombre: g.nombre, precioUSDtn: precioRef(g) })),
        ureaUSDtn: mercado.urea?.precioUSDtn || null,
      }].slice(-90) // guarda como mucho los ultimos 90 dias
    : historial;

  // Si ya tenemos al menos 5 lecturas propias de un grano, usamos NUESTRO promedio real en vez de que la IA lo adivine
  (mercado.granos || []).forEach(g => {
    const lecturas = nuevoHistorial.map(h => h.granos.find(x => x.nombre === g.nombre)?.precioUSDtn).filter(v => v != null);
    if (lecturas.length >= 5) {
      const promedioPropio = lecturas.reduce((s, v) => s + v, 0) / lecturas.length;
      g.promedioPropio = Math.round(promedioPropio);
      g.cantidadLecturas = lecturas.length;
      const precioActual = precioRef(g);
      if (precioActual != null) g.vsPromedio = precioActual > promedioPropio * 1.02 ? 'por encima' : precioActual < promedioPropio * 0.98 ? 'por debajo' : 'en línea';
    }
  });

  // Idem para el % de costo de urea sobre el trigo (nuestra propia serie, para el grafico)
  const serieCostoUreaTrigo = nuevoHistorial
    .map(h => {
      const trigo = h.granos.find(g => g.nombre === 'Trigo');
      if (!trigo || !h.ureaUSDtn || !trigo.precioUSDtn) return null;
      const costoUreaPorTn = (KG_UREA_POR_TN_TRIGO / 1000) * h.ureaUSDtn;
      return { fecha: h.fecha, porcentaje: (costoUreaPorTn / trigo.precioUSDtn) * 100 };
    })
    .filter(v => v != null);
  const costoUreaTrigo = serieCostoUreaTrigo.length >= 5
    ? { promedioPropio: serieCostoUreaTrigo.reduce((s, v) => s + v.porcentaje, 0) / serieCostoUreaTrigo.length, cantidadLecturas: serieCostoUreaTrigo.length, serie: serieCostoUreaTrigo }
    : { serie: serieCostoUreaTrigo };

  return { historial: nuevoHistorial, costoUreaTrigo };
}

router.get('/mercado', requireLogin, async (req, res) => {
  const data = load();
  const ahora = Date.now();
  const cacheValidaMs = 6 * 60 * 60 * 1000; // 6 horas
  const forzar = req.query.forzar === '1';
  if (!forzar && data.mercado && data.mercado.actualizado && (ahora - data.mercado.actualizado) < cacheValidaMs) {
    return res.json(data.mercado);
  }
  try {
    const mercado = await consultarMercado();
    if ((!mercado.granos || mercado.granos.length === 0) && (!mercado.factores || mercado.factores.length === 0)) {
      // Fallaron las dos partes — no pisar un dato bueno anterior con uno vacío
      if (data.mercado) return res.json(data.mercado);
      return res.status(502).json({ error: 'No se pudo obtener información de mercado ahora mismo' });
    }
    const { historial, costoUreaTrigo } = actualizarHistorialYPromedios(data, mercado);
    data.mercado = { ...mercado, historial, costoUreaTrigo, actualizado: ahora };
    save(data);
    res.json(data.mercado);
  } catch (e) {
    console.error('Error consultando mercado:', e);
    if (data.mercado) return res.json(data.mercado); // si falla, devolver lo ultimo que se tenga guardado
    res.status(502).json({ error: 'No se pudo obtener información de mercado ahora mismo' });
  }
});

module.exports = router;
