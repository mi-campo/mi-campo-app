const bcrypt = require('bcryptjs');
const session = require('express-session');
const { loadUsers } = require('./db');

function configurarSesion() {
  return session({
    secret: process.env.SESSION_SECRET || 'cambiar-esto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
      httpOnly: true,
    },
  });
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verificarPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function login(usuario, password) {
  const users = loadUsers();
  const user = users.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
  if (!user) return null;
  if (!verificarPassword(password, user.passwordHash)) return null;
  return { id: user.id, usuario: user.usuario, rol: user.rol, clienteId: user.clienteId || null, nombre: user.nombre };
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administrador' });
  next();
}

module.exports = { configurarSesion, hashPassword, verificarPassword, login, requireLogin, requireAdmin };
