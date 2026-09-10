// Reconcilia los saldos PENDIENTES viejos de Lartirigoyen (facturas de enero/abril/junio/julio 2026)
// contra el reporte oficial "Pendientes de Remitir" del 3/9/26. Estas facturas ya se habían cargado antes
// con una planilla aproximada — este script AJUSTA lo que ya existe al número exacto del PDF, en vez de
// sumar de cero (para no duplicar).
//
// Cómo busca: para cada producto/fecha de factura de abajo, busca entre las compras de Lartirigoyen
// PENDIENTES (retirado=false) de ese insumo. Si encuentra UNA sola, ajusta su cantidad al valor correcto
// del PDF. Si no encuentra ninguna, crea una nueva. Si encuentra más de una, no toca nada y avisa para
// revisar a mano (mejor eso que adivinar cuál corregir).
//
// Uso:
//   node src/reconciliarPendientesLartirigoyen.js            -> DRY RUN
//   node src/reconciliarPendientesLartirigoyen.js --commit    -> ejecuta y guarda

const { load, save, uid } = require('./db');

// Saldo pendiente REAL de cada factura vieja, según el PDF "Pendientes de Remitir" del 3/9/26
const SALDOS_REALES = [
  { insumo: 'Atrazina', unidad: 'kg', pendienteReal: 20, precioContado: 5.5883, fecha: '2026-01-07', vencimiento: '2026-12-27', factura: '0412-00002839' },
  { insumo: 'Atrazina', unidad: 'kg', pendienteReal: 390, precioContado: 6.2381, fecha: '2026-06-26', vencimiento: '2027-06-26', factura: '0412-00003297' },
  { insumo: 'Glifosato', unidad: 'kg', pendienteReal: 195, precioContado: 7.4419, fecha: '2026-06-26', vencimiento: '2027-06-26', factura: '0412-00003297' },
  { insumo: 'Dicamba', unidad: 'L', pendienteReal: 60, precioContado: 7.0042, fecha: '2026-06-26', vencimiento: '2027-06-26', factura: '0412-00003297' },
  { insumo: 'Urea', unidad: 'kg', pendienteReal: 1240, precioContado: 0.5855, fecha: '2026-06-26', vencimiento: '2027-06-26', factura: '0412-00003298' },
  { insumo: 'Urea', unidad: 'kg', pendienteReal: 620, precioContado: 0.5852, fecha: '2026-07-02', vencimiento: '2027-07-02', factura: '0412-00003311' },
  { insumo: 'Flurocloridona', unidad: 'L', pendienteReal: 40, precioContado: 14.56, fecha: '2026-04-27', vencimiento: '2027-04-27', factura: '0412-00003133' },
];

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const resumen = [];
  const paraRevisar = [];

  const lartirigoyen = data.proveedores.find(p => p.nombre.toLowerCase() === 'lartirigoyen');
  if (!lartirigoyen) { console.log('No encontré el proveedor Lartirigoyen.'); return; }

  for (const s of SALDOS_REALES) {
    const insumo = data.insumos.find(i => i.nombre.toLowerCase() === s.insumo.toLowerCase());
    if (!insumo) { paraRevisar.push(`${s.insumo} — no existe ese insumo todavía, se va a crear uno nuevo pendiente de ${s.pendienteReal}${s.unidad}`); continue; }

    const candidatas = data.compras.filter(c => c.proveedorId === lartirigoyen.id && c.insumoId === insumo.id && !c.retirado);

    if (candidatas.length === 0) {
      resumen.push(`+ ${s.insumo} — se crea pendiente nuevo de ${s.pendienteReal}${s.unidad} (factura ${s.factura}, ${s.fecha}) — no había ninguna cargada antes`);
      if (commit) {
        data.compras.push({
          id: uid(), proveedorId: lartirigoyen.id, insumoId: insumo.id, cantidad: s.pendienteReal, unidad: s.unidad,
          precioUnitario: s.precioContado, precioContado: s.precioContado, precioFinanciado: null,
          montoTotal: s.pendienteReal * s.precioContado, condicion: 'Financiado (ver factura Lartirigoyen)', fecha: s.fecha,
          ubicacion: 'Depósito Lartirigoyen, Jesús María', retirado: false, vencimiento: s.vencimiento, numeroFactura: s.factura, notas: 'Cargado desde reconciliación con PDF "Pendientes de Remitir" 3/9/26',
        });
      }
    } else if (candidatas.length === 1) {
      const actual = Number(candidatas[0].cantidad);
      if (Math.abs(actual - s.pendienteReal) < 0.01) {
        resumen.push(`= ${s.insumo} — ya estaba correcto (${s.pendienteReal}${s.unidad} pendiente)`);
      } else {
        resumen.push(`~ ${s.insumo} — se ajusta de ${actual}${s.unidad} a ${s.pendienteReal}${s.unidad} pendiente (factura ${s.factura})`);
        if (commit) {
          candidatas[0].cantidad = s.pendienteReal;
          candidatas[0].montoTotal = s.pendienteReal * (Number(candidatas[0].precioUnitario) || s.precioContado);
          if (!candidatas[0].numeroFactura) candidatas[0].numeroFactura = s.factura;
        }
      }
    } else {
      paraRevisar.push(`${s.insumo} — encontré ${candidatas.length} compras pendientes distintas de este insumo a Lartirigoyen, no sé cuál corregir. Debería quedar en ${s.pendienteReal}${s.unidad} en total. Revisar a mano en el panel.`);
    }
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO RECONCILIACIÓN' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));
  if (paraRevisar.length > 0) {
    console.log(`\n⚠️  Para revisar a mano (${paraRevisar.length}):\n`);
    paraRevisar.forEach(l => console.log(`- ${l}`));
  }

  if (commit) {
    save(data);
    console.log('\n✅ Guardado.');
  } else {
    console.log('\nNada se guardó. Revisá el listado. Si está bien, corré con --commit');
  }
}

main();
