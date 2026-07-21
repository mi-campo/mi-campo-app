const { load, save, uid, buscarLotes, precioPromedio, cicloActivo } = require('./db');

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function resolverLote(data, nombreBuscado, obligatorio = true) {
  if (!nombreBuscado) {
    if (!obligatorio) return { ok: true, lote: null };
    return { ok: false, pregunta: '¿De qué lote es? Decime el nombre.', campoFaltante: 'lote' };
  }
  const candidatos = buscarLotes(data, nombreBuscado);
  if (candidatos.length === 0) {
    return { ok: false, pregunta: `No encontré ningún lote parecido a "${nombreBuscado}". ¿Cuál es el nombre correcto?`, campoFaltante: 'lote' };
  }
  if (candidatos.length > 1) {
    const nombres = candidatos.map(l => l.nombre).join(' / ');
    return { ok: false, pregunta: `Encontré más de un lote parecido: ${nombres}. ¿Cuál de esos es?`, campoFaltante: 'lote' };
  }
  return { ok: true, lote: candidatos[0] };
}

function validar(interpretado) {
  const data = load();
  switch (interpretado.tipo) {
    case 'riego': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      if (!interpretado.mm) return { ok: false, pregunta: '¿Cuántos mm se aplicaron?', campoFaltante: 'mm' };
      return { ok: true };
    }
    case 'pulverizacion': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      if (!interpretado.producto) return { ok: false, pregunta: '¿Qué producto se aplicó?', campoFaltante: 'producto' };
      if (!interpretado.cantidadTotal) return { ok: false, pregunta: '¿Cuánto se aplicó en total?', campoFaltante: 'cantidadTotal' };
      return { ok: true };
    }
    case 'cosecha': {
      if (!interpretado.identificador) return { ok: false, pregunta: '¿Patente del camión o número de silobolsa?', campoFaltante: 'identificador' };
      if (!interpretado.kgCampo) return { ok: false, pregunta: '¿Cuántos kg fueron?', campoFaltante: 'kgCampo' };
      return { ok: true };
    }
    case 'compra': {
      if (!interpretado.insumo) return { ok: false, pregunta: '¿Qué insumo se compró?', campoFaltante: 'insumo' };
      if (!interpretado.cantidad) return { ok: false, pregunta: '¿Qué cantidad?', campoFaltante: 'cantidad' };
      if (!interpretado.precioUnitario) return { ok: false, pregunta: '¿A qué precio?', campoFaltante: 'precioUnitario' };
      if (!interpretado.proveedor) return { ok: false, pregunta: '¿A qué proveedor?', campoFaltante: 'proveedor' };
      return { ok: true };
    }
    case 'analisis_agua': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      if (!interpretado.aguaUtilMm) return { ok: false, pregunta: '¿Cuántos mm de agua útil midió?', campoFaltante: 'aguaUtilMm' };
      return { ok: true };
    }
    case 'analisis_suelo': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      return { ok: true };
    }
    case 'nota':
      return { ok: true };
    default:
      return { ok: false, pregunta: `No entendí bien de qué se trata${interpretado.motivo ? ` (${interpretado.motivo})` : ''}. Contame con más detalle: qué pasó, en qué lote y cuándo.`, campoFaltante: null };
  }
}

function manejarRiego(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  data.actividades.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Riego', fecha: hoy(), mm: interpretado.mm, fuente: interpretado.fuente || undefined, items: [], costoTotal: 0, notas: '' });
  save(data);
  const acumulado = data.actividades.filter(a => a.loteId === lote.id && a.tipo === 'Riego' && a.mm).reduce((s, a) => s + Number(a.mm), 0);
  const objetivo = Number(lote.objetivoRiego) || 0;
  const falta = objetivo > 0 ? Math.max(0, objetivo - acumulado) : null;
  let texto = `✅ Riego cargado: ${lote.nombre} — ${interpretado.mm}mm${interpretado.fuente ? ` (${interpretado.fuente})` : ''}\nAcumulado: ${acumulado}mm`;
  if (falta !== null) texto += ` · Faltan ${falta}mm para el objetivo`;
  return texto;
}

function manejarPulverizacion(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  let insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(interpretado.producto.toLowerCase()));
  if (!insumo) {
    insumo = { id: uid(), nombre: interpretado.producto, unidad: interpretado.unidad || 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(insumo);
  }
  const cantidad = Number(interpretado.cantidadTotal);
  const precio = precioPromedio(data, insumo.id);
  const costoTotal = cantidad * precio;
  insumo.stock = (Number(insumo.stock) || 0) - cantidad;
  data.actividades.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Fitosanitario', fecha: hoy(), items: [{ insumoId: insumo.id, cantidad }], costoTotal, notas: '' });
  save(data);
  const dosisHa = interpretado.hectareas > 0 ? (cantidad / interpretado.hectareas).toFixed(2) : null;
  let texto = `✅ Aplicación cargada: ${lote.nombre} — ${interpretado.producto} ${cantidad}${interpretado.unidad || ''}`;
  if (dosisHa) texto += ` (${dosisHa}${interpretado.unidad || ''}/ha)`;
  if (costoTotal > 0) texto += `\nCosto: USD ${costoTotal.toFixed(0)} (a USD ${precio.toFixed(2)}/${insumo.unidad} promedio)`;
  if (precio === 0) texto += `\n⚠️ Todavía no hay compras cargadas de "${insumo.nombre}", el costo va a dar $0 hasta que registres alguna.`;
  return texto;
}

