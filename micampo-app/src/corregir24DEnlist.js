// Corrige un bug del script de pulverizaciones: por una búsqueda de insumo por texto parcial,
// TODAS las cargas de "2,4-D" (sin Enlist) quedaron mal metidas dentro del insumo "2,4-D Enlist"
// (porque "2,4-D Enlist" contiene "2,4-D" como substring). Este script:
// 1. Busca, para cada aplicación afectada, el ítem que hoy apunta a "2,4-D Enlist" con la cantidad
//    que en realidad correspondía a "2,4-D" (sin Enlist), y lo pasa al insumo correcto.
// 2. Corrige el stock: le devuelve la cantidad a "2,4-D Enlist" (estaba descontado de más) y se la
//    descuenta a "2,4-D" (que hoy tiene de más, porque nunca se le descontó nada).
//
// Uso:
//   node src/corregir24DEnlist.js            -> DRY RUN
//   node src/corregir24DEnlist.js --commit    -> ejecuta y guarda

const { load, save, uid, buscarLotes } = require('./db');

// Mismas filas que cargarPulverizaciones2026.js, solo las que llevaban "2,4-D" (SIN Enlist)
const FILAS_AFECTADAS = [
  { campo: 'Efrain', lotes: ['C4'], fecha: '2026-05-03', cantidad24D: 80 },
  { campo: 'El Rosario', lotes: ['C1 (Cadamuro)'], fecha: '2026-05-08', cantidad24D: 75 },
  { campo: 'La Nazarena', lotes: ['Secano (Oeste)'], fecha: '2026-05-11', cantidad24D: 40 },
  { campo: 'Cravero', lotes: ['Cravero (Montoya)'], fecha: '2026-05-12', cantidad24D: 200 },
  { campo: 'La Nazarena', lotes: ['C1', 'C2', 'C3'], fecha: '2026-05-27', cantidad24D: 250 },
  { campo: 'El Rosario', lotes: ['C3 (Peressini)'], fecha: '2026-06-02', cantidad24D: 82 },
  { campo: 'Saul', lotes: ['1', '4'], fecha: '2026-06-19', cantidad24D: 155 },
  { campo: 'El Guri', lotes: ['1'], fecha: '2026-06-19', cantidad24D: 140 },
  { campo: 'Sanchez', lotes: ['1'], fecha: '2026-06-22', cantidad24D: 40 },
  { campo: 'Micolini', lotes: ['2 (Norte)'], fecha: '2026-07-20', cantidad24D: 200 },
  { campo: 'El Rosario', lotes: ['Secano (Cadamuro)'], fecha: '2026-07-24', cantidad24D: 85 },
  { campo: 'Lelo Vaca', lotes: ['1'], fecha: '2026-07-24', cantidad24D: 83 },
];

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const resumen = [];
  const noEncontrados = [];

  const enlist = data.insumos.find(i => i.nombre.toLowerCase() === '2,4-d enlist');
  if (!enlist) { console.log('No encontré el insumo "2,4-D Enlist" — no hay nada para corregir.'); return; }

  let plano = data.insumos.find(i => i.nombre.toLowerCase() === '2,4-d');
  if (!plano && commit) {
    plano = { id: uid(), nombre: '2,4-D', categoria: 'Herbicida', especificar: '', unidad: 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(plano);
  }

  for (const fila of FILAS_AFECTADAS) {
    // Resolver todos los lotes de esta fila y su proporción real (igual que en la carga original)
    const lotesResueltos = [];
    for (const nombreLote of fila.lotes) {
      const candidatos = buscarLotes(data, nombreLote, fila.campo);
      if (candidatos.length !== 1) { noEncontrados.push(`${fila.campo} — ${nombreLote} (${fila.fecha})`); continue; }
      lotesResueltos.push(candidatos[0]);
    }
    if (lotesResueltos.length !== fila.lotes.length) continue;
    const haTotalReal = lotesResueltos.reduce((s, l) => s + (Number(l.hectareas) || 0), 0);

    for (const lote of lotesResueltos) {
      const proporcion = lotesResueltos.length === 1 ? 1 : (Number(lote.hectareas) || 0) / haTotalReal;
      const cantidadEsperada = Math.round(fila.cantidad24D * proporcion * 100) / 100;

      const actividad = data.actividades.find(a => a.loteId === lote.id && a.tipo === 'Pulverización' && a.fecha === fila.fecha && (a.notas || '').includes('Carga retroactiva'));
      if (!actividad) { noEncontrados.push(`${fila.campo} — ${lote.nombre} (${fila.fecha}) — no encontré la actividad`); continue; }

      const item = (actividad.items || []).find(it => it.insumoId === enlist.id && Math.abs(Number(it.cantidad) - cantidadEsperada) < 0.05);
      if (!item) { noEncontrados.push(`${fila.campo} — ${lote.nombre} (${fila.fecha}) — no encontré el ítem de ${cantidadEsperada}L dentro de 2,4-D Enlist (¿ya estaba corregido?)`); continue; }

      resumen.push(`✓ ${fila.campo} — ${lote.nombre} (${fila.fecha}) — ${cantidadEsperada}L pasa de "2,4-D Enlist" a "2,4-D"`);
      if (commit) {
        item.insumoId = plano.id;
        enlist.stock = (Number(enlist.stock) || 0) + cantidadEsperada; // se le devuelve, estaba mal descontado
        plano.stock = (Number(plano.stock) || 0) - cantidadEsperada; // ahora sí se descuenta del insumo correcto
      }
    }
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CORRECCIÓN' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));
  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} no se pudieron corregir (revisar a mano):\n`);
    noEncontrados.forEach(n => console.log(`✗ ${n}`));
  }
  console.log(`\nStock resultante — "2,4-D Enlist": ${enlist.stock}${enlist.unidad || ''} · "2,4-D": ${plano ? plano.stock : '(no se creó, dry run)'}${plano?.unidad || ''}`);

  if (commit) {
    save(data);
    console.log('\n✅ Guardado.');
  } else {
    console.log('\nNada se guardó. Revisá el listado. Si está bien, corré con --commit');
  }
}

main();
