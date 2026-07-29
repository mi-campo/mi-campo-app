// Carga masiva de las pulverizaciones de invierno 2026 (hasta el 28/7/26).
// No incluye Bustamante C3 01/05/26 (144L prometrina + 176L glifo top, 82ha) — esa ya se cargó por WhatsApp.
// Uso:
//   node src/cargarPulverizaciones2026.js            -> DRY RUN
//   node src/cargarPulverizaciones2026.js --commit    -> ejecuta y guarda

const { load, save, uid, buscarLotes, cicloActivo } = require('./db');

// Alias de productos -> nombre real del insumo en el sistema
function nombreReal(apodo) {
  const mapa = {
    'terbutilazina': 'Terbutilazina',
    '2,4-d enlist': '2,4-D Enlist',
    '2,4-d': '2,4-D',
    'glifo top': 'Glifosato',
    'glifo': 'Glifosato',
    'finesse': 'Finesse',
    'dicamba': 'Dicamba',
    'flumi': 'Flumioxazim',
    'prometrina': 'Prometrina',
    'atrasina': 'Atrazina',
    'estabilizador de mescla': 'Estabilizador de mezcla',
    'strem': 'Stern',
    'aceite harrier': 'Aceite Harrier',
    'mcpa amina': 'MCPA Amina',
    'flurocloridona': 'Flurocloridona',
  };
  return mapa[apodo.toLowerCase()] || apodo;
}

function it(apodo, cantidad, unidad) {
  return { producto: nombreReal(apodo), cantidad, unidad };
}

// Cada registro: campo, lote(s) (uno o varios, si son varios se reparte proporcional a las ha reales de cada uno
// según están cargadas en el sistema), fecha, hectáreas totales, y los items (productos) usados en TOTAL.
const REGISTROS = [
  { campo: 'Bustamante', lotes: ['Secano'], fecha: '2026-05-01', ha: 29, items: [it('terbutilazina', 25, 'L'), it('2,4-D enlist', 25, 'L'), it('glifo top', 60, 'L')] },
  { campo: 'Saul', lotes: ['3'], fecha: '2026-05-01', ha: 116, items: [it('finesse', 1150, 'kg'), it('dicamba', 18, 'L'), it('2,4-D enlist', 208, 'L'), it('glifo top', 230, 'L')] },
  { campo: 'Efrain', lotes: ['C4'], fecha: '2026-05-03', ha: 82, items: [it('dicamba', 16, 'L'), it('2,4-D', 80, 'L'), it('glifo top', 185, 'L')] },
  { campo: 'El Rosario', lotes: ['C1 (Cadamuro)'], fecha: '2026-05-08', ha: 75, items: [it('finesse', 0.75, 'kg'), it('flumi', 9, 'L'), it('dicamba', 15, 'L'), it('2,4-D', 75, 'L'), it('glifo', 180, 'L')] },
  { campo: 'El Rosario', lotes: ['C4 (Peressini)'], fecha: '2026-05-09', ha: 83, items: [it('prometrina', 146, 'L'), it('glifo', 160, 'L')] },
  { campo: 'La Nazarena', lotes: ['Secano (Oeste)'], fecha: '2026-05-11', ha: 45, items: [it('dicamba', 7.5, 'L'), it('2,4-D', 40, 'L'), it('glifo', 100, 'L')] },
  { campo: 'Cravero', lotes: ['Cravero (Montoya)'], fecha: '2026-05-12', ha: 200, items: [it('finesse', 2, 'kg'), it('2,4-D', 200, 'L'), it('dicamba', 40, 'L'), it('glifo', 400, 'L')] },
  { campo: 'Micolini', lotes: ['1'], fecha: '2026-05-14', ha: 167, items: [it('prometrina', 300, 'L'), it('glifo', 334, 'L')] },
  { campo: 'Bustamante', lotes: ['C3'], fecha: '2026-05-14', ha: 79, items: [it('flumi', 9, 'L')] },
  { campo: 'La Nazarena', lotes: ['C1', 'C2', 'C3'], fecha: '2026-05-27', ha: 250, items: [it('finesse', 2.5, 'kg'), it('dicamba', 43, 'L'), it('2,4-D', 250, 'L'), it('glifo top', 470, 'L')] },
  { campo: 'Efrain', lotes: ['C4'], fecha: '2026-05-29', ha: 82, items: [it('strem', 0.8, 'kg'), it('glifo top', 120, 'L')] },
  { campo: 'Bustamante', lotes: ['C3'], fecha: '2026-05-30', ha: 80, items: [it('glifo top', 160, 'L')] },
  { campo: 'El Rosario', lotes: ['C3 (Peressini)'], fecha: '2026-06-02', ha: 82, items: [it('strem', 0.67, 'kg'), it('2,4-D', 82, 'L'), it('dicamba', 16, 'L'), it('glifo top', 164, 'L')] },
  { campo: 'El Rosario', lotes: ['C2 (Cadamuro)'], fecha: '2026-06-02', ha: 75, items: [it('glifo', 150, 'L'), it('prometrina', 150, 'L')] },
  { campo: 'El Rosario', lotes: ['Secano (Peressini)'], fecha: '2026-06-10', ha: 75, items: [it('prometrina', 150, 'L'), it('glifo', 150, 'L')] },
  { campo: 'La Nazarena', lotes: ['C2'], fecha: '2026-06-17', ha: 105, items: [it('glifo', 180, 'L')] },
  { campo: 'Saul', lotes: ['1', '4'], fecha: '2026-06-19', ha: 157, items: [it('atrasina', 140, 'kg'), it('2,4-D', 155, 'L'), it('glifo', 310, 'L'), it('dicamba', 30, 'L'), it('estabilizador de mescla', 15, 'L')] },
  { campo: 'El Guri', lotes: ['1'], fecha: '2026-06-19', ha: 178, items: [it('atrasina', 140, 'kg'), it('2,4-D', 140, 'L'), it('dicamba', 35, 'L'), it('glifo', 320, 'L')] },
  { campo: 'Sanchez', lotes: ['1'], fecha: '2026-06-22', ha: 50, items: [it('atrasina', 40, 'kg'), it('2,4-D', 40, 'L'), it('dicamba', 10, 'L'), it('glifo', 90, 'L')] },
  { campo: 'Micolini', lotes: ['2 (Norte)'], fecha: '2026-07-20', ha: 203, items: [it('atrasina', 160, 'kg'), it('dicamba', 40, 'L'), it('2,4-D', 200, 'L'), it('glifo', 260, 'kg'), it('aceite harrier', 8, 'L')] },
  { campo: 'El Rosario', lotes: ['C5 (Peressini)'], fecha: '2026-07-24', ha: 80, items: [it('atrasina', 80, 'kg'), it('glifo', 160, 'kg')] },
  { campo: 'El Rosario', lotes: ['Secano (Cadamuro)'], fecha: '2026-07-24', ha: 86, items: [it('atrasina', 68, 'kg'), it('2,4-D', 85, 'L'), it('dicamba', 17, 'L'), it('glifo', 110, 'kg')] },
  { campo: 'Lelo Vaca', lotes: ['1'], fecha: '2026-07-24', ha: 83, items: [it('atrasina', 68, 'kg'), it('2,4-D', 83, 'L'), it('dicamba', 17, 'L'), it('glifo', 110, 'kg')] },
  { campo: 'Efrain', lotes: ['C4'], fecha: '2026-07-24', ha: 82, items: [it('flurocloridona', 40, 'L'), it('mcpa amina', 65, 'L')] },
];

