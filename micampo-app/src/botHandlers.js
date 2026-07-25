const { load, save, uid, buscarLotes, buscarLotesExacto, precioPromedio, cicloActivo } = require('./db');
const { responderConsulta } = require('./claudeParser');
const { generarImagenReceta } = require('./recetaImagen');

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function laborKey(tipo, metodo) {
  if (tipo === 'Cosecha') return 'Cosecha';
  if (tipo === 'Siembra') return metodo === 'Drone' ? 'Siembra con drone' : 'Siembra';
  if (tipo === 'Fertilización') {
    if (metodo === 'Voleo') return 'Fertilización voleo';
    if (metodo === 'Drone') return 'Fertilización drone';
    if (metodo === 'Con siembra') return 'Siembra con fertilización';
    return null;
  }
  if (tipo === 'Pulverización') {
    if (metodo === 'Terrestre') return 'Pulverización terrestre';
    if (metodo === 'Drone') return 'Pulverización drone';
    if (metodo === 'Aéreo (avión)' || metodo === 'Aereo' || metodo === 'Avión' || metodo === 'Avion') return 'Pulverización avión';
    return null;
  }
  return null;
}

function tarifaAutomatica(data, tipo, metodo) {
  const key = laborKey(tipo, metodo);
  return key && data.tarifario && data.tarifario[key] ? Number(data.tarifario[key]) : null;
}

function fechaDe(interpretado) {
  if (interpretado.fecha && /^\d{4}-\d{2}-\d{2}$/.test(interpretado.fecha)) return interpretado.fecha;
  return hoy();
}

function nombreConCampo(data, lote) {
  const campo = data.campos.find(c => c.id === lote.campoId);
  return campo ? `${campo.nombre} — ${lote.nombre}` : lote.nombre;
}

function resolverLote(data, nombreBuscado, nombreCampo, obligatorio = true) {
  if (!nombreBuscado) {
    if (!obligatorio) return { ok: true, lote: null };
    return { ok: false, pregunta: '¿De qué lote es? Decime el campo y el nombre del lote.', campoFaltante: 'lote' };
  }
  const candidatos = buscarLotes(data, nombreBuscado, nombreCampo);
  if (candidatos.length === 0) {
    return { ok: false, pregunta: `No encontré ningún lote parecido a "${nombreBuscado}"${nombreCampo ? ` en ${nombreCampo}` : ''}. ¿Cuál es el nombre correcto? (Decime también el campo, ej "C4 Efrain")`, campoFaltante: 'lote' };
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
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.mm) return { ok: false, pregunta: '¿Cuántos mm se aplicaron?', campoFaltante: 'mm' };
      return { ok: true };
    }
    case 'precipitacion': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.mm) return { ok: false, pregunta: '¿Cuántos mm de lluvia cayeron?', campoFaltante: 'mm' };
      return { ok: true };
    }
    case 'receta': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.items || interpretado.items.length === 0) return { ok: false, pregunta: 'Mandá el mensaje de nuevo con el lote arriba y cada producto con su dosis en una línea (ej "1.3 glifosato").', campoFaltante: null };
      return { ok: true };
    }
    case 'pulverizacion': {
      if (!interpretado.lotes || interpretado.lotes.length === 0) return { ok: false, pregunta: '¿De qué lote(s) es esta pulverización? Decime el campo y el lote de cada uno.', campoFaltante: null };
      const lotesResueltosVal = [];
      for (const l of interpretado.lotes) {
        const r = resolverLote(data, l.lote, l.campo);
        if (!r.ok) return r;
        lotesResueltosVal.push({ ...l, loteObj: r.lote });
      }
      if (!interpretado.items || interpretado.items.length === 0 || !interpretado.items[0].producto) return { ok: false, pregunta: '¿Qué producto(s) se aplicó y cuánto de cada uno? Mandá el mensaje de nuevo con esos datos.', campoFaltante: null };
      // Red de seguridad: si hay más de un lote y ninguno especifica sus hectáreas una por una,
      // no asumir que se aplicó el lote entero cuando el total real dado no coincide con la suma de los lotes completos.
      if (lotesResueltosVal.length > 1 && lotesResueltosVal.every(l => l.haReales == null) && interpretado.haRealesTotal) {
        const sumaLotesCompletos = lotesResueltosVal.reduce((s, l) => s + (Number(l.loteObj.hectareas) || 0), 0);
        if (Math.abs(sumaLotesCompletos - Number(interpretado.haRealesTotal)) > 2) {
          const nombres = lotesResueltosVal.map(l => nombreConCampo(data, l.loteObj)).join(', ');
          return { ok: false, pregunta: `Esas ${interpretado.haRealesTotal}ha no coinciden con el tamaño completo de ${nombres} (suman ${sumaLotesCompletos}ha) — parece una aplicación parcial. ¿Cuántas hectáreas de cada lote se trataron? Mandá el mensaje de nuevo aclarando eso.`, campoFaltante: null };
        }
      }
      return { ok: true };
    }
    case 'siembra': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.cultivo) return { ok: false, pregunta: '¿Qué cultivo se sembró? (soja, trigo, garbanzo o maíz)', campoFaltante: 'cultivo' };
      return { ok: true };
    }
    case 'fertilizacion': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.items || interpretado.items.length === 0 || !interpretado.items[0].producto) return { ok: false, pregunta: '¿Qué fertilizante y cuánto en total? Mandá el mensaje de nuevo con esos datos.', campoFaltante: null };
      return { ok: true };
    }
    case 'cosecha': {
      if (!interpretado.identificador) return { ok: false, pregunta: '¿Patente del camión o número de silobolsa?', campoFaltante: 'identificador' };
      if (!interpretado.cargas || interpretado.cargas.length === 0 || interpretado.cargas.every(c => !c.kg)) return { ok: false, pregunta: '¿Cuántos kg fueron y de qué lote(s)? Mandá el mensaje de nuevo con esos datos.', campoFaltante: null };
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
      const lecturas = interpretado.lecturas || (interpretado.lote ? [{ campo: interpretado.campo, lote: interpretado.lote, aguaUtilMm: interpretado.aguaUtilMm }] : []); // compatibilidad con el formato viejo (un solo lote)
      if (lecturas.length === 0) return { ok: false, pregunta: '¿En qué lote y cuántos mm de agua útil midió?', campoFaltante: 'lecturas' };
      for (const l of lecturas) {
        const r = resolverLote(data, l.lote, l.campo);
        if (!r.ok) return r;
        if (!l.aguaUtilMm) return { ok: false, pregunta: `¿Cuántos mm de agua útil midió en ${l.lote}?`, campoFaltante: 'lecturas' };
      }
      return { ok: true };
    }
    case 'analisis_suelo': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      return { ok: true };
    }
    case 'aporte_insumo': {
      const r = resolverLote(data, interpretado.lote, interpretado.campo);
      if (!r.ok) return r;
      if (!interpretado.producto || !interpretado.cantidad) return { ok: false, pregunta: 'Mandá el mensaje de nuevo con el producto y la cantidad.', campoFaltante: null };
      if (!interpretado.clienteAportante) return { ok: false, pregunta: '¿A nombre de quién es ese aporte?', campoFaltante: 'clienteAportante' };
      return { ok: true };
    }
    case 'nota':
      return { ok: true };
    case 'borrar': {
      if (!interpretado.tipoDato) return { ok: false, pregunta: '¿Qué querés borrar? Puedo borrar un riego, una lluvia, una lectura de agua útil o una nota (compras, actividades con insumos y cosecha se corrigen desde el panel).', campoFaltante: null };
      const r = resolverLote(data, interpretado.lote, interpretado.campo, false);
      if (!r.ok) return r;
      const candidatos = buscarCandidatosBorrado(data, interpretado, r.lote);
      if (candidatos.length === 0) return { ok: false, pregunta: 'No encontré ningún registro que coincida para borrar. Decime el lote y el valor exacto (ej "264mm") para ubicarlo.', campoFaltante: null };
      if (candidatos.length > 1) return { ok: false, pregunta: `Encontré más de uno que coincide (${candidatos.length}). Decime también el valor exacto y la fecha para identificarlo bien.`, campoFaltante: null };
      return { ok: true, requiereConfirmacion: true, borrado: candidatos[0] };
    }
    case 'consulta':
      return { ok: true };
    default:
      return { ok: false, pregunta: `No entendí bien de qué se trata${interpretado.motivo ? ` (${interpretado.motivo})` : ''}. Contame con más detalle: qué pasó, en qué lote y cuándo.`, campoFaltante: null };
  }
}

