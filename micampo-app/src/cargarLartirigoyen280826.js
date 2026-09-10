// Carga: (1) la factura nueva de Lartirigoyen del 28/08/26 (13 productos, comprobantes 00003473/00003474),
// separada en lo YA remitido vs lo pendiente según el reporte "Pendientes de Remitir" del 3/9/26, y
// (2) los retiros directos de otros proveedores (Ninci Agüero, Grain, Mas Agro) que ya fueron a campo.
//
// NO toca las compras de Lartirigoyen ya cargadas antes (las de cargarComprasInvierno2026.js) — esta es
// pura carga incremental. Los saldos pendientes VIEJOS (Atrazina de enero/junio, Glifosato/Dicamba/Spirit
// de junio) quedan afuera de este script a propósito, para revisarlos aparte y no arriesgar una doble carga.
//
// Uso:
//   node src/cargarLartirigoyen280826.js            -> DRY RUN
//   node src/cargarLartirigoyen280826.js --commit    -> ejecuta y guarda

const { load, save, uid } = require('./db');

function nombreReal(apodo) {
  const mapa = {
    'glifosato la tijereta box': 'Glifosato',
    'clethodim 24%': 'Cletodim',
    '2.4 d elite': '2,4-D ME',
    'enlist (2.4 d 45,6%)': '2,4-D Enlist',
    's-metolacloro': 'S-Metolacloro',
    'atrazina 90': 'Atrazina',
    'yamato top': 'Yamato Top',
    'sulfentrazone': 'Sulfentrazone',
    'nyambi flo': 'Flumioxazim',
    'coragen evo': 'Coragen Evo',
    'heat': 'Heat',
    'abamectina 3.6%': 'Abamectina',
    'diflufenican 50 %': 'Diflufenican',
    'stagger': 'Stagger',
    '2,4d me': '2,4-D ME',
    'azoxy agro': 'Azoxy Agro',
    'cibus m': 'Cibus M',
    'convey': 'Convey',
    'touchdown max': 'Glifosato',
  };
  return mapa[apodo.toLowerCase()] || apodo;
}

const CONDICION_LARTI = 'En dólares contra FW, financiado a 360 días al 9% anual en USD';
const VENCIMIENTO_LARTI = '2027-07-30';
const FECHA_FACTURA = '2026-08-28';

// Cada línea de la factura 28/08/26: cantidad total facturada y cuánto de eso ya se remitió (según el
// reporte de pendientes del 3/9/26 — el resto sigue en depósito Lartirigoyen, Jesús María).
const FACTURA_LARTI_280826 = [
  { producto: 'glifosato la tijereta box', unidad: 'kg', cantidad: 12000, precioContado: 6.70, remitido: 330 },
  { producto: 'clethodim 24%', unidad: 'L', cantidad: 5300, precioContado: 6.43, remitido: 0 },
  { producto: '2.4 d elite', unidad: 'L', cantidad: 4500, precioContado: 3.32, remitido: 420 },
  { producto: 'enlist (2.4 d 45,6%)', unidad: 'L', cantidad: 1400, precioContado: 5.39, remitido: 0 },
  { producto: 's-metolacloro', unidad: 'L', cantidad: 2000, precioContado: 6.59, remitido: 0 },
  { producto: 'atrazina 90', unidad: 'kg', cantidad: 2200, precioContado: 5.99, remitido: 0 },
  { producto: 'yamato top', unidad: 'L', cantidad: 320, precioContado: 66.47, remitido: 0 },
  { producto: 'sulfentrazone', unidad: 'L', cantidad: 1050, precioContado: 18.41, remitido: 0 },
  { producto: 'nyambi flo', unidad: 'L', cantidad: 280, precioContado: 23.97, remitido: 0 },
  { producto: 'coragen evo', unidad: 'L', cantidad: 25, precioContado: 163.44, remitido: 0 },
  { producto: 'heat', unidad: 'u', cantidad: 50, precioContado: 110.05, remitido: 0, nota: 'Frasco x 350gr — cantidad en frascos, no litros/kg' },
  { producto: 'abamectina 3.6%', unidad: 'L', cantidad: 1100, precioContado: 10.02, remitido: 0 },
  { producto: 'diflufenican 50 %', unidad: 'L', cantidad: 310, precioContado: 21.79, remitido: 0 },
];

// Retiros directos ya hechos (fueron a campo), de proveedores que no son Lartirigoyen
const RETIROS_OTROS = [
  { proveedor: 'Ninci Agüero', producto: 'stagger', unidad: 'L', cantidad: 7, precioContado: 41.80, fecha: '2026-08-01', condicion: 'Contado' },
  { proveedor: 'Grain', producto: '2,4d me', unidad: 'L', cantidad: 300, precioContado: 3.52, fecha: '2026-08-25', condicion: 'Financiado en USD, vence diciembre 2026', vencimiento: '2026-12-31', factura: '0003-00002310' },
  { proveedor: 'Grain', producto: 'azoxy agro', unidad: 'L', cantidad: 30, precioContado: 13.16, fecha: '2026-08-25', condicion: 'Financiado en USD, vence diciembre 2026', vencimiento: '2026-12-31', factura: '0003-00002310', nota: 'Remito 0002-00004182, facturado también por cuenta y orden en la 0003-00002311 — es la misma entrega física, no se duplicó.' },
  { proveedor: 'Grain', producto: 'cibus m', unidad: 'kg', cantidad: 300, precioContado: 6.43, fecha: '2026-08-25', condicion: 'Financiado en USD, vence diciembre 2026', vencimiento: '2026-12-31', factura: '0003-00002295', nota: '240kg (rem. 4186) + 60kg (rem. 4189)' },
  { proveedor: 'Grain', producto: 'convey', unidad: 'L', cantidad: 10, precioContado: 295.63, fecha: '2026-08-25', condicion: 'Financiado en USD, vence diciembre 2026', vencimiento: '2026-12-31', factura: '0003-00002295' },
  { proveedor: 'Grain', producto: 'touchdown max', unidad: 'L', cantidad: 30, precioContado: 6.38, fecha: '2026-08-25', condicion: 'Financiado en USD, vence diciembre 2026', vencimiento: '2026-12-31', factura: '0003-00002295', nota: 'Glifosato marca Touchdown Max (75,7g) — unificado con el resto de Glifosato' },
  { proveedor: 'Mas Agro', producto: 'convey', unidad: 'L', cantidad: 4, precioContado: 291.6, fecha: '2026-08-01', condicion: 'Contado' },
];