function manejarCosecha(interpretado) {
  const data = load();
  const candidatos = interpretado.lote ? buscarLotes(data, interpretado.lote) : [];
  const lote = candidatos.length === 1 ? candidatos[0] : null;
  data.cargas.push({ id: uid(), loteId: lote ? lote.id : null, cicloId: lote ? cicloActivo(data, lote.id)?.id || null : null, fecha: hoy(), identificador: interpretado.identificador, kgCampo: Number(interpretado.kgCampo), kgDestino: '' });
  save(data);
  if (!lote) return `✅ Carga registrada (${interpretado.identificador} — ${interpretado.kgCampo}kg), sin lote asignado todavía. Avisale al administrador para que la asigne a mano.`;
  return `✅ Carga registrada: ${lote.nombre} — ${interpretado.identificador} — ${interpretado.kgCampo}kg`;
}

function manejarAnalisisAgua(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  data.analisis.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Agua útil', fecha: hoy(), aguaUtilMm: interpretado.aguaUtilMm, profundidad: interpretado.profundidad, notas: '' });
  save(data);
  const objetivo = Number(lote.objetivoRiego) || 0;
  let texto = `✅ Análisis de agua útil cargado: ${lote.nombre} — ${interpretado.aguaUtilMm}mm a ${interpretado.profundidad}cm`;
  if (objetivo > 0) {
    const falta = Math.max(0, objetivo - Number(interpretado.aguaUtilMm));
    texto += `\nSegún el objetivo del lote (${objetivo}mm), faltarían ${falta}mm de reposición.`;
  }
  return texto;
}

function manejarAnalisisSuelo(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  data.analisis.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Fertilidad', fecha: hoy(), nNo3: interpretado.nNo3_0_20, p: null, mo: interpretado.mo, ph: null, notas: '' });
  save(data);
  return `✅ Análisis de suelo cargado en ${lote.nombre}. Entrá al panel para correr la calculadora Peralta-DISA con estos datos y confirmar la dosis de urea.`;
}

function manejarCompra(interpretado) {
  const data = load();
  let proveedor = data.proveedores.find(p => p.nombre.toLowerCase().includes(interpretado.proveedor.toLowerCase()));
  if (!proveedor) {
    proveedor = { id: uid(), nombre: interpretado.proveedor, contacto: '' };
    data.proveedores.push(proveedor);
  }
  let insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(interpretado.insumo.toLowerCase()));
  if (!insumo) {
    insumo = { id: uid(), nombre: interpretado.insumo, unidad: interpretado.unidad || 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(insumo);
  }
  const cantidad = Number(interpretado.cantidad);
  const precioUnitario = Number(interpretado.precioUnitario);
  const retirado = !!interpretado.retirado;
  data.compras.push({ id: uid(), proveedorId: proveedor.id, insumoId: insumo.id, cantidad, precioUnitario, montoTotal: cantidad * precioUnitario, condicion: interpretado.condicion || '', fecha: hoy(), ubicacion: interpretado.ubicacion || '', retirado, vencimiento: interpretado.vencimiento || '' });
  if (retirado) insumo.stock = (Number(insumo.stock) || 0) + cantidad;
  insumo.costoUnitario = precioUnitario || insumo.costoUnitario;
  save(data);
  let texto = `✅ Compra registrada: ${insumo.nombre} — ${cantidad}${interpretado.unidad || ''} × USD ${precioUnitario} — ${proveedor.nombre}`;
  if (interpretado.condicion) texto += `\nFinanciación: ${interpretado.condicion}`;
  if (interpretado.vencimiento) texto += ` · Vence: ${interpretado.vencimiento}`;
  texto += retirado ? '\n📦 Ya sumado al stock (retirado)' : `\n⏳ Pendiente de retiro${interpretado.ubicacion ? ` en ${interpretado.ubicacion}` : ''} — no suma stock hasta que lo retires`;
  return texto;
}

function manejarNota(interpretado) {
  const data = load();
  const candidatos = interpretado.lote ? buscarLotes(data, interpretado.lote) : [];
  const lote = candidatos.length === 1 ? candidatos[0] : null;
  data.notas.push({ id: uid(), loteId: lote ? lote.id : null, fecha: hoy(), tipo: 'Observación', texto: interpretado.texto });
  save(data);
  return `✅ Nota guardada${lote ? ` en ${lote.nombre}` : ''}.`;
}

function procesar(interpretado) {
  switch (interpretado.tipo) {
    case 'riego': return manejarRiego(interpretado);
    case 'pulverizacion': return manejarPulverizacion(interpretado);
    case 'cosecha': return manejarCosecha(interpretado);
    case 'compra': return manejarCompra(interpretado);
    case 'analisis_agua': return manejarAnalisisAgua(interpretado);
    case 'analisis_suelo': return manejarAnalisisSuelo(interpretado);
    case 'nota': return manejarNota(interpretado);
    default: return '✅ Guardado.';
  }
}

module.exports = { validar, procesar };
