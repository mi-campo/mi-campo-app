// Corrige el cruce entre El Rosario C2 y C3: quedaron con el cultivo invertido.
// C2 tenía Trigo (era Garbanzo) y C3 tenía Garbanzo (era Trigo). Este script:
// 1. Borra las siembras viejas (mal cargadas) de esos 2 lotes.
// 2. Carga las siembras correctas, cruzadas.
// 3. Corrige el ciclo de cultivo activo de cada uno.
// No toca fertilizaciones (ninguno de los dos tenía) ni agua útil (no depende del cultivo).
//
// Uso:
//   node src/corregirRosarioC2C3.js            -> DRY RUN
//   node src/corregirRosarioC2C3.js --commit    -> ejecuta y guarda

const { load, save, uid, buscarLotes } = require('./db');

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();

  const c2 = buscarLotes(data, 'C2', 'El Rosario')[0];
  const c3 = buscarLotes(data, 'C3', 'El Rosario')[0];
  if (!c2 || !c3) {
    console.log('No encontré El Rosario C2 y/o C3. C2:', !!c2, 'C3:', !!c3);
    return;
  }

  const correcciones = [
    { lote: c2, cultivo: 'Garbanzo', variedad: 'Norteño', densidad: '298000 semillas/ha', fechaInicio: '2026-06-14', fechaFin: '2026-06-16' },
    { lote: c3, cultivo: 'Trigo', variedad: 'Pehuen', densidad: '145', fechaInicio: '2026-06-12', fechaFin: '2026-06-14' },
  ];

  console.log(`\n=== ${commit ? 'EJECUTANDO CORRECCIÓN' : 'DRY RUN'} ===\n`);

  if (!commit) {
    correcciones.forEach(c => {
      const siembraVieja = data.actividades.find(a => a.loteId === c.lote.id && a.tipo === 'Siembra');
      console.log(`El Rosario — ${c.lote.nombre}: tenía "${siembraVieja?.cultivo || '?'} ${siembraVieja?.variedad || ''}" → pasa a "${c.cultivo} ${c.variedad}" (${c.densidad}, ${c.fechaInicio} a ${c.fechaFin})`);
    });
    console.log('\nNada se guardó. Si está bien, corré con --commit');
    return;
  }

  correcciones.forEach(c => {
    // Borrar siembra vieja de ese lote
    data.actividades = data.actividades.filter(a => !(a.loteId === c.lote.id && a.tipo === 'Siembra'));
    // Cargar siembra correcta
    data.actividades.push({
      id: uid(), loteId: c.lote.id, cicloId: null, tipo: 'Siembra', fecha: c.fechaInicio, metodo: 'Siembra',
      cultivo: c.cultivo, variedad: c.variedad, densidad: c.densidad,
      haReales: '', haFacturadas: '', tarifaContratista: '',
      items: [], costoInsumos: 0, costoContratista: 0, costoTotal: 0,
      notas: `Siembra del ${c.fechaInicio} al ${c.fechaFin} — corregido (estaba cruzado con el lote vecino)`,
    });
    // Cerrar el/los ciclo(s) abiertos viejos de ese lote y abrir el correcto
    data.ciclos = (data.ciclos || []).map(cic => (cic.loteId === c.lote.id && !cic.fechaFin) ? { ...cic, fechaFin: c.fechaInicio } : cic);
    data.ciclos.push({ id: uid(), loteId: c.lote.id, cultivo: c.cultivo, tipo: 'Invierno', campaña: '2026', alquiler: 0, fechaInicio: c.fechaInicio, fechaFin: null });
    console.log(`✓ El Rosario — ${c.lote.nombre} corregido a ${c.cultivo} ${c.variedad}`);
  });

  save(data);
  console.log('\n✅ Guardado.');
}

main();
