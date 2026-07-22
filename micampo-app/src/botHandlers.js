const { load, save, uid, buscarLotes, precioPromedio, cicloActivo } = require('./db');

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function nombreConCampo(data, lote) {
  const campo = data.campos.find(c => c.id === lote.campoId);
  return campo ? `${campo.nombre} — ${lote.nombre}` : lote.nombre;
}

function resolverLote(data, nombreBuscado, obligatorio = true) {
  if (!nombreBuscado) {
    if (!obligatorio) return { ok: true, lote: null };
    return { ok: false, pregunta: '¿De qué lote es? Decime el nombre.', campoFaltante: 'lote' };
  }
  const candidatos = buscarLotes(data, nombreBuscado);
  if (candidatos.length === 0) {
    return { ok: false, pregunta: `No encontré ningún lote parecido a "${nombreBuscado}". ¿Cuál es el nombre correcto? (Decime también el campo, ej "C4 Efrain")`, campoFaltante: 'lote' };
  }
  if (candidatos.length > 1) {
    const nombres = candidatos.map(l => nombreConCampo(data, l)).join(' / ');
    return { ok: false, pregunta: `Encontré más de un lote parecido: ${nombres}. ¿Cuál de esos es? (Escribime "Campo — Lote" tal cual aparece)`, campoFaltante: 'lote' };
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
      if (!interpretado.items || interpretado.items.length === 0 || !interpretado.items[0].producto) return { ok: false, pregunta: '¿Qué producto(s) se aplicó y cuánto de cada uno? Mandá el mensaje de nuevo con esos datos.', campoFaltante: null };
      if (!interpretado.haReales) return { ok: false, pregunta: '¿Cuántas hectáreas reales se aplicaron? (para calcular la dosis)', campoFaltante: 'haReales' };
      return { ok: true };
    }
    case 'siembra': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      if (!interpretado.cultivo) return { ok: false, pregunta: '¿Qué cultivo se sembró? (soja, trigo, garbanzo o maíz)', campoFaltante: 'cultivo' };
      return { ok: true };
    }
    case 'fertilizacion': {
      const r = resolverLote(data, interpretado.lote);
      if (!r.ok) return r;
      if (!interpretado.items || interpretado.items.length === 0 || !interpretado.items[0].producto) return { ok: false, pregunta: '¿Qué fertilizante y cuánto en total? Mandá el mensaje de nuevo con esos datos.', campoFaltante: null };
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
  let texto = `✅ Riego cargado: ${nombreConCampo(data, lote)} — ${interpretado.mm}mm${interpretado.fuente ? ` (${interpretado.fuente})` : ''}\nAcumulado: ${acumulado}mm`;
  if (falta !== null) texto += ` · Faltan ${falta}mm para el objetivo`;
  return texto;
}

function resolverInsumos(data, items) {
  const resueltos = [];
  items.forEach(it => {
    let insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(it.producto.toLowerCase()));
    if (!insumo) {
      insumo = { id: uid(), nombre: it.producto, categoria: 'Otro', especificar: '', unidad: it.unidad || 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
      data.insumos.push(insumo);
    }
    resueltos.push({ insumo, cantidad: Number(it.cantidadTotal) });
  });
  return resueltos;
}

function manejarAplicacion(interpretado, tipo) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  const resueltos = resolverInsumos(data, interpretado.items);
  let costoInsumos = 0;
  const items = resueltos.map(({ insumo, cantidad }) => {
    const precio = precioPromedio(data, insumo.id);
    costoInsumos += cantidad * precio;
    insumo.stock = (Number(insumo.stock) || 0) - cantidad;
    return { insumoId: insumo.id, cantidad };
  });
  const haReales = Number(interpretado.haReales) || 0;
  const haFacturadas = Number(interpretado.haFacturadas) || haReales;
  const costoContratista = interpretado.tarifaContratista ? Number(interpretado.tarifaContratista) * haFacturadas : 0;
  const costoTotal = costoInsumos + costoContratista;
  data.actividades.push({
    id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo,
    fecha: hoy(), metodo: interpretado.metodo || '', haReales: interpretado.haReales || '', haFacturadas: interpretado.haFacturadas || '',
    tarifaContratista: interpretado.tarifaContratista || '', items, costoInsumos, costoContratista, costoTotal, notas: '',
  });
  save(data);
  let texto = `✅ ${tipo} cargada: ${nombreConCampo(data, lote)}${interpretado.metodo ? ` (${interpretado.metodo})` : ''}`;
  resueltos.forEach(({ insumo, cantidad }) => {
    const dosis = haReales > 0 ? (cantidad / haReales).toFixed(2) : null;
    texto += `\n· ${insumo.nombre}: ${cantidad}${insumo.unidad}${dosis ? ` (${dosis}${insumo.unidad}/ha)` : ''}`;
  });
  if (haFacturadas && haFacturadas !== haReales) texto += `\n${haReales}ha reales / ${haFacturadas}ha facturadas al contratista`;
  else if (haReales) texto += `\n${haReales}ha`;
  if (costoTotal > 0) {
    texto += `\nCosto: USD ${costoTotal.toFixed(0)}`;
    if (costoContratista > 0) texto += ` (insumos USD ${costoInsumos.toFixed(0)} + contratista USD ${costoContratista.toFixed(0)})`;
  }
  return texto;
}

