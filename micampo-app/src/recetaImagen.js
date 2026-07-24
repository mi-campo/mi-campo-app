const sharp = require('sharp');

function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fechaDDMMAAAA(fechaISO) {
  if (!fechaISO) return '';
  const [y, m, d] = String(fechaISO).split('-');
  if (!y || !m || !d) return fechaISO;
  return `${d}/${m}/${y}`;
}

// Genera el SVG de la orden de trabajo / receta de pulverizacion, con el mismo formato del talonario en papel
// (sin ningun logo de proveedor), y lo rasteriza a PNG con sharp.
async function generarImagenReceta(receta) {
  const COL_X = { fecha: 20, lote: 110, has: 200, producto: 270, dosis: 490, total: 600, obs: 710 };
  const COL_W = { fecha: 90, lote: 90, has: 70, producto: 220, dosis: 110, total: 110, obs: 190 };
  const ANCHO = 920;
  const FILA_H = 40;
  const filas = receta.items.length;
  const topTabla = 170;
  const headerTablaH = 50;
  const altoTabla = headerTablaH + filas * FILA_H;
  const yApoyo = topTabla + altoTabla + 40;
  const ALTO = yApoyo + 60;

  const filasSvg = receta.items.map((it, i) => {
    const y = topTabla + headerTablaH + i * FILA_H;
    const cy = y + FILA_H / 2 + 5;
    return `
      <rect x="20" y="${y}" width="${ANCHO - 40}" height="${FILA_H}" fill="${i % 2 === 0 ? '#ffffff' : '#f7f7f5'}" stroke="#333" stroke-width="1"/>
      <text x="${COL_X.fecha + 10}" y="${cy}" font-size="15" font-family="Arial">${i === 0 ? escapeXml(fechaDDMMAAAA(receta.fecha)) : ''}</text>
      <text x="${COL_X.lote + 10}" y="${cy}" font-size="15" font-family="Arial">${i === 0 ? escapeXml(receta.lote) : ''}</text>
      <text x="${COL_X.has + 10}" y="${cy}" font-size="15" font-family="Arial">${i === 0 ? escapeXml(receta.hectareasAplicables) : ''}</text>
      <text x="${COL_X.producto + 10}" y="${cy}" font-size="15" font-family="Arial">${escapeXml(it.producto)}</text>
      <text x="${COL_X.dosis + 10}" y="${cy}" font-size="15" font-family="Arial">${escapeXml(it.dosisPorHa)}</text>
      <text x="${COL_X.total + 10}" y="${cy}" font-size="15" font-family="Arial" font-weight="bold">${escapeXml(it.totalProducto.toFixed(1))}</text>
      <text x="${COL_X.obs + 10}" y="${cy}" font-size="13" font-family="Arial">${i === 0 ? escapeXml(receta.observaciones || '') : ''}</text>
    `;
  }).join('');

  const cols = ['fecha', 'lote', 'has', 'producto', 'dosis', 'total', 'obs'];
  const lineasVerticales = cols.map(c => `<line x1="${COL_X[c]}" y1="${topTabla}" x2="${COL_X[c]}" y2="${topTabla + altoTabla}" stroke="#333" stroke-width="1"/>`).join('');

  const svg = `
<svg width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${ANCHO}" height="${ALTO}" fill="#ffffff"/>
  <text x="20" y="40" font-size="24" font-family="Arial" font-weight="bold" fill="#27500A">REGISTRO DE PULVERIZACIÓN</text>
  <line x1="20" y1="52" x2="${ANCHO - 20}" y2="52" stroke="#27500A" stroke-width="2"/>
  <text x="20" y="82" font-size="16" font-family="Arial">Establecimiento: <tspan font-weight="bold">${escapeXml(receta.establecimiento)}</tspan></text>
  <text x="${ANCHO - 260}" y="82" font-size="16" font-family="Arial">N° de orden: <tspan font-weight="bold" fill="#27500A">${escapeXml(String(receta.numero).padStart(5, '0'))}</tspan></text>
  <text x="20" y="108" font-size="14" font-family="Arial" fill="#5f5e5a">Fecha: ${escapeXml(fechaDDMMAAAA(receta.fecha))}</text>

  <rect x="20" y="${topTabla}" width="${ANCHO - 40}" height="${headerTablaH}" fill="#3B6D11"/>
  <text x="${COL_X.fecha + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">FECHA</text>
  <text x="${COL_X.lote + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">LOTE</text>
  <text x="${COL_X.has + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">HAS.</text>
  <text x="${COL_X.producto + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">PRODUCTO</text>
  <text x="${COL_X.dosis + 10}" y="${topTabla + 20}" font-size="12" font-family="Arial" font-weight="bold" fill="#ffffff">DOSIS X</text>
  <text x="${COL_X.dosis + 10}" y="${topTabla + 36}" font-size="12" font-family="Arial" font-weight="bold" fill="#ffffff">HAS.</text>
  <text x="${COL_X.total + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">TOTAL</text>
  <text x="${COL_X.obs + 10}" y="${topTabla + 30}" font-size="13" font-family="Arial" font-weight="bold" fill="#ffffff">OBSERVACIONES</text>

  ${filasSvg}
  <rect x="20" y="${topTabla}" width="${ANCHO - 40}" height="${altoTabla}" fill="none" stroke="#333" stroke-width="1.5"/>
  ${lineasVerticales}

  <text x="20" y="${yApoyo}" font-size="14" font-family="Arial" fill="#5f5e5a">Apoyo / observaciones generales: ${escapeXml(receta.apoyo || '')}</text>
  <text x="20" y="${ALTO - 15}" font-size="11" font-family="Arial" fill="#aaa89f">Generado por MI CAMPO — ${escapeXml(fechaDDMMAAAA(receta.fecha))}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { generarImagenReceta };