// Busca registros de riego/precipitación/agua útil/nota que coincidan con lo que se quiere borrar.
// Devuelve [] si no hay ninguno, o la lista completa de coincidencias (el llamador decide si hay que desambiguar).
function buscarCandidatosBorrado(data, interpretado, lote) {
  const val = interpretado.valor != null && interpretado.valor !== '' ? Number(interpretado.valor) : null;
  const fecha = interpretado.fecha;
  let items, coleccion, campoValor, descr;
  if (interpretado.tipoDato === 'riego' || interpretado.tipoDato === 'precipitacion') {
    coleccion = 'actividades';
    campoValor = 'mm';
    const esLluvia = interpretado.tipoDato === 'precipitacion';
    items = data.actividades.filter(a => a.tipo === 'Riego' && (!lote || a.loteId === lote.id) && ((a.fuente === 'Lluvia') === esLluvia));
    descr = x => `${x.fecha} — ${x.mm}mm${x.fuente && x.fuente !== 'Lluvia' ? ` (${x.fuente})` : ''}`;
  } else if (interpretado.tipoDato === 'agua_util') {
    coleccion = 'analisis';
    campoValor = 'aguaUtilMm';
    items = data.analisis.filter(a => a.tipo === 'Agua útil' && (!lote || a.loteId === lote.id));
    descr = x => `${x.fecha} — ${x.aguaUtilMm}mm (${x.profundidad || '200'}cm)`;
  } else if (interpretado.tipoDato === 'nota') {
    coleccion = 'notas';
    campoValor = null;
    items = data.notas.filter(n => (!lote || n.loteId === lote.id));
    descr = x => `${x.fecha} — ${x.texto}`;
  } else {
    return [];
  }
  if (val != null && campoValor) items = items.filter(x => Number(x[campoValor]) === val);
  if (fecha) items = items.filter(x => x.fecha === fecha);
  return items
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
    .map(x => ({ id: x.id, coleccion, loteNombre: lote ? nombreConCampo(data, lote) : null, descripcion: descr(x) }));
}

function borrarPorId(coleccion, id) {
  const data = load();
  data[coleccion] = (data[coleccion] || []).filter(x => x.id !== id);
  save(data);
}