function manejarPulverizacion(interpretado) {
  return manejarAplicacion(interpretado, 'Pulverización');
}

function manejarFertilizacion(interpretado) {
  return manejarAplicacion(interpretado, 'Fertilización');
}

function manejarSiembra(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  const haReales = Number(interpretado.haReales) || 0;
  const haFacturadas = Number(interpretado.haFacturadas) || haReales;
  const costoContratista = interpretado.tarifaContratista ? Number(interpretado.tarifaContratista) * haFacturadas : 0;
  data.actividades.push({
    id: uid(), loteId: lote.id, cicloId: null, tipo: 'Siembra', fecha: hoy(), metodo: interpretado.metodo || '',
    cultivo: interpretado.cultivo, variedad: interpretado.variedad || '', densidad: interpretado.densidad || '',
    haReales: interpretado.haReales || '', haFacturadas: interpretado.haFacturadas || '', tarifaContratista: interpretado.tarifaContratista || '',
    items: [], costoInsumos: 0, costoContratista, costoTotal: costoContratista, notas: '',
  });
  // Abre un ciclo nuevo para el lote (cierra el anterior si había uno abierto), igual que hace el panel
  const esVerano = ['Soja', 'Maíz'].includes(interpretado.cultivo);
  data.ciclos = (data.ciclos || []).map(c => (c.loteId === lote.id && !c.fechaFin) ? { ...c, fechaFin: hoy() } : c);
  data.ciclos.push({ id: uid(), loteId: lote.id, cultivo: interpretado.cultivo, tipo: esVerano ? 'Verano' : 'Invierno', campaña: String(new Date().getFullYear()), alquiler: 0, fechaInicio: hoy(), fechaFin: null });
  save(data);
  let texto = `✅ Siembra cargada: ${nombreConCampo(data, lote)} — ${interpretado.cultivo}${interpretado.variedad ? ` ${interpretado.variedad}` : ''}${interpretado.metodo ? ` (${interpretado.metodo})` : ''}`;
  if (interpretado.densidad) texto += `\nDensidad: ${interpretado.densidad} kg/ha`;
  if (haReales) texto += `\n${haReales}ha` + (haFacturadas !== haReales ? ` reales / ${haFacturadas}ha facturadas` : '');
  if (costoContratista > 0) texto += `\nCosto contratista: USD ${costoContratista.toFixed(0)}`;
  return texto;
}

function manejarCosecha(interpretado) {
  const data = load();
  const candidatos = interpretado.lote ? buscarLotes(data, interpretado.lote) : [];
  const lote = candidatos.length === 1 ? candidatos[0] : null;
  data.cargas.push({ id: uid(), loteId: lote ? lote.id : null, cicloId: lote ? cicloActivo(data, lote.id)?.id || null : null, fecha: hoy(), identificador: interpretado.identificador, kgCampo: Number(interpretado.kgCampo), kgDestino: '' });
  save(data);
  if (!lote) return `✅ Carga registrada (${interpretado.identificador} — ${interpretado.kgCampo}kg), sin lote asignado todavía. Avisale al administrador para que la asigne a mano.`;
  return `✅ Carga registrada: ${nombreConCampo(data, lote)} — ${interpretado.identificador} — ${interpretado.kgCampo}kg`;
}

function manejarAnalisisAgua(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote)[0];
  data.analisis.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Agua útil', fecha: hoy(), aguaUtilMm: interpretado.aguaUtilMm, profundidad: interpretado.profundidad, notas: '' });
  save(data);
  const objetivo = Number(lote.objetivoRiego) || 0;
  let texto = `✅ Análisis de agua útil cargado: ${nombreConCampo(data, lote)} — ${interpretado.aguaUtilMm}mm a ${interpretado.profundidad}cm`;
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
  return `✅ Análisis de suelo cargado en ${nombreConCampo(data, lote)}. Entrá al panel para correr la calculadora Peralta-DISA con estos datos y confirmar la dosis de urea.`;
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
  return `✅ Nota guardada${lote ? ` en ${nombreConCampo(data, lote)}` : ''}.`;
}

function procesar(interpretado) {
  switch (interpretado.tipo) {
    case 'riego': return manejarRiego(interpretado);
    case 'pulverizacion': return manejarPulverizacion(interpretado);
    case 'siembra': return manejarSiembra(interpretado);
    case 'fertilizacion': return manejarFertilizacion(interpretado);
    case 'cosecha': return manejarCosecha(interpretado);
    case 'compra': return manejarCompra(interpretado);
    case 'analisis_agua': return manejarAnalisisAgua(interpretado);
    case 'analisis_suelo': return manejarAnalisisSuelo(interpretado);
    case 'nota': return manejarNota(interpretado);
    default: return '✅ Guardado.';
  }
}

module.exports = { validar, procesar };
