// Carga masiva de compras de insumos — Invierno 2026 (Lartirigoyen, Nutritec, S.A.C., Grain).
// Los nombres de insumo ya vienen unificados con los que usan las pulverizaciones/siembras ya cargadas
// (ej "Glifosato Platinum II" y "Glifosato La Tijereta Box" -> "Glifosato"), el nombre de factura original
// queda guardado en "notas" para no perderlo.
// Uso:
//   node src/cargarComprasLartirigoyen2026.js            -> DRY RUN
//   node src/cargarComprasLartirigoyen2026.js --commit    -> ejecuta y guarda

const { load, save, uid } = require('./db');

function normalizarTexto(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function encontrarTolerante(lista, nombreBuscado) {
  const buscado = normalizarTexto(nombreBuscado);
  return lista.find(x => normalizarTexto(x.nombre) === buscado || normalizarTexto(x.nombre).includes(buscado) || buscado.includes(normalizarTexto(x.nombre))) || null;
}

const REGISTROS = [
  { proveedor: 'Lartirigoyen', insumo: 'Nitrocomplex', categoria: 'Fertilizante', cantidad: 26000, unidad: 'kg', precioUnitario: 1.0815, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-17', retirado: true, factura: '0412-00003132', notas: 'Nombre en factura: Fert. Nitrocomplex ZAR Gnel + Flete | En campo | Precio incluye flete.' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D Enlist', categoria: 'Herbicida', cantidad: 300, unidad: 'L', precioUnitario: 6.104, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: true, factura: '0412-00003133', notas: 'Nombre en factura: Herb. ENLIST (2.4D 45,6%) | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Dicamba', categoria: 'Herbicida', cantidad: 50, unidad: 'L', precioUnitario: 7.28, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: true, factura: '0412-00003133', notas: 'Nombre en factura: Herb. Dicamba | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Finesse', categoria: 'Herbicida', cantidad: 6, unidad: 'kg', precioUnitario: 336, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: true, factura: '0412-00003133', notas: 'Nombre en factura: Herb. FINESSE | En campo | Presentacion original: 40 sobres x 150 g (6 kg totales).' },
  { proveedor: 'Lartirigoyen', insumo: 'Flurocloridona', categoria: 'Herbicida', cantidad: 40, unidad: 'L', precioUnitario: 14.56, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: true, factura: '0412-00003133', notas: 'Nombre en factura: Herb. Spirit (Fluroclorido) | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Flurocloridona', categoria: 'Herbicida', cantidad: 80, unidad: 'L', precioUnitario: 14.56, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: false, factura: '0412-00003133', notas: 'Nombre en factura: Herb. Spirit (Fluroclorido) | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: 'MCPA Amina', categoria: 'Herbicida', cantidad: 140, unidad: 'L', precioUnitario: 12.32, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: false, factura: '0412-00003133', notas: 'Nombre en factura: M.C.P.A. 75% | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 500, unidad: 'L', precioUnitario: 5.152, fecha: '2026-04-27', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-19', retirado: true, factura: '0412-00003133', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 100, unidad: 'L', precioUnitario: 6.0336, fecha: '2026-05-15', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-04-30', retirado: true, factura: '0412-00003207', notas: 'Nombre en factura: Glifosato Platinum II | En campo' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 140, unidad: 'L', precioUnitario: 5.1443, fecha: '2026-05-15', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-05', retirado: true, factura: '0412-00003210', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | En campo' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 100, unidad: 'L', precioUnitario: 5.1413, fecha: '2026-05-29', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-14', retirado: true, factura: '0412-00003230', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Curasemillas Amigo', categoria: 'Otro', cantidad: 30, unidad: 'L', precioUnitario: 27.2223, fecha: '2026-05-29', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-10', retirado: true, factura: '0412-00003232', notas: 'En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 160, unidad: 'L', precioUnitario: 6.03, fecha: '2026-06-02', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-18', retirado: true, factura: '0412-00003241', notas: 'Nombre en factura: Herb. Power Plus II | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 300, unidad: 'L', precioUnitario: 6.0188, fecha: '2026-06-12', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-25', retirado: true, factura: '0412-00003256', notas: 'Nombre en factura: Herb. Power Plus II | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Paraquat', categoria: 'Herbicida', cantidad: 20, unidad: 'L', precioUnitario: 3.7965, fecha: '2026-06-12', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2027-05-25', retirado: true, factura: '0412-00003256', notas: 'Nombre en factura: Herb. Paraquat | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 800, unidad: 'L', precioUnitario: 5.3529, fecha: '2026-06-18', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-07', retirado: true, factura: '0412-00003267', notas: 'Nombre en factura: Herb. Power Plus II | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Atrazina', categoria: 'Herbicida', cantidad: 200, unidad: 'kg', precioUnitario: 6.2396, fecha: '2026-06-18', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-07', retirado: true, factura: '0412-00003267', notas: 'Nombre en factura: Atrazina 90 | En campo' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 400, unidad: 'L', precioUnitario: 4.8713, fecha: '2026-06-18', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-07', retirado: true, factura: '0412-00003267', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Dicamba', categoria: 'Herbicida', cantidad: 90, unidad: 'L', precioUnitario: 7.0059, fecha: '2026-06-18', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-07', retirado: true, factura: '0412-00003267', notas: 'Nombre en factura: Herb. Dicamba | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Curasemillas Amigo', categoria: 'Otro', cantidad: 10, unidad: 'L', precioUnitario: 27.021, fecha: '2026-06-25', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-16', retirado: true, factura: '0412-00003293', notas: 'En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 1065, unidad: 'kg', precioUnitario: 7.4419, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: true, factura: '0412-00003297', notas: 'Nombre en factura: Glifosato La Tijereta Box | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 1140, unidad: 'kg', precioUnitario: 7.4419, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: false, factura: '0412-00003297', notas: 'Nombre en factura: Glifosato La Tijereta Box | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 600, unidad: 'L', precioUnitario: 4.8701, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: true, factura: '0412-00003297', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | En campo' },
  { proveedor: 'Lartirigoyen', insumo: '2,4-D', categoria: 'Herbicida', cantidad: 1000, unidad: 'L', precioUnitario: 4.8701, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: false, factura: '0412-00003297', notas: 'Nombre en factura: Herb. 2.4D Ester Etilico | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: 'Atrazina', categoria: 'Herbicida', cantidad: 560, unidad: 'kg', precioUnitario: 6.2381, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: true, factura: '0412-00003297', notas: 'Nombre en factura: Atrazina 90 | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Atrazina', categoria: 'Herbicida', cantidad: 1040, unidad: 'kg', precioUnitario: 6.2381, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: false, factura: '0412-00003297', notas: 'Nombre en factura: Atrazina 90 | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: 'Dicamba', categoria: 'Herbicida', cantidad: 100, unidad: 'L', precioUnitario: 7.0042, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: true, factura: '0412-00003297', notas: 'Nombre en factura: Herb. Dicamba | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Dicamba', categoria: 'Herbicida', cantidad: 160, unidad: 'L', precioUnitario: 7.0042, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: false, factura: '0412-00003297', notas: 'Nombre en factura: Herb. Dicamba | Pendiente de remitir en deposito Lartirigoyen' },
  { proveedor: 'Lartirigoyen', insumo: 'Urea', categoria: 'Fertilizante', cantidad: 60000, unidad: 'kg', precioUnitario: 0.6107, fecha: '2026-06-26', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-15', retirado: false, factura: '0412-00003298', notas: 'Nombre en factura: Urea Granulada Gnel + Flete | Pendiente de remitir en deposito Lartirigoyen | Precio incluye flete.' },
  { proveedor: 'Lartirigoyen', insumo: 'Urea', categoria: 'Fertilizante', cantidad: 30000, unidad: 'kg', precioUnitario: 0.6104, fecha: '2026-07-02', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2027-06-18', retirado: false, factura: '0412-00003311', notas: 'Nombre en factura: Urea Granulada Gnel + Flete | Pendiente de remitir en deposito Lartirigoyen | Precio incluye flete.' },
  { proveedor: 'Lartirigoyen', insumo: 'K-Obiol', categoria: 'Insecticida', cantidad: 2, unidad: 'u', precioUnitario: 37, fecha: '2026-07-27', condicion: 'Financiado al 0.8% mensual en USD', vencimiento: '2026-08-23', retirado: true, factura: '0412-00003370', notas: 'Nombre en factura: K-OBIOL | En campo' },
  { proveedor: 'Lartirigoyen', insumo: 'Atrazina', categoria: 'Herbicida', cantidad: 660, unidad: 'kg', precioUnitario: 6.2388, fecha: '2026-01-07', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2026-12-27', retirado: true, factura: '0412-00002839', notas: 'Nombre en factura: Atrazina 90 | En campo | Precio y plazo estimados en base a compras de Atrazina 90 de la misma temporada (sin factura detallada disponible).' },
  { proveedor: 'Lartirigoyen', insumo: 'Atrazina', categoria: 'Herbicida', cantidad: 20, unidad: 'kg', precioUnitario: 6.2388, fecha: '2026-01-07', condicion: 'Financiado al 1.0% mensual en USD', vencimiento: '2026-12-27', retirado: false, factura: '0412-00002839', notas: 'Nombre en factura: Atrazina 90 | Pendiente de remitir en deposito Lartirigoyen | Precio y plazo estimados en base a compras de Atrazina 90 de la misma temporada (sin factura detallada disponible).' },
  { proveedor: 'Nutritec', insumo: 'Nitrocomplex', categoria: 'Fertilizante', cantidad: 9500, unidad: 'kg', precioUnitario: 0.995, fecha: '2026-06-19', condicion: 'Contado a 30 días', vencimiento: '2026-07-19', retirado: true, factura: '', notas: 'Nombre en factura: Nitrocomplex ZAR | Precio +IVA (neto, como el resto de las compras)' },
  { proveedor: 'S.A.C.', insumo: 'Glifosato', categoria: 'Herbicida', cantidad: 3000, unidad: 'L', precioUnitario: 6.35, fecha: '2026-04-24', condicion: 'Canje de granos (soja/maíz), liquidación mayo 2027', vencimiento: '2027-05-01', retirado: true, factura: '', notas: 'Nombre en factura: Roundup Top | Pago por canje de granos, no en USD directo | Día exacto de vencimiento en mayo 2027 no especificado, se puso el 01' },
  { proveedor: 'Grain', insumo: 'Rizopack Garbanzo 313', categoria: 'Otro', cantidad: 49, unidad: 'pack', precioUnitario: 392.45, fecha: '2026-04-23', condicion: 'Financiado sin interés (0%)', vencimiento: '2026-12-01', retirado: true, factura: '', notas: 'Precio +IVA (neto) | Día exacto de vencimiento en diciembre 2026 no especificado, se puso el 01' },
  { proveedor: 'Grain', insumo: 'Curasemillas Amigo', categoria: 'Otro', cantidad: 180, unidad: 'L', precioUnitario: 25.3, fecha: '2026-04-23', condicion: 'Financiado al 0.6% mensual en USD', vencimiento: '2027-05-01', retirado: true, factura: '', notas: 'Nombre en factura: Fungicida Amigo Nova | Día exacto de vencimiento en mayo 2027 no especificado, se puso el 01' },
  { proveedor: 'S.A.C.', insumo: 'Prometrina', categoria: 'Herbicida', cantidad: 1340, unidad: 'L', precioUnitario: 7.15, fecha: '2026-04-24', condicion: 'Financiado al 0.6% mensual en USD', vencimiento: '2027-05-01', retirado: true, factura: '', notas: 'Día exacto de vencimiento en mayo 2027 no especificado, se puso el 01' },
  { proveedor: 'Grain', insumo: 'Tiffon', categoria: 'Otro', cantidad: 12, unidad: 'L', precioUnitario: 26.40, fecha: '2026-07-29', condicion: 'Financiado al 0.7% mensual en USD', vencimiento: '2026-12-01', retirado: false, factura: '', notas: 'Regulador de crecimiento | Día exacto de vencimiento en diciembre 2026 no especificado, se puso el 01' },
  { proveedor: 'Grain', insumo: 'Pinxit', categoria: 'Herbicida', cantidad: 20, unidad: 'L', precioUnitario: 41.25, fecha: '2026-07-29', condicion: 'Financiado al 0.7% mensual en USD', vencimiento: '2026-12-01', retirado: false, factura: '', notas: 'Graminicida (pinoxaden) | Día exacto de vencimiento en diciembre 2026 no especificado, se puso el 01' },
  { proveedor: 'Grain', insumo: 'Moddus', categoria: 'Otro', cantidad: 20, unidad: 'L', precioUnitario: 44, fecha: '2026-07-29', condicion: 'Financiado al 0.7% mensual en USD', vencimiento: '2026-12-01', retirado: false, factura: '', notas: 'Regulador de crecimiento | Día exacto de vencimiento en diciembre 2026 no especificado, se puso el 01' },
];

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const resumen = [];

  for (const r of REGISTROS) {
    let proveedor = encontrarTolerante(data.proveedores, r.proveedor);
    if (!proveedor) {
      proveedor = { id: uid(), nombre: r.proveedor, contacto: '' };
      if (commit) data.proveedores.push(proveedor);
    }
    let insumo = encontrarTolerante(data.insumos, r.insumo);
    if (!insumo) {
      insumo = { id: uid(), nombre: r.insumo, categoria: r.categoria, unidad: r.unidad, stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
      if (commit) data.insumos.push(insumo);
    }

    const yaExiste = data.compras.some(c => (r.factura ? c.numeroFactura === r.factura : true) && c.insumoId === insumo.id && Number(c.cantidad) === r.cantidad && c.fecha === r.fecha && Number(c.precioUnitario) === r.precioUnitario);
    if (yaExiste) {
      resumen.push(`⏭️  ${r.fecha} — ${r.insumo} — fact. ${r.factura} — ya estaba cargada, se salteó`);
      continue;
    }

    if (commit) {
      data.compras.push({
        id: uid(), proveedorId: proveedor.id, insumoId: insumo.id,
        cantidad: r.cantidad, precioUnitario: r.precioUnitario, montoTotal: r.cantidad * r.precioUnitario,
        condicion: r.condicion, fecha: r.fecha, ubicacion: r.retirado ? '' : 'Depósito Lartirigoyen',
        retirado: r.retirado, vencimiento: r.vencimiento, numeroFactura: r.factura, notas: r.notas,
      });
      if (r.retirado) insumo.stock = (Number(insumo.stock) || 0) + r.cantidad;
      insumo.costoUnitario = r.precioUnitario;
    }

    resumen.push(`✓ ${r.fecha} — ${r.insumo} — ${r.cantidad}${r.unidad} × USD ${r.precioUnitario} = USD ${(r.cantidad * r.precioUnitario).toFixed(2)} — ${r.retirado ? 'retirado (suma stock)' : 'pendiente (no suma stock)'} — fact. ${r.factura}`);
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN'} (${REGISTROS.length} compras) ===\n`);
  resumen.forEach(l => console.log(l));

  const totalUSD = REGISTROS.reduce((s, r) => s + r.cantidad * r.precioUnitario, 0);
  console.log(`\n💰 Total de las ${REGISTROS.length} compras: USD ${totalUSD.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`);

  if (commit) {
    save(data);
    console.log('\n✅ Guardado. Los insumos nuevos/existentes quedaron con stock actualizado según "retirado".');
  } else {
    console.log('\nNada se guardó. Revisá el listado y el total. Si está bien, corré con --commit');
  }
}

main();
