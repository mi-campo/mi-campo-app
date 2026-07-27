const fs = require('fs');
const path = require('path');

// Distancia de edición simple (Levenshtein), para tolerar errores de tipeo en nombres de campo
// (ej "Bustamente" vs "Bustamante") sin tener que escribirlos exacto.
function distanciaEdicion(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');
const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');
const PEND_PATH = path.join(__dirname, '..', 'data', 'pendientes.json');

const emptyData = {
  clientes: [],
  campos: [],
  lotes: [],
  insumos: [],
  actividades: [],
  analisis: [],
  notas: [],
  proveedores: [],
  compras: [],
  cargas: [],
  consultas: [],
  ciclos: [],
  contactosBot: [],
  tarifario: {},
  gruposRiego: [],
  mercado: null,
  recetas: [],
  hectareasAplicables: {},
  recetaCounter: 0,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function ensureDir() {
  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(emptyData, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  // Por si el archivo viene de una versión vieja sin alguno de estos campos
  for (const key of Object.keys(emptyData)) {
    if (!data[key]) data[key] = [];
  }
  return data;
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function loadUsers() {
  ensureDir();
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, '[]');
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}

function saveUsers(users) {
  ensureDir();
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function buscarLotes(data, nombreBuscado, nombreCampo) {
  if (!nombreBuscado) return [];
  const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const buscado = normalizar(nombreBuscado);

  // Si viene "campo" por separado (desde el parser), filtrar primero por campo
  if (nombreCampo) {
    const campoBuscado = normalizar(nombreCampo);
    let camposCandidatos = data.campos.filter(c => normalizar(c.nombre) === campoBuscado || normalizar(c.nombre).includes(campoBuscado) || campoBuscado.includes(normalizar(c.nombre)));
    // Si no matcheó por texto (ej typo tipo "Bustamente" vs "Bustamante"), probar por distancia de edición
    if (camposCandidatos.length === 0 && campoBuscado.length >= 4) {
      const maxDistancia = campoBuscado.length <= 6 ? 1 : 2;
      camposCandidatos = data.campos.filter(c => distanciaEdicion(normalizar(c.nombre), campoBuscado) <= maxDistancia);
    }
    if (camposCandidatos.length === 1) {
      const enEseCampo = data.lotes.filter(l => l.campoId === camposCandidatos[0].id);
      const exactoEnCampo = enEseCampo.filter(l => normalizar(l.nombre) === buscado);
      if (exactoEnCampo.length > 0) return exactoEnCampo;
      const fuzzyEnCampo = enEseCampo.filter(l => normalizar(l.nombre).includes(buscado) || buscado.includes(normalizar(l.nombre)));
      if (fuzzyEnCampo.length > 0) return fuzzyEnCampo;
    }
  }

  // Si viene como "Campo — Lote" o "Campo - Lote" (respuesta a una desambiguación), separar y filtrar por campo primero
  const partes = nombreBuscado.split(/—|-{2,}| - /);
  if (partes.length === 2) {
    const campoBuscado = normalizar(partes[0]);
    const loteBuscado = normalizar(partes[1]);
    const campo = data.campos.find(c => normalizar(c.nombre) === campoBuscado || normalizar(c.nombre).includes(campoBuscado));
    if (campo) {
      const enEseCampo = data.lotes.filter(l => l.campoId === campo.id && (normalizar(l.nombre) === loteBuscado || normalizar(l.nombre).includes(loteBuscado)));
      if (enEseCampo.length > 0) return enEseCampo;
    }
  }

  const exacto = data.lotes.filter(l => normalizar(l.nombre) === buscado);
  if (exacto.length > 0) return exacto;
  return data.lotes.filter(l => normalizar(l.nombre).includes(buscado) || buscado.includes(normalizar(l.nombre)));
}

// Version estricta: solo devuelve un lote si el nombre coincide EXACTO (y el campo, si se especifica, tambien exacto).
// No adivina por parecido — se usa para decidir si hace falta pedir confirmacion antes de cargar algo automaticamente.
function buscarLotesExacto(data, nombreBuscado, nombreCampo) {
  if (!nombreBuscado) return [];
  const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const buscado = normalizar(nombreBuscado);
  if (nombreCampo) {
    const campoBuscado = normalizar(nombreCampo);
    const camposCandidatos = data.campos.filter(c => normalizar(c.nombre) === campoBuscado);
    if (camposCandidatos.length === 1) {
      return data.lotes.filter(l => l.campoId === camposCandidatos[0].id && normalizar(l.nombre) === buscado);
    }
    return [];
  }
  return data.lotes.filter(l => normalizar(l.nombre) === buscado);
}

// Precio promedio ponderado de un insumo, calculado en base a TODAS sus compras históricas.
// Ej: 120tn a 500 + 60tn a 550 → (120*500 + 60*550) / 180 = 516.67
// Si no hay compras cargadas todavía, usa el costoUnitario manual del insumo como respaldo.
function precioPromedio(data, insumoId) {
  const comprasInsumo = (data.compras || []).filter(c => c.insumoId === insumoId && Number(c.cantidad) > 0);
  if (comprasInsumo.length === 0) {
    const insumo = data.insumos.find(i => i.id === insumoId);
    return insumo ? Number(insumo.costoUnitario) || 0 : 0;
  }
  const totalCantidad = comprasInsumo.reduce((s, c) => s + Number(c.cantidad), 0);
  const totalGastado = comprasInsumo.reduce((s, c) => s + Number(c.cantidad) * Number(c.precioUnitario), 0);
  return totalCantidad > 0 ? totalGastado / totalCantidad : 0;
}

function cargarPendientes() {
  ensureDir();
  if (!fs.existsSync(PEND_PATH)) fs.writeFileSync(PEND_PATH, '{}');
  return JSON.parse(fs.readFileSync(PEND_PATH, 'utf-8'));
}

function guardarPendiente(numero, pendiente) {
  const pend = cargarPendientes();
  pend[numero] = { ...pendiente, fecha: Date.now() };
  fs.writeFileSync(PEND_PATH, JSON.stringify(pend, null, 2));
}

function sacarPendiente(numero) {
  const pend = cargarPendientes();
  const valor = pend[numero];
  delete pend[numero];
  fs.writeFileSync(PEND_PATH, JSON.stringify(pend, null, 2));
  return valor || null;
}

// El ciclo "abierto" de un lote es el que todavía no tiene fecha de fin.
// Como los ciclos son secuenciales, nunca hay más de uno abierto por lote.
function cicloActivo(data, loteId) {
  const abiertos = (data.ciclos || []).filter(c => c.loteId === loteId && !c.fechaFin);
  if (abiertos.length === 0) return null;
  return [...abiertos].sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''))[0];
}

// Tarifa USD/mm/ha de riego para un lote: usa el grupo de riego asignado (con su modo activo, estimativo o calculado)
// si lo tiene; si no, cae a la vieja tarifa global única (compatibilidad con lo cargado antes de tener grupos).
function tarifaRiegoLote(data, lote) {
  const grupo = (data.gruposRiego || []).find(g => g.id === lote.grupoRiegoId);
  if (grupo) {
    const val = grupo.modoActivo === 'calculado' ? grupo.tarifaCalculada : grupo.tarifaEstimativa;
    if (val != null && val !== '') return Number(val) || 0;
  }
  return Number(data.tarifario?.Riego) || 0;
}

module.exports = {
  load, save, uid, buscarLotes, buscarLotesExacto, precioPromedio, cicloActivo, tarifaRiegoLote, emptyData,
  cargarPendientes, guardarPendiente, sacarPendiente,
  loadUsers, saveUsers,
};