function aguaUtilPromedio(data, loteId) {
  const registros = data.analisis.filter(a => a.loteId === loteId && a.tipo === 'Agua útil' && a.aguaUtilMm !== '' && a.aguaUtilMm != null);
  if (registros.length === 0) return 0;
  const ultimaFecha = registros.reduce((max, r) => (r.fecha || '') > max ? r.fecha : max, '');
  const delUltimoMuestreo = registros.filter(r => r.fecha === ultimaFecha);
  return delUltimoMuestreo.reduce((s, r) => s + Number(r.aguaUtilMm), 0) / delUltimoMuestreo.length;
}

function balanceRiego(data, lote) {
  const registros = data.actividades.filter(a => a.loteId === lote.id && a.tipo === 'Riego' && a.mm);
  const esLluvia = (r) => (r.fuente || '').toLowerCase().includes('lluvia');
  const acumuladoRiego = registros.filter(r => !esLluvia(r)).reduce((s, a) => s + Number(a.mm), 0);
  const acumuladoLluvia = registros.filter(esLluvia).reduce((s, a) => s + Number(a.mm), 0);
  const aguaUtilMm = aguaUtilPromedio(data, lote.id);
  const objetivo = Number(lote.objetivoRiego) || 0;
  const disponible = aguaUtilMm + acumuladoRiego + acumuladoLluvia;
  return { acumuladoRiego, acumuladoLluvia, aguaUtilMm, objetivo, disponible, balance: objetivo > 0 ? objetivo - disponible : null };
}

function manejarRiego(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  // Red de seguridad: un riego real nunca es de miles de mm. Si la IA interpretó mal un "mil"/"ml" como multiplicador, lo corrige acá.
  let mm = Number(interpretado.mm);
  let corregido = false;
  if (mm > 500 && mm % 1000 === 0) { mm = mm / 1000; corregido = true; }
  const tarifaMm = data.tarifario && data.tarifario['Riego'] ? Number(data.tarifario['Riego']) : 0;
  const costoTotal = tarifaMm * mm * (Number(lote.hectareas) || 0);
  data.actividades.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Riego', fecha: fechaDe(interpretado), mm, fuente: interpretado.fuente || undefined, items: [], costoTotal, notas: '' });
  save(data);
  const bal = balanceRiego(data, lote);
  let texto = `✅ Riego cargado: ${nombreConCampo(data, lote)} — ${mm}mm${interpretado.fuente ? ` (${interpretado.fuente})` : ''}`;
  if (corregido) texto += `\n(interpreté "${interpretado.mm}" como ${mm}mm — avisame si no era eso)`;
  texto += `\nRiego acumulado: ${bal.acumuladoRiego}mm`;
  if (bal.acumuladoLluvia > 0) texto += ` · Lluvia acumulada: ${bal.acumuladoLluvia}mm`;
  if (bal.balance !== null) texto += bal.balance >= 0 ? ` · Faltan ${bal.balance}mm para el objetivo` : ` · Sobran ${Math.abs(bal.balance)}mm sobre el objetivo`;
  if (costoTotal > 0) texto += `\nCosto: USD ${costoTotal.toFixed(0)}`;
  return texto;
}

function manejarPrecipitacion(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  let mm = Number(interpretado.mm);
  let corregido = false;
  if (mm > 500 && mm % 1000 === 0) { mm = mm / 1000; corregido = true; }
  data.actividades.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Riego', fecha: fechaDe(interpretado), mm, fuente: 'Lluvia', items: [], costoTotal: 0, notas: '' });
  save(data);
  const bal = balanceRiego(data, lote);
  let texto = `✅ Lluvia registrada: ${nombreConCampo(data, lote)} — ${mm}mm`;
  if (corregido) texto += `\n(interpreté "${interpretado.mm}" como ${mm}mm — avisame si no era eso)`;
  texto += `\nPrecipitaciones acumuladas: ${bal.acumuladoLluvia}mm · Riego acumulado: ${bal.acumuladoRiego}mm`;
  if (bal.balance !== null) texto += bal.balance >= 0 ? ` · Faltan ${bal.balance}mm para el objetivo` : ` · Sobran ${Math.abs(bal.balance)}mm sobre el objetivo`;
  return texto;
}

