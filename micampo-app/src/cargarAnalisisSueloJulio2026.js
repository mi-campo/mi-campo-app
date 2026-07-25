// Carga masiva de análisis de suelo AgLab (informe 9397, fecha del informe 2026-07-23)
// Uso:
//   node src/cargarAnalisisSueloJulio2026.js            -> DRY RUN
//   node src/cargarAnalisisSueloJulio2026.js --commit    -> ejecuta y guarda

const { load, save, uid, buscarLotes } = require('./db');

const FECHA = '2026-07-23';

// Cada fila = 1 muestra (nNo3_0_20 y nNo3_20_60 ya combinados de las dos profundidades del informe).
// "muestra" es solo referencia interna (código de la oblea del AgLab), no se guarda en el sistema.
const REGISTROS = [
  { campo: 'Saul', lote: '3', muestra: 'Saul-3', ph: 7.0, mo: 2.32, nNo3_0_20: 10.91, nNo3_20_60: 8.13 },
  { campo: 'El Rosario', lote: 'C1 (Cadamuro)', muestra: 'C1-1', ph: 7.2, mo: 2.75, nNo3_0_20: 14.36, nNo3_20_60: 11.86 },
  { campo: 'El Rosario', lote: 'C1 (Cadamuro)', muestra: 'C1-2', ph: 7.2, mo: 2.37, nNo3_0_20: 13.69, nNo3_20_60: 6.45 },
  { campo: 'Cravero', lote: 'Cravero (Montoya)', muestra: '1-Sur', ph: 6.9, mo: 2.09, nNo3_0_20: 23.56, nNo3_20_60: 4.19 },
  { campo: 'Cravero', lote: 'Cravero (Montoya)', muestra: '2', ph: 6.6, mo: 2.48, nNo3_0_20: 21.59, nNo3_20_60: 5.89 },
  { campo: 'El Rosario', lote: 'C4 (Peressini)', muestra: 'C4-1-R', ph: 7.3, mo: 2.19, nNo3_0_20: 17.27, nNo3_20_60: 8.21 },
  { campo: 'El Rosario', lote: 'Secano (Peressini)', muestra: 'Secano 1', ph: 7.3, mo: 2.16, nNo3_0_20: 9.44, nNo3_20_60: 4.28 },
  { campo: 'El Rosario', lote: 'C3 (Peressini)', muestra: 'C3-1', ph: 6.9, mo: 2.51, nNo3_0_20: 14.84, nNo3_20_60: 9.47 },
  { campo: 'El Rosario', lote: 'C3 (Peressini)', muestra: 'C3-2', ph: 7.4, mo: 2.61, nNo3_0_20: 17.05, nNo3_20_60: 8.52 },
  { campo: 'Efrain', lote: 'C4', muestra: 'C4-1', ph: 7.6, mo: 2.81, nNo3_0_20: 11.69, nNo3_20_60: 5.21 },
  { campo: 'Efrain', lote: 'C4', muestra: 'C4-2', ph: 7.1, mo: 2.71, nNo3_0_20: 10.63, nNo3_20_60: 6.37 },
  { campo: 'La Nazarena', lote: 'C1', muestra: 'C1-1', ph: 7.4, mo: 3.24, nNo3_0_20: 17.44, nNo3_20_60: 6.00 },
  { campo: 'La Nazarena', lote: 'C1', muestra: 'C1-2 (sobreposición riego 1 y 3)', ph: 7.4, mo: 2.85, nNo3_0_20: 14.48, nNo3_20_60: 7.16 },
  { campo: 'La Nazarena', lote: 'C1', muestra: 'C1-3 SOB (Reposición)', ph: 7.0, mo: 3.05, nNo3_0_20: 14.92, nNo3_20_60: 6.69 },
  { campo: 'La Nazarena', lote: 'C3', muestra: 'C3-1', ph: 6.8, mo: 3.24, nNo3_0_20: 16.25, nNo3_20_60: 5.89 },
];

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const noEncontrados = [];
  const resumen = [];

  for (const r of REGISTROS) {
    const candidatos = buscarLotes(data, r.lote, r.campo);
    if (candidatos.length !== 1) {
      noEncontrados.push({ ...r, motivo: candidatos.length === 0 ? 'no encontrado' : `ambiguo (${candidatos.length} candidatos)` });
      continue;
    }
    const lote = candidatos[0];
    data.analisis.push({ id: uid(), loteId: lote.id, tipo: 'Fertilidad', fecha: FECHA, nNo3_0_20: r.nNo3_0_20, nNo3_20_60: r.nNo3_20_60, mo: r.mo, ph: r.ph });
    resumen.push(`✓ ${r.campo} — ${lote.nombre} — muestra ${r.muestra} (MO ${r.mo}% · N-NO3 0-20:${r.nNo3_0_20} 20-60:${r.nNo3_20_60})`);
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));
  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} fila(s) NO se pudieron resolver:\n`);
    noEncontrados.forEach(r => console.log(`✗ ${r.campo} — ${r.lote} (${r.motivo})`));
  }
  if (commit) {
    save(data);
    console.log('\n✅ Guardado. Entrá al panel de cada lote (pestaña Fertilización) para correr la calculadora Peralta-DISA.');
  } else {
    console.log('\nNada se guardó. Si está bien, corré con --commit');
  }
}

main();
