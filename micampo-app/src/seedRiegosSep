// Se corre UNA sola vez: node src/seedRiegosSep.js
// Usa el mismo motor (procesar) que usa el bot real — mismo chequeo de duplicados, misma tarifa, mismo balance.

const { procesar } = require('./botHandlers');

const filas = [
  { fecha: '2026-08-04', campo: 'El Rosario', lote: 'C3', mm: 15, fuente: 'Bomba Oeste', notaExtra: 'incorporando fertilizantes' },
  { fecha: '2026-08-04', campo: 'El Rosario', lote: 'C1', mm: 15, fuente: 'Bomba Este', notaExtra: 'incorporando fertilizantes' },
  { fecha: '2026-08-21', campo: 'Efraín', lote: 'C4', mm: 20 },
  { fecha: '2026-08-24', campo: 'El Rosario', lote: 'C3', mm: 20, fuente: 'Bomba Oeste' },
  { fecha: '2026-08-25', campo: 'Bustamante', lote: 'C3', mm: 20 },
  { fecha: '2026-08-25', campo: 'El Rosario', lote: 'C1', mm: 20, fuente: 'Bomba Este' },
  { fecha: '2026-08-27', campo: 'El Rosario', lote: 'C3', mm: 20, fuente: 'Bomba Oeste' },
  { fecha: '2026-08-28', campo: 'Efraín', lote: 'C4', mm: 20 },
  { fecha: '2026-08-29', campo: 'El Rosario', lote: 'C1', mm: 20, fuente: 'Bomba Este' },
  { fecha: '2026-08-31', campo: 'El Rosario', lote: 'C4', mm: 20, fuente: 'Bomba Oeste' },
  { fecha: '2026-08-31', campo: 'El Rosario', lote: 'C1', mm: 20, fuente: 'Bomba Este' },
  { fecha: '2026-08-31', campo: 'Bustamante', lote: 'C3', mm: 20 },
  { fecha: '2026-09-03', campo: 'El Rosario', lote: 'C3', mm: 20, fuente: 'Bomba Oeste' },
  { fecha: '2026-09-04', campo: 'La Silvina', lote: 'C2', mm: 20 },
  { fecha: '2026-09-07', campo: 'La Silvina', lote: 'C2', mm: 20 },
  { fecha: '2026-09-07', campo: 'El Rosario', lote: 'C2', mm: 20, fuente: 'Bomba Este' },
  { fecha: '2026-09-07', campo: 'El Rosario', lote: 'C3', mm: 20, fuente: 'Bomba Oeste' },
];

(async () => {
  const conNota = [];
  for (const f of filas) {
    const resultado = await procesar({ tipo: 'riego', lote: f.lote, campo: f.campo, mm: f.mm, fecha: f.fecha, fuente: f.fuente });
    console.log('---');
    console.log(`${f.fecha} — ${f.campo} ${f.lote} — ${f.mm}mm${f.fuente ? ` (${f.fuente})` : ''}`);
    console.log(resultado);
    if (f.notaExtra) conNota.push(`${f.fecha} — ${f.campo} ${f.lote}: "${f.notaExtra}" — revisar si hace falta cargar también una Fertilización aparte`);
  }
  console.log('\n=== LISTO ===');
  if (conNota.length) {
    console.log('\nPendiente de revisar (mencionaban fertilización junto con el riego, no cargada como actividad aparte):');
    conNota.forEach(n => console.log('- ' + n));
  }
})();
