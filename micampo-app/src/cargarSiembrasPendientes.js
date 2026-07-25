// Carga las 2 siembras que quedaron pendientes de cargarSiembras2026.js por ambigüedad de nombre de lote.
// Uso:
//   node src/cargarSiembrasPendientes.js            -> DRY RUN
//   node src/cargarSiembrasPendientes.js --commit    -> ejecuta y guarda

const { load, save, uid, buscarLotes, precioPromedio } = require('./db');

const OBJETIVO_RIEGO_POR_CULTIVO = { Garbanzo: 400, Trigo: 550, Soja: 120, Maíz: 200 };

const REGISTROS = [
  { campo: 'La Nazarena', lote: 'Secano (Oeste)', cultivo: 'Trigo', variedad: 'Pehuen', metodo: 'Siembra', fechaInicio: '2026-05-10', fechaFin: '2026-05-12', densidad: '90', fert: { ha: 12, kgHa: 35, insumo: 'Nitrocomplex' }, nota: 'Fertilización parcial: solo 12ha de 35kg/ha nitrocomplex, el resto del lote sin fertilizar' },
  { campo: 'El Rosario', lote: 'Secano (Peressini)', cultivo: 'Garbanzo', variedad: 'Norteño', metodo: 'Siembra', fechaInicio: '2026-06-10', fechaFin: '2026-06-13', densidad: '298000 semillas/ha' },
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

  for (const r of REGISTROS) {
    const candidatos = buscarLotes(data, r.lote, r.campo);
    if (candidatos.length !== 1) {
      noEncontrados.push({ ...r, motivo: candidatos.length === 0 ? 'no encontrado' : `ambiguo (${candidatos.length} candidatos)` });
      continue;
    }
    const lote = candidatos[0];

    data.actividades.push({
      id: uid(), loteId: lote.id, cicloId: null, tipo: 'Siembra', fecha: r.fechaInicio, metodo: r.metodo || '',
      cultivo: r.cultivo, variedad: r.variedad || '', densidad: r.densidad || '',
      haReales: r.haReales || '', haFacturadas: r.haReales || '', tarifaContratista: '',
      items: [], costoInsumos: 0, costoContratista: 0, costoTotal: 0,
      notas: [r.nota, r.fechaFin && r.fechaFin !== r.fechaInicio ? `Siembra del ${r.fechaInicio} al ${r.fechaFin}` : null].filter(Boolean).join(' — '),
    });

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

    const esVerano = ['Soja', 'Maíz'].includes(r.cultivo);
    data.ciclos = (data.ciclos || []).map(c => (c.loteId === lote.id && !c.fechaFin) ? { ...c, fechaFin: r.fechaInicio } : c);
    data.ciclos.push({ id: uid(), loteId: lote.id, cultivo: r.cultivo, tipo: esVerano ? 'Verano' : 'Invierno', campaña: '2026', alquiler: 0, fechaInicio: r.fechaInicio, fechaFin: null });
    const objetivoAuto = OBJETIVO_RIEGO_POR_CULTIVO[r.cultivo];
    if (objetivoAuto && (lote.modo || 'Riego') === 'Riego') {
      data.lotes = data.lotes.map(l => l.id === lote.id ? { ...l, objetivoRiego: objetivoAuto } : l);
    }

    resumen.push(`✓ ${r.campo} — ${lote.nombre} — ${r.cultivo} ${r.variedad || ''} (${r.fechaInicio})${r.fert ? ' + fertilización' : ''}`);
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));
  if (noEncontrados.length > 0) {
    console.log(`\n⚠️  ${noEncontrados.length} fila(s) NO se pudieron resolver:\n`);
    noEncontrados.forEach(r => console.log(`✗ ${r.campo} — ${r.lote} (${r.motivo})`));
  }
  if (commit) {
    save(data);
    console.log('\n✅ Guardado.');
  } else {
    console.log('\nNada se guardó. Si está bien, corré con --commit');
  }
}

main();
