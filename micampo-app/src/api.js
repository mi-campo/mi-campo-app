const express = require('express');
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

module.exports = router;