function encontrarOCrearInsumo(data, nombre, unidad) {
  let insumo = data.insumos.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
  if (!insumo) insumo = data.insumos.find(i => i.nombre.toLowerCase().includes(nombre.toLowerCase()) || nombre.toLowerCase().includes(i.nombre.toLowerCase()));
  if (!insumo) {
    insumo = { id: uid(), nombre, categoria: 'Herbicida', especificar: '', unidad: unidad || 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(insumo);
  }
  return insumo;
}

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const noEncontrados = [];
  const resumen = [];
  const notas = [];

  for (const r of REGISTROS) {
    // Resolver todos los lotes del grupo
    const lotesResueltos = [];
    for (const nombreLote of r.lotes) {
      const candidatos = buscarLotes(data, nombreLote, r.campo);
      if (candidatos.length !== 1) {
        noEncontrados.push({ campo: r.campo, lote: nombreLote, fecha: r.fecha, motivo: candidatos.length === 0 ? 'no encontrado' : `ambiguo (${candidatos.length})` });
        continue;
      }
      lotesResueltos.push(candidatos[0]);
    }
    if (lotesResueltos.length !== r.lotes.length) continue; // si algún lote de este grupo falló, no cargar nada de este registro

    const haTotalReal = lotesResueltos.reduce((s, l) => s + (Number(l.hectareas) || 0), 0) || r.ha;

    for (const lote of lotesResueltos) {
      const proporcion = lotesResueltos.length === 1 ? 1 : (Number(lote.hectareas) || 0) / haTotalReal;
      const haReales = lotesResueltos.length === 1 ? r.ha : Math.round((Number(lote.hectareas) || 0) * 10) / 10;
      const items = r.items.map(i => ({ insumoId: null, nombre: i.producto, cantidad: Math.round(i.cantidad * proporcion * 100) / 100, unidad: i.unidad }));

      if (commit) {
        const itemsResueltos = items.map(i => {
          const insumo = encontrarOCrearInsumo(data, i.nombre, i.unidad);
          insumo.stock = (Number(insumo.stock) || 0) - i.cantidad;
          return { insumoId: insumo.id, cantidad: i.cantidad, unidad: i.unidad };
        });
        data.actividades.push({
          id: uid(), loteId: lote.id, cicloId: cicloActivo(data, lote.id)?.id || null, tipo: 'Pulverización', fecha: r.fecha, metodo: '',
          haReales, haFacturadas: haReales, tarifaContratista: '',
          items: itemsResueltos, costoInsumos: 0, costoContratista: 0, costoTotal: 0,
          notas: `Carga retroactiva${lotesResueltos.length > 1 ? ` — repartido de un total de ${r.ha}ha entre ${lotesResueltos.length} lotes` : ''}${r.nota ? ' — ' + r.nota : ''}`,
        });
      }
      resumen.push(`✓ ${r.campo} — ${lote.nombre} — ${r.fecha} — ${haReales}ha — ${items.map(i => `${i.nombre} ${i.cantidad}${i.unidad}`).join(', ')}`);
    }
    if (r.nota) notas.push(`${r.campo} — ${r.lotes.join('/')} (${r.fecha}): ${r.nota}`);
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));
  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} lote(s) no se pudieron resolver (todo el registro de esa fecha/campo se salteó):\n`);
    noEncontrados.forEach(n => console.log(`✗ ${n.campo} — ${n.lote} (${n.fecha}) — ${n.motivo}`));
  }
  if (notas.length > 0) {
    console.log(`\n📝 Notas para revisar:\n`);
    notas.forEach(n => console.log(`- ${n}`));
  }
  if (commit) {
    save(data);
    console.log('\n✅ Guardado.');
  } else {
    console.log('\nNada se guardó. Revisá el listado y las notas de arriba. Si está bien, corré con --commit');
  }
}

main();