async function manejarReceta(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  const campoDelLote = data.campos.find(c => c.id === lote.campoId);
  const hectareasAplicables = (data.hectareasAplicables && data.hectareasAplicables[lote.id]) || Number(lote.hectareas) || 0;

  data.recetaCounter = (Number(data.recetaCounter) || 0) + 1;
  const numero = data.recetaCounter;

  const items = interpretado.items.map(it => ({
    producto: it.producto,
    dosisPorHa: Number(it.dosisPorHa),
    totalProducto: Number(it.dosisPorHa) * hectareasAplicables,
  }));

  const receta = {
    id: uid(), numero, loteId: lote.id,
    establecimiento: campoDelLote?.nombre || '', lote: lote.nombre,
    fecha: hoy(), hectareasReales: Number(lote.hectareas) || 0, hectareasAplicables,
    observaciones: '', apoyo: '', items,
  };
  data.recetas.push(receta);
  save(data);

  const imagenBuffer = await generarImagenReceta(receta);
  const caption = `✅ Orden N° ${String(numero).padStart(5, '0')} — ${nombreConCampo(data, lote)} — ${hectareasAplicables}ha aplicables`;
  return { esImagen: true, imagenBuffer, caption };
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
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
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
  const tarifa = interpretado.tarifaContratista ? Number(interpretado.tarifaContratista) : tarifaAutomatica(data, tipo, interpretado.metodo);
  const costoContratista = tarifa ? tarifa * haFacturadas : 0;
  const costoTotal = costoInsumos + costoContratista;
  data.actividades.push({
    id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo,
    fecha: fechaDe(interpretado), metodo: interpretado.metodo || '', haReales: interpretado.haReales || '', haFacturadas: interpretado.haFacturadas || '',
    tarifaContratista: tarifa || '', items, costoInsumos, costoContratista, costoTotal, notas: '',
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
  const data = load();
  const lotesResueltos = interpretado.lotes.map(l => {
    const lote = buscarLotes(data, l.lote, l.campo)[0];
    const haReales = l.haReales != null ? Number(l.haReales) : (Number(lote.hectareas) || 0);
    return { lote, haReales };
  });
  const totalHaReales = lotesResueltos.reduce((s, l) => s + l.haReales, 0);
  const resueltosInsumos = resolverInsumos(data, interpretado.items);
  const haFacturadasTotal = Number(interpretado.haFacturadas) || totalHaReales;
  const tarifa = interpretado.tarifaContratista ? Number(interpretado.tarifaContratista) : tarifaAutomatica(data, 'Pulverización', interpretado.metodo);

  let textoLotes = '';
  let costoInsumosGlobal = 0, costoContratistaGlobal = 0;

  lotesResueltos.forEach(({ lote, haReales }) => {
    const proporcion = totalHaReales > 0 ? haReales / totalHaReales : 1 / lotesResueltos.length;
    const haFacturadasLote = haFacturadasTotal * proporcion;
    let costoInsumosLote = 0;
    const itemsLote = resueltosInsumos.map(({ insumo, cantidad }) => {
      const cantidadLote = Math.round(cantidad * proporcion * 100) / 100;
      const precio = precioPromedio(data, insumo.id);
      costoInsumosLote += cantidadLote * precio;
      insumo.stock = (Number(insumo.stock) || 0) - cantidadLote;
      return { insumoId: insumo.id, cantidad: cantidadLote };
    });
    const costoContratistaLote = tarifa ? tarifa * haFacturadasLote : 0;
    const costoTotalLote = costoInsumosLote + costoContratistaLote;
    costoInsumosGlobal += costoInsumosLote;
    costoContratistaGlobal += costoContratistaLote;

    data.actividades.push({
      id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Pulverización',
      fecha: fechaDe(interpretado), metodo: interpretado.metodo || '', haReales: Math.round(haReales * 100) / 100, haFacturadas: Math.round(haFacturadasLote * 100) / 100,
      tarifaContratista: tarifa || '', items: itemsLote, costoInsumos: Math.round(costoInsumosLote), costoContratista: Math.round(costoContratistaLote), costoTotal: Math.round(costoTotalLote),
      notas: lotesResueltos.length > 1 ? `Aplicación conjunta con ${lotesResueltos.length - 1} lote(s) más — ${haReales}ha de ${totalHaReales}ha reales totales (${(proporcion * 100).toFixed(0)}%)` : '',
    });
    textoLotes += `\n· ${nombreConCampo(data, lote)}: ${haReales}ha (${(proporcion * 100).toFixed(0)}%) — USD ${costoTotalLote.toFixed(0)}`;
  });
  save(data);

  let texto = `✅ Pulverización cargada${interpretado.metodo ? ` (${interpretado.metodo})` : ''}${lotesResueltos.length > 1 ? ` — repartida en ${lotesResueltos.length} lotes` : ''}:${textoLotes}`;
  resueltosInsumos.forEach(({ insumo, cantidad }) => {
    const dosis = totalHaReales > 0 ? (cantidad / totalHaReales).toFixed(2) : null;
    texto += `\n${insumo.nombre}: ${cantidad}${insumo.unidad} total${dosis ? ` (${dosis}${insumo.unidad}/ha)` : ''}`;
  });
  const costoTotalGlobal = costoInsumosGlobal + costoContratistaGlobal;
  texto += `\nTotal: ${totalHaReales}ha reales`;
  if (haFacturadasTotal !== totalHaReales) texto += ` / ${haFacturadasTotal}ha facturadas`;
  if (costoTotalGlobal > 0) texto += ` — USD ${costoTotalGlobal.toFixed(0)}`;
  return texto;
}

function manejarFertilizacion(interpretado) {
  return manejarAplicacion(interpretado, 'Fertilización');
}

const OBJETIVO_RIEGO_POR_CULTIVO = { 'Garbanzo': 400, 'Trigo': 550, 'Soja': 120, 'Maíz': 200 };

function manejarSiembra(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  const haReales = Number(interpretado.haReales) || 0;
  const haFacturadas = Number(interpretado.haFacturadas) || haReales;
  const tarifa = interpretado.tarifaContratista ? Number(interpretado.tarifaContratista) : tarifaAutomatica(data, 'Siembra', interpretado.metodo);
  const costoContratista = tarifa ? tarifa * haFacturadas : 0;
  data.actividades.push({
    id: uid(), loteId: lote.id, cicloId: null, tipo: 'Siembra', fecha: fechaDe(interpretado), metodo: interpretado.metodo || '',
    cultivo: interpretado.cultivo, variedad: interpretado.variedad || '', densidad: interpretado.densidad || '',
    haReales: interpretado.haReales || '', haFacturadas: interpretado.haFacturadas || '', tarifaContratista: tarifa || '',
    items: [], costoInsumos: 0, costoContratista, costoTotal: costoContratista, notas: '',
  });
  // Abre un ciclo nuevo para el lote (cierra el anterior si había uno abierto), igual que hace el panel
  const esVerano = ['Soja', 'Maíz'].includes(interpretado.cultivo);
  data.ciclos = (data.ciclos || []).map(c => (c.loteId === lote.id && !c.fechaFin) ? { ...c, fechaFin: hoy() } : c);
  data.ciclos.push({ id: uid(), loteId: lote.id, cultivo: interpretado.cultivo, tipo: esVerano ? 'Verano' : 'Invierno', campaña: String(new Date().getFullYear()), alquiler: 0, fechaInicio: hoy(), fechaFin: null });
  // Autocompleta el objetivo de riego del lote segun el cultivo (agua útil a 2m + riego/lluvia)
  const objetivoAuto = OBJETIVO_RIEGO_POR_CULTIVO[interpretado.cultivo];
  if (objetivoAuto && (lote.modo || 'Riego') === 'Riego') {
    data.lotes = data.lotes.map(l => l.id === lote.id ? { ...l, objetivoRiego: objetivoAuto } : l);
  }
  save(data);
  let texto = `✅ Siembra cargada: ${nombreConCampo(data, lote)} — ${interpretado.cultivo}${interpretado.variedad ? ` ${interpretado.variedad}` : ''}${interpretado.metodo ? ` (${interpretado.metodo})` : ''}`;
  if (interpretado.densidad) texto += `\nDensidad: ${interpretado.densidad} kg/ha`;
  if (haReales) texto += `\n${haReales}ha` + (haFacturadas !== haReales ? ` reales / ${haFacturadas}ha facturadas` : '');
  if (costoContratista > 0) texto += `\nCosto contratista: USD ${costoContratista.toFixed(0)}`;
  if (objetivoAuto && (lote.modo || 'Riego') === 'Riego') texto += `\nObjetivo de riego seteado en ${objetivoAuto}mm (agua útil a 2m + riego + lluvia)`;
  return texto;
}

function manejarCosecha(interpretado) {
  const data = load();
  const resultados = [];
  interpretado.cargas.forEach(carga => {
    if (!carga.kg) return;
    const candidatos = carga.lote ? buscarLotes(data, carga.lote, carga.campo) : [];
    const lote = candidatos.length === 1 ? candidatos[0] : null;
    data.cargas.push({ id: uid(), loteId: lote ? lote.id : null, cicloId: lote ? cicloActivo(data, lote.id)?.id || null : null, fecha: fechaDe(interpretado), identificador: interpretado.identificador, kgCampo: Number(carga.kg), kgDestino: '' });
    resultados.push({ lote, kg: Number(carga.kg), sinAsignar: !lote });
  });
  save(data);
  const totalKg = resultados.reduce((s, r) => s + r.kg, 0);
  let texto = `✅ Carga registrada — ${interpretado.identificador} — ${totalKg}kg total`;
  resultados.forEach(r => {
    texto += r.lote ? `\n· ${nombreConCampo(data, r.lote)}: ${r.kg}kg` : `\n· ${r.kg}kg sin lote asignado (avisale al administrador)`;
  });
  if (resultados.length > 1) texto += `\n(discriminado en ${resultados.length} lotes distintos bajo la misma patente)`;
  return texto;
}

function manejarAnalisisAgua(interpretado) {
  const data = load();
  const profundidad = interpretado.profundidad || 200; // 2m es la profundidad estandar de agua util en este sistema
  const lecturas = interpretado.lecturas || (interpretado.lote ? [{ campo: interpretado.campo, lote: interpretado.lote, aguaUtilMm: interpretado.aguaUtilMm }] : []); // compatibilidad con el formato viejo
  const lineas = [];
  for (const l of lecturas) {
    const lote = buscarLotes(data, l.lote, l.campo)[0];
    if (!lote) continue;
    data.analisis.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Agua útil', fecha: fechaDe(interpretado), aguaUtilMm: l.aguaUtilMm, profundidad, notas: '' });
    const objetivo = Number(lote.objetivoRiego) || 0;
    let linea = `${nombreConCampo(data, lote)} — ${l.aguaUtilMm}mm a ${profundidad}cm`;
    if (objetivo > 0) {
      const falta = Math.max(0, objetivo - Number(l.aguaUtilMm));
      linea += ` (faltarían ${falta}mm del objetivo de ${objetivo}mm)`;
    }
    lineas.push(linea);
  }
  save(data);
  if (lineas.length === 0) return 'No pude cargar ninguna lectura, revisá los nombres de lote.';
  return `✅ Agua útil cargada:\n${lineas.join('\n')}`;
}

function manejarAnalisisSuelo(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  data.analisis.push({ id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Fertilidad', fecha: fechaDe(interpretado), nNo3: interpretado.nNo3_0_20, p: null, mo: interpretado.mo, ph: null, notas: '' });
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
  data.compras.push({ id: uid(), proveedorId: proveedor.id, insumoId: insumo.id, cantidad, precioUnitario, montoTotal: cantidad * precioUnitario, condicion: interpretado.condicion || '', fecha: fechaDe(interpretado), ubicacion: interpretado.ubicacion || '', retirado, vencimiento: interpretado.vencimiento || '' });
  if (retirado) insumo.stock = (Number(insumo.stock) || 0) + cantidad;
  insumo.costoUnitario = precioUnitario || insumo.costoUnitario;
  save(data);
  let texto = `✅ Compra registrada: ${insumo.nombre} — ${cantidad}${interpretado.unidad || ''} × USD ${precioUnitario} — ${proveedor.nombre}`;
  if (interpretado.condicion) texto += `\nFinanciación: ${interpretado.condicion}`;
  if (interpretado.vencimiento) texto += ` · Vence: ${interpretado.vencimiento}`;
  texto += retirado ? '\n📦 Ya sumado al stock (retirado)' : `\n⏳ Pendiente de retiro${interpretado.ubicacion ? ` en ${interpretado.ubicacion}` : ''} — no suma stock hasta que lo retires`;
  return texto;
}

function tieneAccesoCampo(campo, clienteId) {
  if (!clienteId) return true; // sin restriccion (Fran/encargados)
  if (campo?.clienteId === clienteId) return true;
  return (campo?.participantes || []).some(p => p.clienteId === clienteId);
}

async function manejarConsulta(interpretado, contacto) {
  const data = load();
  const clienteId = contacto && contacto.clienteId ? contacto.clienteId : null;
  const contexto = {};

  const lote = interpretado.lote ? buscarLotes(data, interpretado.lote, interpretado.campo)[0] : null;
  const campo = interpretado.campo ? data.campos.find(c => (c.nombre || '').toLowerCase().includes((interpretado.campo || '').toLowerCase())) : null;

  if (lote) {
    const campoDelLote = data.campos.find(c => c.id === lote.campoId);
    if (!tieneAccesoCampo(campoDelLote, clienteId)) {
      return '🚫 Ese lote no es de tus campos, no tengo permitido darte esa información.';
    }
    const actividadesLote = data.actividades.filter(a => a.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const riegos = actividadesLote.filter(a => a.tipo === 'Riego' && a.mm);
    const gastoTotalUSD = actividadesLote.reduce((s, a) => s + (a.costoTotal || 0), 0);
    const ciclo = cicloActivo(data, lote.id);
    contexto.lote = {
      nombre: `${campoDelLote?.nombre || ''} — ${lote.nombre}`, hectareas: lote.hectareas, modo: lote.modo,
      cultivoActual: ciclo ? ciclo.cultivo : null,
      riegoAcumuladoMm: riegos.reduce((s, a) => s + Number(a.mm), 0), objetivoRiegoMm: lote.objetivoRiego || 0,
      gastoTotalUSD, costoPorHaUSD: lote.hectareas > 0 ? Math.round(gastoTotalUSD / lote.hectareas) : null,
      cosechas: actividadesLote.filter(a => a.tipo === 'Cosecha' || a.rendimiento).map(a => ({ fecha: a.fecha, rendimientoQqHa: a.rendimiento })),
      ultimasActividades: actividadesLote.slice(0, 10).map(a => ({
        tipo: a.tipo, fecha: a.fecha, metodo: a.metodo || undefined, mm: a.mm || undefined,
        cultivo: a.cultivo || undefined, variedad: a.variedad || undefined, densidad: a.densidad || undefined,
        haReales: a.haReales || undefined,
        insumosUsados: a.items && a.items.length > 0 ? a.items.map(it => { const ins = data.insumos.find(i => i.id === it.insumoId); return `${it.cantidad}${ins?.unidad || ''} de ${ins?.nombre || '?'}`; }) : undefined,
        costoTotalUSD: a.costoTotal || 0,
      })),
    };
  } else if (campo) {
    if (!tieneAccesoCampo(campo, clienteId)) {
      return '🚫 Ese campo no es tuyo, no tengo permitido darte esa información.';
    }
    const lotesCampo = data.lotes.filter(l => l.campoId === campo.id);
    const actividadesCampo = data.actividades.filter(a => lotesCampo.some(l => l.id === a.loteId));
    const haTotalCampo = lotesCampo.reduce((s, l) => s + (Number(l.hectareas) || 0), 0);
    const gastoTotalCampo = actividadesCampo.reduce((s, a) => s + (a.costoTotal || 0), 0);
    contexto.campo = {
      nombre: campo.nombre, hectareasTotal: haTotalCampo,
      lotes: lotesCampo.map(l => l.nombre), gastoTotalUSD: gastoTotalCampo,
      costoPorHaUSD: haTotalCampo > 0 ? Math.round(gastoTotalCampo / haTotalCampo) : null,
    };
  } else if (interpretado.insumo) {
    const insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(interpretado.insumo.toLowerCase()));
    if (insumo && clienteId && insumo.clienteId && insumo.clienteId !== clienteId) {
      return '🚫 Ese insumo no es tuyo, no tengo permitido darte esa información.';
    }
    contexto.insumo = insumo ? { nombre: insumo.nombre, stock: insumo.stock, unidad: insumo.unidad, stockMinimo: insumo.stockMinimo, precioPromedio: precioPromedio(data, insumo.id) } : { error: `No encontré ningún insumo llamado "${interpretado.insumo}"` };
  } else {
    // Sin lote/campo/insumo especifico: resumen general, restringido a los campos del cliente si corresponde
    const camposPermitidos = clienteId ? data.campos.filter(c => tieneAccesoCampo(c, clienteId)) : data.campos;
    const lotesPermitidos = data.lotes.filter(l => camposPermitidos.some(c => c.id === l.campoId));
    const actividadesPermitidas = data.actividades.filter(a => lotesPermitidos.some(l => l.id === a.loteId));
    if (clienteId && camposPermitidos.length === 0) return '🚫 No tenés campos asignados todavía, pedile al administrador que te vincule a uno.';
    contexto.resumenGeneral = {
      cantidadCampos: camposPermitidos.length, hectareasTotales: lotesPermitidos.reduce((s, l) => s + (Number(l.hectareas) || 0), 0),
      gastoTotalUSD: actividadesPermitidas.reduce((s, a) => s + (a.costoTotal || 0), 0),
      insumosConStockBajo: clienteId ? [] : data.insumos.filter(i => Number(i.stock) <= Number(i.stockMinimo) && Number(i.stockMinimo) > 0).map(i => ({ nombre: i.nombre, stock: i.stock, stockMinimo: i.stockMinimo, unidad: i.unidad })),
      ultimasActividades: [...actividadesPermitidas].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 10).map(a => {
        const l = data.lotes.find(x => x.id === a.loteId);
        const c = l ? data.campos.find(x => x.id === l.campoId) : null;
        return { tipo: a.tipo, fecha: a.fecha, lote: l ? `${c?.nombre || ''} — ${l.nombre}` : null };
      }),
    };
  }

  return await responderConsulta(interpretado.pregunta, contexto);
}

function manejarAporteInsumo(interpretado) {
  const data = load();
  const lote = buscarLotes(data, interpretado.lote, interpretado.campo)[0];
  const campoDelLote = data.campos.find(c => c.id === lote.campoId);

  // Resolver el cliente aportante: primero entre los participantes de ese campo, si no entre todos los clientes
  const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const buscado = normalizar(interpretado.clienteAportante);
  const participantesCampo = campoDelLote?.participantes || [];
  let cliente = participantesCampo.map(p => data.clientes.find(c => c.id === p.clienteId)).find(c => c && normalizar(c.nombre).includes(buscado));
  if (!cliente) cliente = data.clientes.find(c => normalizar(c.nombre).includes(buscado));
  if (!cliente) {
    cliente = { id: uid(), nombre: interpretado.clienteAportante };
    data.clientes.push(cliente);
  }

  // Resolver o crear el insumo
  let insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(interpretado.producto.toLowerCase()));
  if (!insumo) {
    const esSemilla = /maiz|maíz|soja|trigo|garbanzo|semilla/i.test(interpretado.producto);
    insumo = { id: uid(), nombre: interpretado.producto, categoria: esSemilla ? 'Semilla' : 'Otro', especificar: '', unidad: interpretado.unidad || 'kg', stock: 0, stockMinimo: 0, costoUnitario: interpretado.precioUnitario || 0, clienteId: null };
    data.insumos.push(insumo);
  }
  const cantidad = Number(interpretado.cantidad);
  const precioUnitario = interpretado.precioUnitario ? Number(interpretado.precioUnitario) : (Number(insumo.costoUnitario) || 0);
  insumo.stock = (Number(insumo.stock) || 0) + cantidad; // el aporte suma al stock disponible
  const costoTotal = cantidad * precioUnitario;

  data.actividades.push({
    id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Aporte', fecha: fechaDe(interpretado),
    items: [{ insumoId: insumo.id, cantidad }], costoInsumos: costoTotal, costoContratista: 0, costoTotal,
    paraClienteId: cliente.id, notas: `Aporte de ${cliente.nombre}`,
  });
  save(data);

  let texto = `✅ Aporte cargado: ${cliente.nombre} — ${cantidad}${insumo.unidad} de ${insumo.nombre} — ${nombreConCampo(data, lote)}`;
  if (precioUnitario > 0) texto += `\nValor: USD ${costoTotal.toFixed(0)} (a USD ${precioUnitario.toFixed(2)}/${insumo.unidad})`;
  texto += `\nQueda cargado a la cuenta de ${cliente.nombre} en este campo.`;
  return texto;
}

function manejarNota(interpretado) {
  const data = load();
  const candidatos = interpretado.lote ? buscarLotes(data, interpretado.lote, interpretado.campo) : [];
  const lote = candidatos.length === 1 ? candidatos[0] : null;
  data.notas.push({ id: uid(), loteId: lote ? lote.id : null, fecha: fechaDe(interpretado), tipo: 'Observación', texto: interpretado.texto });
  save(data);
  return `✅ Nota guardada${lote ? ` en ${nombreConCampo(data, lote)}` : ''}.`;
}

async function procesar(interpretado, contacto) {
  switch (interpretado.tipo) {
    case 'riego': return manejarRiego(interpretado);
    case 'precipitacion': return manejarPrecipitacion(interpretado);
    case 'receta': return manejarReceta(interpretado);
    case 'pulverizacion': return manejarPulverizacion(interpretado);
    case 'siembra': return manejarSiembra(interpretado);
    case 'fertilizacion': return manejarFertilizacion(interpretado);
    case 'cosecha': return manejarCosecha(interpretado);
    case 'compra': return manejarCompra(interpretado);
    case 'analisis_agua': return manejarAnalisisAgua(interpretado);
    case 'analisis_suelo': return manejarAnalisisSuelo(interpretado);
    case 'aporte_insumo': return manejarAporteInsumo(interpretado);
    case 'nota': return manejarNota(interpretado);
    case 'consulta': return manejarConsulta(interpretado, contacto);
    default: return '✅ Guardado.';
  }
}

const ETIQUETAS_ESTADO = { ok: '🟢 OK', alerta: '🟡 ALERTA', critico: '🔴 CRÍTICO' };

function tieneAccesoLote(data, lote, contacto) {
  if (!contacto?.clienteId) return true;
  const campoDelLote = data.campos.find(c => c.id === lote.campoId);
  return (campoDelLote?.clienteId === contacto.clienteId) || (campoDelLote?.participantes || []).some(p => p.clienteId === contacto.clienteId);
}

function guardarMuestraYArmarTexto(data, muestra, lote) {
  const fechaValida = muestra.fecha && /^\d{4}-\d{2}-\d{2}$/.test(muestra.fecha) ? muestra.fecha : hoy();
  if (muestra.nNo3_0_20 != null || muestra.nNo3_20_60 != null || muestra.mo != null || muestra.ph != null) {
    data.analisis.push({
      id: uid(), loteId: lote.id, tipo: 'Fertilidad', fecha: fechaValida,
      nNo3_0_20: muestra.nNo3_0_20 ?? '', nNo3_20_60: muestra.nNo3_20_60 ?? '', mo: muestra.mo ?? '', ph: muestra.ph ?? '',
    });
  }
  let texto = `📋 ${muestra.muestraLabel ? `${muestra.muestraLabel} — ` : ''}${nombreConCampo(data, lote)} — ${ETIQUETAS_ESTADO[muestra.resumenGeneral] || '🟢 OK'}`;
  (muestra.parametros || []).forEach(p => {
    texto += `\n${ETIQUETAS_ESTADO[p.estado] || '🟢'} ${p.nombre}: ${p.valor}${p.comentario ? ` — ${p.comentario}` : ''}`;
  });
  return texto;
}

// Procesa una lista de muestras ya interpretadas de una foto/PDF. Devuelve el texto de respuesta,
// y si alguna muestra no se pudo asignar a un lote, la lista de pendientes para guardar y esperar aclaración por texto.
async function manejarAnalisisDocumento(muestras, contacto) {
  const data = load();
  if (!muestras || muestras.length === 0) return { texto: '⚠️ No pude leer el análisis de esa foto/PDF. Probá con una foto más clara y bien enfocada, o mandalo de nuevo.', pendientes: null };

  const textos = [];
  const pendientes = [];
  let huboGuardado = false;

  muestras.forEach(muestra => {
    if (!muestra.lote) { pendientes.push(muestra); return; }
    const exactos = buscarLotesExacto(data, muestra.lote, muestra.campo);
    if (exactos.length === 1) {
      const lote = exactos[0];
      if (!tieneAccesoLote(data, lote, contacto)) { textos.push(`🚫 ${muestra.muestraLabel || 'Una muestra'} es de un lote que no es tuyo, no la cargué.`); return; }
      textos.push(guardarMuestraYArmarTexto(data, muestra, lote));
      huboGuardado = true;
      return;
    }
    // No hubo match exacto: no cargar solo, pedir confirmacion. Si hay un parecido, sugerirlo.
    const parecidos = buscarLotes(data, muestra.lote, muestra.campo);
    if (parecidos.length === 1) muestra._sugerencia = nombreConCampo(data, parecidos[0]);
    pendientes.push(muestra);
  });

  if (huboGuardado) save(data);

  let texto = textos.join('\n\n');
  if (pendientes.length > 0) {
    const listado = pendientes.map((m, i) => `${i + 1}) ${m.muestraLabel || 'Sin identificar'}${m._sugerencia ? ` → ¿es "${m._sugerencia}"?` : ''}`).join('\n');
    texto += `${texto ? '\n\n' : ''}Estas muestras no las pude confirmar con un lote exacto:\n${listado}\n\nRespondé aclarando el campo y lote de cada una (ej: "1 es Efraín C4, 2 es La Nazarena C2"), o "sí" si la sugerencia está bien.`;
  }
  if (huboGuardado) texto += `\n\nLos datos base quedaron guardados — ya los podés usar en la pestaña Fertilización.`;
  return { texto, pendientes: pendientes.length > 0 ? pendientes : null };
}

// Cuando llega una aclaración por texto para muestras pendientes de un análisis anterior.
async function manejarAclaracionMuestras(muestrasPendientes, asignaciones, contacto) {
  const data = load();
  const textos = [];
  const siguenPendientes = [];
  let huboGuardado = false;

  muestrasPendientes.forEach((muestra, i) => {
    const asignacion = asignaciones.find(a => a.indice === i);
    if (!asignacion) { siguenPendientes.push(muestra); return; }
    const candidatos = buscarLotes(data, asignacion.lote, asignacion.campo);
    if (candidatos.length !== 1) {
      textos.push(`No encontré un lote único para "${asignacion.campo || ''} ${asignacion.lote || ''}" (${muestra.muestraLabel || 'muestra ' + (i + 1)}).`);
      siguenPendientes.push(muestra);
      return;
    }
    const lote = candidatos[0];
    if (!tieneAccesoLote(data, lote, contacto)) { textos.push(`🚫 ${muestra.muestraLabel || 'Una muestra'} es de un lote que no es tuyo, no la cargué.`); return; }
    textos.push(guardarMuestraYArmarTexto(data, muestra, lote));
    huboGuardado = true;
  });

  if (huboGuardado) save(data);
  let texto = textos.join('\n\n') || 'No pude relacionar tu aclaración con ninguna muestra. Probá de nuevo indicando el número de cada una.';
  if (siguenPendientes.length > 0) {
    const listado = siguenPendientes.map((m, i) => `${i + 1}) ${m.muestraLabel || 'Sin identificar'}`).join('\n');
    texto += `\n\nTodavía faltan estas:\n${listado}`;
  }
  if (huboGuardado) texto += `\n\nLos datos base quedaron guardados — ya los podés usar en la pestaña Fertilización.`;
  return { texto, pendientes: siguenPendientes.length > 0 ? siguenPendientes : null };
}

module.exports = { validar, procesar, manejarAnalisisDocumento, manejarAclaracionMuestras, borrarPorId };