function encontrarOCrearInsumo(data, nombre, unidad) {
  let insumo = data.insumos.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
  if (!insumo) {
    insumo = { id: uid(), nombre, categoria: 'Herbicida', especificar: '', unidad: unidad || 'L', stock: 0, stockMinimo: 0, costoUnitario: 0, clienteId: null };
    data.insumos.push(insumo);
  }
  return insumo;
}
function encontrarOCrearProveedor(data, nombre) {
  let proveedor = data.proveedores.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (!proveedor) {
    proveedor = { id: uid(), nombre, contacto: '' };
    data.proveedores.push(proveedor);
  }
  return proveedor;
}

function main() {
  const commit = process.argv.includes('--commit');
  const data = load();
  const resumen = [];

  const lartirigoyen = encontrarOCrearProveedor(data, 'Lartirigoyen');

  // --- Factura Lartirigoyen 28/08/26, separada en remitido/pendiente ---
  for (const f of FACTURA_LARTI_280826) {
    const insumo = encontrarOCrearInsumo(data, nombreReal(f.producto), f.unidad);
    const pendiente = f.cantidad - f.remitido;
    const notaBase = `Factura 0412 (28/08/26)${f.nota ? ' — ' + f.nota : ''}`;

    if (f.remitido > 0) {
      resumen.push(`✓ ${insumo.nombre} — ${f.remitido}${f.unidad} RETIRADO (remitido a Jesús María) — Lartirigoyen`);
      if (commit) {
        data.compras.push({
          id: uid(), proveedorId: lartirigoyen.id, insumoId: insumo.id, cantidad: f.remitido, unidad: f.unidad,
          precioUnitario: f.precioContado, precioContado: f.precioContado, precioFinanciado: null,
          montoTotal: f.remitido * f.precioContado, condicion: CONDICION_LARTI, fecha: FECHA_FACTURA,
          ubicacion: '', retirado: true, vencimiento: VENCIMIENTO_LARTI, notas: notaBase,
        });
        insumo.stock = (Number(insumo.stock) || 0) + f.remitido;
        insumo.costoUnitario = f.precioContado;
      }
    }
    if (pendiente > 0) {
      resumen.push(`⏳ ${insumo.nombre} — ${pendiente}${f.unidad} PENDIENTE (depósito Lartirigoyen, Jesús María)`);
      if (commit) {
        data.compras.push({
          id: uid(), proveedorId: lartirigoyen.id, insumoId: insumo.id, cantidad: pendiente, unidad: f.unidad,
          precioUnitario: f.precioContado, precioContado: f.precioContado, precioFinanciado: null,
          montoTotal: pendiente * f.precioContado, condicion: CONDICION_LARTI, fecha: FECHA_FACTURA,
          ubicacion: 'Depósito Lartirigoyen, Jesús María', retirado: false, vencimiento: VENCIMIENTO_LARTI, notas: notaBase,
        });
      }
    }
  }

  // --- Retiros directos de otros proveedores ---
  for (const r of RETIROS_OTROS) {
    const proveedor = encontrarOCrearProveedor(data, r.proveedor);
    const insumo = encontrarOCrearInsumo(data, nombreReal(r.producto), r.unidad);
    resumen.push(`✓ ${insumo.nombre} — ${r.cantidad}${r.unidad} RETIRADO (a campo) — ${proveedor.nombre}`);
    if (commit) {
      data.compras.push({
        id: uid(), proveedorId: proveedor.id, insumoId: insumo.id, cantidad: r.cantidad, unidad: r.unidad,
        precioUnitario: r.precioContado, precioContado: r.precioContado, precioFinanciado: null,
        montoTotal: r.precioContado ? r.cantidad * r.precioContado : 0, condicion: r.condicion, fecha: r.fecha,
        ubicacion: 'Campo', retirado: true, vencimiento: r.vencimiento || '', numeroFactura: r.factura || '', notas: r.nota || '',
      });
      insumo.stock = (Number(insumo.stock) || 0) + r.cantidad;
      if (r.precioContado) insumo.costoUnitario = r.precioContado;
    }
  }

  console.log(`\n=== ${commit ? 'EJECUTANDO CARGA' : 'DRY RUN'} ===\n`);
  resumen.forEach(l => console.log(l));

  if (commit) {
    save(data);
    console.log('\n✅ Guardado.');
  } else {
    console.log('\nNada se guardó. Revisá el listado. Si está bien, corré con --commit');
  }
}

main();
