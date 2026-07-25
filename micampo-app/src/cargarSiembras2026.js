// Carga masiva de las siembras de invierno 2026 (desde Resumen_fechas_de_siembra.xlsx)
// Uso:
//   node scripts/cargarSiembras2026.js            -> DRY RUN: solo muestra qué haría, no guarda nada
//   node scripts/cargarSiembras2026.js --commit    -> ejecuta la carga real y guarda

const { load, save, uid, buscarLotes, precioPromedio } = require('../src/db');

const OBJETIVO_RIEGO_POR_CULTIVO = { Garbanzo: 400, Trigo: 550, Soja: 120, Maíz: 200 };

// Cada elemento representa UNA actividad de Siembra. Si un lote tenía una fertilización
// asociada (aplicada al sembrar), va en "fert": { ha, kgHa, insumo }.
// "nota" es texto libre que se guarda en la actividad tal cual, para lo que no se pudo
// discriminar con precisión (partes sin ha exacta).
const REGISTROS = [
  { campo: 'Saul', lote: '3', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra con Fertilización', fechaInicio: '2026-05-03', fechaFin: '2026-05-08', densidad: '90', fert: { ha: null, kgHa: 80, insumo: 'Nitrocomplex' } },
  { campo: 'Bustamante', lote: 'Secano', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra con Fertilización', fechaInicio: '2026-05-08', fechaFin: '2026-05-09', densidad: '90', fert: { ha: null, kgHa: 80, insumo: 'Nitrocomplex' } },
  { campo: 'La Nazarena', lote: 'Secano Oeste', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-05-10', fechaFin: '2026-05-12', densidad: '90', fert: { ha: 12, kgHa: 35, insumo: 'Nitrocomplex' }, nota: 'Fertilización parcial: solo 12ha de 35kg/ha nitrocomplex, el resto del lote sin fertilizar' },
  { campo: 'Saul', lote: '2', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-05-13', fechaFin: '2026-05-15', densidad: '298000 semillas/ha' },
  // Cravero (Montoya) - 200ha total, split 100/100 con distinta densidad, mismo fert en ambas mitades
  { campo: 'Cravero', lote: 'Cravero (Montoya)', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra con Fertilización', fechaInicio: '2026-05-20', fechaFin: '2026-05-30', densidad: '90', haReales: 100, fert: { ha: 100, kgHa: 80, insumo: 'Nitrocomplex' }, nota: 'Mitad del lote (100ha de 200): densidad 90kg/ha' },
  { campo: 'Cravero', lote: 'Cravero (Montoya)', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra con Fertilización', fechaInicio: '2026-05-20', fechaFin: '2026-05-30', densidad: '100', haReales: 100, fert: { ha: 100, kgHa: 80, insumo: 'Nitrocomplex' }, nota: 'Otra mitad del lote (100ha de 200): densidad 100kg/ha', abrirCiclo: false },
  { campo: 'Micolini', lote: '1', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-05-16', fechaFin: '2026-05-18', densidad: '298000 semillas/ha' },
  { campo: 'Bustamante', lote: 'C3', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-05-19', fechaFin: '2026-05-20', densidad: '298000 semillas/ha' },
  { campo: 'El Rosario', lote: 'C4', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-05-21', fechaFin: '2026-05-22', densidad: '298000 semillas/ha', nota: 'Una parte del lote sembrada a 280.000 pl/ha y otra a 298.000 pl/ha (sin ha discriminadas)' },
  { campo: 'Efrain', lote: 'C4', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-05-31', fechaFin: '2026-06-05', densidad: '145', fert: { ha: 13, kgHa: 80, insumo: 'Nitrocomplex' }, nota: 'Fertilización parcial: solo 13ha de 80kg/ha nitrocomplex' },
  { campo: 'El Rosario', lote: 'C1', cultivo: 'Trigo', variedad: 'Casuarina', metodo: 'Siembra', fechaInicio: '2026-06-09', fechaFin: '2026-06-12', densidad: '145' },
  { campo: 'El Rosario', lote: 'Secano Peressini', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-06-10', fechaFin: '2026-06-13', densidad: '298000 semillas/ha' },
  { campo: 'El Rosario', lote: 'C2', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-06-12', fechaFin: '2026-06-14', densidad: '145' },
  { campo: 'El Rosario', lote: 'C3', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-06-14', fechaFin: '2026-06-16', densidad: '298000 semillas/ha', haReales: 80 },
  { campo: 'La Silvina', lote: 'C2', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-06-14', fechaFin: '2026-06-15', densidad: '298000 semillas/ha', nota: 'La mitad del lote con un cambio de densidad, llegando a 315.000 pl/ha (sin ha discriminadas)' },
  // La Nazarena C1 - 105ha total (dato de la planificación de fertilización), split 50/50 Pehuen/Casuarina
  { campo: 'La Nazarena', lote: 'C1', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-06-17', fechaFin: '2026-06-24', densidad: '145', haReales: 52.5, nota: 'Mitad del lote (asumiendo 105ha totales — confirmar): variedad Pehuen' },
  { campo: 'La Nazarena', lote: 'C1', cultivo: 'Trigo', variedad: 'Casuarina', metodo: 'Siembra', fechaInicio: '2026-06-17', fechaFin: '2026-06-24', densidad: '145', haReales: 52.5, nota: 'Otra mitad del lote (asumiendo 105ha totales — confirmar): variedad Casuarina', abrirCiclo: false },
  // La Nazarena C3 - 35ha, sembrado junto con C1 y con los mismos datos (mismo split 50/50 Pehuen/Casuarina)
  { campo: 'La Nazarena', lote: 'C3', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-06-17', fechaFin: '2026-06-24', densidad: '145', haReales: 17.5, nota: 'Mitad del lote (35ha totales), sembrado junto con C1: variedad Pehuen' },
  { campo: 'La Nazarena', lote: 'C3', cultivo: 'Trigo', variedad: 'Casuarina', metodo: 'Siembra', fechaInicio: '2026-06-17', fechaFin: '2026-06-24', densidad: '145', haReales: 17.5, nota: 'Otra mitad del lote (35ha totales), sembrado junto con C1: variedad Casuarina', abrirCiclo: false },
  // La Nazarena C2 - 105ha total (mismo dato), split 3/4 Pehuen (fert 80kg/ha) - 1/4 Casuarina (fert 120kg/ha)
  { campo: 'La Nazarena', lote: 'C2', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra con Fertilización', fechaInicio: '2026-06-24', fechaFin: '2026-06-29', densidad: '145', haReales: 78.75, fert: { ha: 78.75, kgHa: 80, insumo: 'Nitrocomplex' }, nota: '3/4 del lote (asumiendo 105ha totales — confirmar): variedad Pehuen' },
  { campo: 'La Nazarena', lote: 'C2', cultivo: 'Trigo', variedad: 'Casuarina', metodo: 'Siembra con Fertilización', fechaInicio: '2026-06-24', fechaFin: '2026-06-29', densidad: '145', haReales: 26.25, fert: { ha: 26.25, kgHa: 120, insumo: 'Nitrocomplex' }, nota: '1/4 del lote (asumiendo 105ha totales — confirmar): variedad Casuarina', abrirCiclo: false },
];

function encontrarOCrearInsumo(data, nombre) {
  let insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(nombre.toLowerCase()) || nombre.toLowerCase().includes(i.nombre.toLowerCase()));
  if (!insumo) {
    insumo = { id: uid(), nombre, categoria: 'Fertilizante', especificar: '', unidad: 'kg', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(insumo);
  }
  return insumo;
}

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const noEncontrados = [];
  const resumen = [];
  const ciclosAbiertos = new Set(); // loteId+fechaInicio, para no abrir 2 ciclos en filas partidas del mismo lote

  for (const r of REGISTROS) {
    const candidatos = buscarLotes(data, r.lote, r.campo);
    if (candidatos.length !== 1) {
      noEncontrados.push({ ...r, motivo: candidatos.length === 0 ? 'no encontrado' : `ambiguo (${candidatos.length} candidatos)` });
      continue;
    }
    const lote = candidatos[0];

    // Actividad de siembra
    data.actividades.push({
      id: uid(), loteId: lote.id, cicloId: null, tipo: 'Siembra', fecha: r.fechaInicio, metodo: r.metodo || '',
      cultivo: r.cultivo, variedad: r.variedad || '', densidad: r.densidad || '',
      haReales: r.haReales || '', haFacturadas: r.haReales || '', tarifaContratista: '',
      items: [], costoInsumos: 0, costoContratista: 0, costoTotal: 0,
      notas: [r.nota, r.fechaFin && r.fechaFin !== r.fechaInicio ? `Siembra del ${r.fechaInicio} al ${r.fechaFin}` : null].filter(Boolean).join(' — '),
    });

    // Fertilización asociada (si la hay) — descuenta stock real del insumo (puede quedar negativo,
    // se compensa cuando se carguen las compras de Nitrocomplex)
    if (r.fert) {
      const insumo = encontrarOCrearInsumo(data, r.fert.insumo);
      const cantidad = r.fert.ha ? r.fert.ha * r.fert.kgHa : null;
      if (cantidad) {
        insumo.stock = (Number(insumo.stock) || 0) - cantidad;
        const precio = precioPromedio(data, insumo.id);
        const costoInsumos = cantidad * precio;
        data.actividades.push({
          id: uid(), loteId: lote.id, cicloId: null, tipo: 'Fertilización', fecha: r.fechaInicio, metodo: 'Al voleo/línea (siembra)',
          items: [{ insumoId: insumo.id, cantidad }],
          haReales: r.fert.ha || '', haFacturadas: r.fert.ha || '',
          costoInsumos, costoContratista: 0, costoTotal: costoInsumos,
          notas: `${r.fert.insumo} ${r.fert.kgHa}kg/ha${r.fert.ha ? ` en ${r.fert.ha}ha` : ''} — carga retroactiva, stock del insumo descontado`,
        });
      }
    }

    // Ciclo de cultivo (1 solo por lote+fecha, aunque la fila esté partida en 2 por variedad/densidad)
    const claveCiclo = lote.id + '|' + r.fechaInicio;
    if (r.abrirCiclo !== false && !ciclosAbiertos.has(claveCiclo)) {
      const esVerano = ['Soja', 'Maíz'].includes(r.cultivo);
      data.ciclos = (data.ciclos || []).map(c => (c.loteId === lote.id && !c.fechaFin) ? { ...c, fechaFin: r.fechaInicio } : c);
      data.ciclos.push({ id: uid(), loteId: lote.id, cultivo: r.cultivo, tipo: esVerano ? 'Verano' : 'Invierno', campaña: '2026', alquiler: 0, fechaInicio: r.fechaInicio, fechaFin: null });
      ciclosAbiertos.add(claveCiclo);
      const objetivoAuto = OBJETIVO_RIEGO_POR_CULTIVO[r.cultivo];
      if (objetivoAuto && (lote.modo || 'Riego') === 'Riego') {
        data.lotes = data.lotes.map(l => l.id === lote.id ? { ...l, objetivoRiego: objetivoAuto } : l);
      }
    }

    resumen.push(`✓ ${r.campo} — ${lote.nombre} — ${r.cultivo} ${r.variedad || ''} (${r.fechaInicio})${r.fert ? ' + fertilización' : ''}`);
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN (no se guarda nada, agregá --commit para ejecutar)'} ===\n`);
  console.log(`Actividades a crear: ${resumen.length} siembras cargadas correctamente:\n`);
  resumen.forEach(l => console.log(l));

  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} fila(s) NO se pudieron resolver (no se cargan, revisar nombres):\n`);
    noEncontrados.forEach(r => console.log(`✗ ${r.campo} — ${r.lote} (${r.motivo})`));
  }

  const totalNitrocomplex = REGISTROS.filter(r => r.fert && r.fert.ha).reduce((s, r) => s + r.fert.ha * r.fert.kgHa, 0);
  console.log(`\n📦 Stock de Nitrocomplex a descontar: ${totalNitrocomplex}kg (va a quedar en negativo si no tenías stock cargado — se corrige solo cuando cargues la compra).`);

  if (commit) {
    save(data);
    console.log('\n✅ Guardado en data.json. Reiniciá el bot si hace falta ver los cambios reflejados (pm2 restart micampo).');
  } else {
    console.log('\nNada se guardó todavía. Si el listado de arriba está bien, corré:\n  node scripts/cargarSiembras2026.js --commit\n');
  }
}

main();
