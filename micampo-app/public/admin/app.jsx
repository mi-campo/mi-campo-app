const { useState, useEffect, useMemo } = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const TIPOS_ACTIVIDAD = ['Fitosanitario', 'Riego', 'Siembra', 'Fertilización', 'Cosecha'];
const inputStyle = { padding: '8px 10px', borderRadius: 6, border: '1px solid #d3d1c7', fontSize: 14, fontFamily: 'inherit' };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 6, background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 };
const btnSecondary = { background: '#F1EFE8', color: '#444441', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 };
const btnGhost = { background: 'transparent', border: 'none', color: '#888780', cursor: 'pointer', padding: 4 };
function fmtMoney(n) { return 'USD ' + (n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 }); }
function precioPromedio(data, insumoId) {
  const comprasInsumo = (data.compras || []).filter(c => c.insumoId === insumoId && Number(c.cantidad) > 0);
  if (comprasInsumo.length === 0) {
    const insumo = data.insumos.find(i => i.id === insumoId);
    return insumo ? Number(insumo.costoUnitario) || 0 : 0;
  }
  const totalCantidad = comprasInsumo.reduce((s, c) => s + Number(c.cantidad), 0);
  const totalGastado = comprasInsumo.reduce((s, c) => s + Number(c.cantidad) * Number(c.precioUnitario), 0);
  return totalCantidad > 0 ? totalGastado / totalCantidad : 0;
}
function cicloActivo(data, loteId) { return (data.ciclos || []).find(c => c.loteId === loteId && !c.fechaFin) || null; }
function Card({ children, style }) { return <div style={{ background: '#fff', border: '1px solid #e3e1d8', borderRadius: 12, padding: 16, ...style }}>{children}</div>; }
function Field({ label, children }) { return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={{ fontSize: 12, color: '#5f5e5a' }}>{label}</label>{children}</div>; }

function App() {
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('resumen');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : Promise.reject()).then(setMe).catch(() => window.location.href = '/login.html');
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;
    setSaving(true);
    const t = setTimeout(() => {
      fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .finally(() => setSaving(false));
    }, 500);
    return () => clearTimeout(t);
  }, [data]);

  const update = (key, fn) => setData(d => ({ ...d, [key]: fn(d[key]) }));

  const salir = async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login.html'; };

  if (!data || !me) return <div style={{ padding: 40, color: '#888780' }}>Cargando MI CAMPO…</div>;

  const tabs = [
    ['resumen', 'Resumen'], ['campos', 'Campos y lotes'], ['riego', 'Riego'],
    ['insumos', 'Insumos'], ['proveedores', 'Proveedores'], ['actividades', 'Actividades'],
    ['clientes', 'Clientes'], ['usuarios', 'Usuarios'], ['consultas', 'Consultas'],
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px', borderBottom: '1px solid #e3e1d8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EAF3DE', fontWeight: 'bold' }}>M</div>
          <div><div style={{ fontSize: 17, fontWeight: 500 }}>MI CAMPO</div><div style={{ fontSize: 12, color: '#888780' }}>{me.nombre || me.usuario} · {saving ? 'Guardando…' : 'Guardado'}</div></div>
        </div>
        <button onClick={salir} style={{ ...btnSecondary }}>Salir</button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '10px 4px 0', flexWrap: 'wrap' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', background: tab === id ? '#EAF3DE' : 'transparent', color: tab === id ? '#27500A' : '#5f5e5a', fontWeight: tab === id ? 500 : 400, fontSize: 14 }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 4px' }}>
        {tab === 'resumen' && <Resumen data={data} />}
        {tab === 'campos' && <Campos data={data} update={update} />}
        {tab === 'riego' && <Riego data={data} update={update} />}
        {tab === 'insumos' && <Insumos data={data} update={update} />}
        {tab === 'proveedores' && <Proveedores data={data} update={update} />}
        {tab === 'actividades' && <Actividades data={data} update={update} />}
        {tab === 'clientes' && <Clientes data={data} update={update} />}
        {tab === 'usuarios' && <Usuarios data={data} />}
        {tab === 'consultas' && <Consultas data={data} update={update} />}
      </div>
    </div>
  );
}

/* ---------- RESUMEN ---------- */
function Resumen({ data }) {
  const stats = useMemo(() => {
    const haTotal = data.lotes.reduce((s, l) => s + (Number(l.hectareas) || 0), 0);
    const gastoTotal = data.actividades.reduce((s, a) => s + (a.costoTotal || 0), 0);
    const stockBajo = data.insumos.filter(i => (Number(i.stock) || 0) <= (Number(i.stockMinimo) || 0) && Number(i.stockMinimo) > 0);
    const gastoPorCampo = {};
    data.actividades.forEach(a => {
      const lote = data.lotes.find(l => l.id === a.loteId);
      if (!lote) return;
      const campo = data.campos.find(c => c.id === lote.campoId);
      const nombre = campo ? campo.nombre : 'Sin campo';
      gastoPorCampo[nombre] = gastoPorCampo[nombre] || { gasto: 0, ha: 0, presupuesto: 0 };
      gastoPorCampo[nombre].gasto += a.costoTotal || 0;
    });
    data.campos.forEach(c => {
      const ha = data.lotes.filter(l => l.campoId === c.id).reduce((s, l) => s + (Number(l.hectareas) || 0), 0);
      if (!gastoPorCampo[c.nombre]) gastoPorCampo[c.nombre] = { gasto: 0, ha: 0, presupuesto: 0 };
      gastoPorCampo[c.nombre].ha = ha;
      gastoPorCampo[c.nombre].presupuesto = Number(c.presupuesto) || 0;
    });
    const camposPasados = data.campos.filter(c => (gastoPorCampo[c.nombre]?.gasto || 0) > Number(c.presupuesto) && Number(c.presupuesto) > 0);
    const consultasPendientes = data.consultas.filter(c => !c.respondida).length;
    return { haTotal, gastoTotal, stockBajo, gastoPorCampo, camposPasados, consultasPendientes };
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Card><div style={{ fontSize: 12, color: '#888780' }}>Campos</div><div style={{ fontSize: 22, fontWeight: 500 }}>{data.campos.length}</div></Card>
        <Card><div style={{ fontSize: 12, color: '#888780' }}>Hectáreas totales</div><div style={{ fontSize: 22, fontWeight: 500 }}>{stats.haTotal.toLocaleString('es-AR')}</div></Card>
        <Card><div style={{ fontSize: 12, color: '#888780' }}>Gasto acumulado</div><div style={{ fontSize: 22, fontWeight: 500 }}>{fmtMoney(stats.gastoTotal)}</div></Card>
        <Card><div style={{ fontSize: 12, color: '#888780' }}>Consultas pendientes</div><div style={{ fontSize: 22, fontWeight: 500, color: stats.consultasPendientes > 0 ? '#854F0B' : undefined }}>{stats.consultasPendientes}</div></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Presupuesto</div>
          {stats.camposPasados.length === 0 && <div style={{ fontSize: 13, color: '#888780' }}>Ningún campo se pasó del presupuesto.</div>}
          {stats.camposPasados.map(c => <div key={c.id} style={{ fontSize: 13, color: '#A32D2D', padding: '4px 0' }}>{c.nombre}: {fmtMoney(stats.gastoPorCampo[c.nombre]?.gasto)} de {fmtMoney(c.presupuesto)}</div>)}
        </Card>
        <Card>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Stock crítico</div>
          {stats.stockBajo.length === 0 && <div style={{ fontSize: 13, color: '#888780' }}>Todo dentro del mínimo.</div>}
          {stats.stockBajo.map(i => <div key={i.id} style={{ fontSize: 13, color: '#A32D2D', padding: '4px 0' }}>{i.nombre}: quedan {i.stock} {i.unidad}</div>)}
        </Card>
        <Card>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Actividad reciente</div>
          {data.actividades.length === 0 && <div style={{ fontSize: 13, color: '#888780' }}>Sin actividades todavía.</div>}
          {[...data.actividades].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 5).map(act => {
            const lote = data.lotes.find(l => l.id === act.loteId);
            const campo = data.campos.find(c => c.id === lote?.campoId);
            return <div key={act.id} style={{ fontSize: 13, padding: '4px 0' }}><strong>{act.tipo}</strong> — {campo?.nombre}/{lote?.nombre} — {act.fecha}</div>;
          })}
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Gasto por campo</div>
        {Object.entries(stats.gastoPorCampo).map(([nombre, v]) => {
          const pasado = v.presupuesto > 0 && v.gasto > v.presupuesto;
          return <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1efe8', fontSize: 14 }}>
            <span>{nombre}</span>
            <span style={{ color: pasado ? '#A32D2D' : '#5f5e5a' }}>{fmtMoney(v.gasto)}{v.presupuesto > 0 ? ` / ${fmtMoney(v.presupuesto)}` : ''}{v.ha > 0 ? ` · ${(v.gasto / v.ha).toFixed(1)} USD/ha` : ''}</span>
          </div>;
        })}
      </Card>
    </div>
  );
}

/* ---------- CAMPOS Y LOTES ---------- */
function Campos({ data, update }) {
  const [nuevoCampo, setNuevoCampo] = useState('');
  const [clienteCampo, setClienteCampo] = useState('');
  const [presupuestoCampo, setPresupuestoCampo] = useState('');
  const [porcentajeCampo, setPorcentajeCampo] = useState('');
  const [nuevoLote, setNuevoLote] = useState({});
  const [loteAbierto, setLoteAbierto] = useState(null);

  const addCampo = () => {
    if (!nuevoCampo.trim()) return;
    update('campos', c => [...c, { id: uid(), nombre: nuevoCampo.trim(), clienteId: clienteCampo || null, presupuesto: Number(presupuestoCampo) || 0, porcentajeProductor: Number(porcentajeCampo) || 0 }]);
    setNuevoCampo(''); setClienteCampo(''); setPresupuestoCampo(''); setPorcentajeCampo('');
  };
  const delCampo = (id) => { update('campos', c => c.filter(x => x.id !== id)); update('lotes', l => l.filter(x => x.campoId !== id)); };
  const addLote = (campoId) => {
    const f = nuevoLote[campoId];
    if (!f || !f.nombre) return;
    update('lotes', l => [...l, { id: uid(), campoId, nombre: f.nombre, hectareas: f.hectareas || 0, modo: f.modo || 'Riego', objetivoRiego: 0 }]);
    setNuevoLote(p => ({ ...p, [campoId]: { nombre: '', hectareas: '', modo: 'Riego' } }));
  };
  const delLote = (id) => update('lotes', l => l.filter(x => x.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Nuevo campo</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} placeholder="Nombre del campo" value={nuevoCampo} onChange={e => setNuevoCampo(e.target.value)} />
          <select style={inputStyle} value={clienteCampo} onChange={e => setClienteCampo(e.target.value)}>
            <option value="">Propio</option>
            {data.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input style={{ ...inputStyle, width: 150 }} type="number" placeholder="Presupuesto USD" value={presupuestoCampo} onChange={e => setPresupuestoCampo(e.target.value)} />
          <input style={{ ...inputStyle, width: 110 }} type="number" placeholder="% productor" value={porcentajeCampo} onChange={e => setPorcentajeCampo(e.target.value)} />
          <button onClick={addCampo} style={btnPrimary}>+ Agregar</button>
        </div>
      </Card>

      {data.campos.map(campo => {
        const lotes = data.lotes.filter(l => l.campoId === campo.id);
        const cliente = data.clientes.find(c => c.id === campo.clienteId);
        const f = nuevoLote[campo.id] || { nombre: '', hectareas: '', modo: 'Riego' };
        return (
          <Card key={campo.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 500 }}>{campo.nombre}</span>
                {cliente && <span style={{ fontSize: 12, color: '#993C1D', marginLeft: 8 }}>Cliente: {cliente.nombre} ({campo.porcentajeProductor || 0}%)</span>}
              </div>
              <button onClick={() => delCampo(campo.id)} style={btnGhost}>🗑</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lotes.map(l => {
                const actsLote = data.actividades.filter(a => a.loteId === l.id);
                const gastoLote = actsLote.reduce((s, a) => s + (a.costoTotal || 0), 0);
                const ultima = [...actsLote].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
                const mmAcumulados = actsLote.filter(a => a.tipo === 'Riego' && a.mm).reduce((s, a) => s + Number(a.mm), 0);
                return (
                  <div key={l.id} style={{ padding: '6px 0', borderTop: '1px solid #f1efe8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>{l.nombre} — {l.hectareas} ha ({l.modo || 'Riego'})</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setLoteAbierto(loteAbierto === l.id ? null : l.id)} style={{ ...btnSecondary, padding: '4px 10px' }}>{loteAbierto === l.id ? 'Cerrar' : 'Análisis'}</button>
                        <button onClick={() => delLote(l.id)} style={btnGhost}>✕</button>
                      </div>
                    </div>
                    {actsLote.length > 0 && <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>Gasto: {fmtMoney(gastoLote)}{l.hectareas > 0 ? ` (${(gastoLote / l.hectareas).toFixed(1)} USD/ha)` : ''}{ultima ? ` · Última: ${ultima.tipo} ${ultima.fecha}` : ''}{mmAcumulados > 0 ? ` · Riego: ${mmAcumulados}mm` : ''}</div>}
                    {loteAbierto === l.id && <LoteDetalle lote={l} data={data} update={update} />}
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Nombre de lote" value={f.nombre} onChange={e => setNuevoLote(p => ({ ...p, [campo.id]: { ...f, nombre: e.target.value } }))} />
                <input style={{ ...inputStyle, width: 90 }} placeholder="ha" type="number" value={f.hectareas} onChange={e => setNuevoLote(p => ({ ...p, [campo.id]: { ...f, hectareas: e.target.value } }))} />
                <select style={inputStyle} value={f.modo} onChange={e => setNuevoLote(p => ({ ...p, [campo.id]: { ...f, modo: e.target.value } }))}>
                  <option>Riego</option><option>Secano</option>
                </select>
                <button onClick={() => addLote(campo.id)} style={btnSecondary}>+ Lote</button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- CICLOS DE CULTIVO ---------- */
function Ciclos({ lote, data, update }) {
  const [form, setForm] = useState({ cultivo: '', tipo: 'Invierno', campaña: '', alquiler: '' });
  const ciclos = data.ciclos.filter(c => c.loteId === lote.id).sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  const abierto = ciclos.find(c => !c.fechaFin);
  const hoyStr = () => new Date().toISOString().slice(0, 10);

  const abrirCiclo = () => {
    if (!form.cultivo.trim()) return;
    update('ciclos', cs => {
      // Si había uno abierto, lo cerramos automáticamente al abrir el nuevo
      const cerrados = cs.map(c => (c.loteId === lote.id && !c.fechaFin) ? { ...c, fechaFin: hoyStr() } : c);
      return [...cerrados, { id: uid(), loteId: lote.id, cultivo: form.cultivo.trim(), tipo: form.tipo, campaña: form.campaña, alquiler: Number(form.alquiler) || 0, fechaInicio: hoyStr(), fechaFin: null }];
    });
    setForm({ cultivo: '', tipo: 'Invierno', campaña: '', alquiler: '' });
  };
  const cerrarCiclo = (id) => update('ciclos', cs => cs.map(c => c.id === id ? { ...c, fechaFin: hoyStr() } : c));
  const borrarCiclo = (id) => update('ciclos', cs => cs.filter(c => c.id !== id));

  return (
    <div>
      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Ciclos de cultivo</div>
      {abierto ? (
        <div style={{ padding: 10, background: '#EAF3DE', borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
          <strong>En curso:</strong> {abierto.tipo} — {abierto.cultivo} ({abierto.campaña || 's/campaña'}) desde {abierto.fechaInicio}
          {abierto.alquiler > 0 && <span> · Alquiler asignado: {fmtMoney(abierto.alquiler)}</span>}
          <div style={{ marginTop: 6 }}><button onClick={() => cerrarCiclo(abierto.id)} style={btnSecondary}>Cerrar este ciclo</button></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 10 }}>
          <Field label="Cultivo"><input style={inputStyle} value={form.cultivo} onChange={e => setForm({ ...form, cultivo: e.target.value })} placeholder="ej. Trigo" /></Field>
          <Field label="Tipo"><select style={inputStyle} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Invierno</option><option>Verano</option></select></Field>
          <Field label="Campaña"><input style={inputStyle} value={form.campaña} onChange={e => setForm({ ...form, campaña: e.target.value })} placeholder="ej. 2026" /></Field>
          <Field label="Alquiler asignado (USD)"><input style={inputStyle} type="number" value={form.alquiler} onChange={e => setForm({ ...form, alquiler: e.target.value })} placeholder="opcional" /></Field>
        </div>
      )}
      {!abierto && <button onClick={abrirCiclo} style={btnPrimary}>+ Abrir nuevo ciclo</button>}

      {ciclos.length > 0 && <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#5f5e5a', marginBottom: 4 }}>Historial</div>
        {ciclos.map(c => {
          const actsCiclo = data.actividades.filter(a => a.cicloId === c.id);
          const gastoCiclo = actsCiclo.reduce((s, a) => s + (a.costoTotal || 0), 0) + (Number(c.alquiler) || 0);
          const cargasCiclo = data.cargas.filter(cg => cg.cicloId === c.id);
          const kgTotal = cargasCiclo.reduce((s, cg) => s + Number(cg.kgDestino || cg.kgCampo || 0), 0);
          const rendimiento = lote.hectareas > 0 ? (kgTotal / 100) / lote.hectareas : 0;
          return <div key={c.id} style={{ fontSize: 12, padding: '6px 0', borderTop: '1px solid #e3e1d8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{c.tipo} — {c.cultivo} ({c.campaña || 's/campaña'}) — {c.fechaInicio} a {c.fechaFin || 'en curso'}</span>
              <button onClick={() => borrarCiclo(c.id)} style={btnGhost}>🗑</button>
            </div>
            <div style={{ color: '#888780' }}>Gasto total (con alquiler): {fmtMoney(gastoCiclo)}{rendimiento > 0 ? ` · Rinde: ${rendimiento.toFixed(1)} qq/ha` : ''}</div>
          </div>;
        })}
      </div>}
    </div>
  );
}

/* ---------- COSECHA (dentro del detalle de lote) ---------- */
function Cosecha({ lote, data, update }) {
  const [form, setForm] = useState({ fecha: '', identificador: '', kgCampo: '' });
  const [precios, setPrecios] = useState({ estimado: lote.precioEstimado || '', real: lote.precioReal || '' });
  const ciclo = cicloActivo(data, lote.id);
  const cargas = data.cargas.filter(c => c.loteId === lote.id && (!ciclo || c.cicloId === ciclo.id)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const gastoLote = data.actividades.filter(a => a.loteId === lote.id && (!ciclo || a.cicloId === ciclo.id)).reduce((s, a) => s + (a.costoTotal || 0), 0);

  const agregarCarga = () => {
    if (!form.fecha || !form.identificador || !form.kgCampo) return;
    const ciclo = cicloActivo(data, lote.id);
    update('cargas', c => [...c, { id: uid(), loteId: lote.id, cicloId: ciclo ? ciclo.id : null, fecha: form.fecha, identificador: form.identificador, kgCampo: Number(form.kgCampo), kgDestino: '' }]);
    setForm({ fecha: form.fecha, identificador: '', kgCampo: '' });
  };
  const setKgDestino = (id, val) => update('cargas', c => c.map(x => x.id === id ? { ...x, kgDestino: val } : x));
  const delCarga = (id) => update('cargas', c => c.filter(x => x.id !== id));
  const guardarPrecios = () => update('lotes', ls => ls.map(l => l.id === lote.id ? { ...l, precioEstimado: Number(precios.estimado) || 0, precioReal: Number(precios.real) || 0 } : l));

  const totales = useMemo(() => {
    let totalConfirmado = 0, diferencia = 0, pendientes = 0;
    cargas.forEach(c => {
      if (c.kgDestino !== '' && c.kgDestino != null) { totalConfirmado += Number(c.kgDestino); diferencia += Number(c.kgDestino) - Number(c.kgCampo); }
      else { totalConfirmado += Number(c.kgCampo) || 0; pendientes++; }
    });
    const rendimiento = lote.hectareas > 0 ? (totalConfirmado / 100) / lote.hectareas : 0;
    const precio = Number(lote.precioReal) > 0 ? Number(lote.precioReal) : Number(lote.precioEstimado) || 0;
    const ingreso = (totalConfirmado / 100) * precio;
    const margen = ingreso - gastoLote;
    return { totalConfirmado, diferencia, pendientes, rendimiento, precio, ingreso, margen };
  }, [cargas, lote, gastoLote]);

  return (
    <div>
      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Cosecha — cargas y reconciliación {ciclo ? `(ciclo: ${ciclo.tipo} ${ciclo.cultivo})` : ''}</div>
      {!ciclo && <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 8 }}>No hay un ciclo abierto en este lote — abrí uno abajo para que el rendimiento no se mezcle con años anteriores.</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input style={inputStyle} type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="Patente o Silobolsa" value={form.identificador} onChange={e => setForm({ ...form, identificador: e.target.value })} />
        <input style={{ ...inputStyle, width: 100 }} type="number" placeholder="kg campo" value={form.kgCampo} onChange={e => setForm({ ...form, kgCampo: e.target.value })} />
        <button onClick={agregarCarga} style={btnPrimary}>+ Cargar</button>
      </div>
      {cargas.map(c => {
        const tiene = c.kgDestino !== '' && c.kgDestino != null;
        const diff = tiene ? Number(c.kgDestino) - Number(c.kgCampo) : null;
        return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', borderTop: '1px solid #e3e1d8' }}>
          <span style={{ width: 80 }}>{c.fecha}</span><span style={{ flex: 1 }}>{c.identificador}</span><span style={{ width: 90 }}>Campo: {c.kgCampo}kg</span>
          <input style={{ ...inputStyle, width: 90, padding: '4px 6px' }} type="number" placeholder="kg destino" value={c.kgDestino} onChange={e => setKgDestino(c.id, e.target.value)} />
          {tiene && <span style={{ color: diff === 0 ? '#3B6D11' : diff < 0 ? '#A32D2D' : '#854F0B', width: 90 }}>{diff === 0 ? 'OK' : diff < 0 ? `Falta ${Math.abs(diff)}` : `Sobra ${diff}`}</span>}
          <button onClick={() => delCarga(c.id)} style={btnGhost}>✕</button>
        </div>;
      })}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, margin: '10px 0' }}>
        <Field label="Precio estimado (USD/qq)"><input style={inputStyle} type="number" value={precios.estimado} onChange={e => setPrecios({ ...precios, estimado: e.target.value })} onBlur={guardarPrecios} /></Field>
        <Field label="Precio real (USD/qq)"><input style={inputStyle} type="number" value={precios.real} onChange={e => setPrecios({ ...precios, real: e.target.value })} onBlur={guardarPrecios} /></Field>
      </div>
      {cargas.length > 0 && <div style={{ padding: 12, background: '#EAF3DE', borderRadius: 8, fontSize: 13, color: '#27500A' }}>
        <div>Total confirmado: <strong>{totales.totalConfirmado.toFixed(0)} kg</strong> {totales.pendientes > 0 ? `(${totales.pendientes} esperando balanza)` : ''}</div>
        <div>Rendimiento: <strong>{totales.rendimiento.toFixed(1)} qq/ha</strong></div>
        {totales.precio > 0 && <>
          <div style={{ marginTop: 6 }}>Ingreso: <strong>{fmtMoney(totales.ingreso)}</strong></div>
          <div>Margen: <strong style={{ color: totales.margen >= 0 ? '#27500A' : '#A32D2D' }}>{fmtMoney(totales.margen)}</strong></div>
        </>}
      </div>}
    </div>
  );
}

/* ---------- CALCULADORA PERALTA-DISA ---------- */
function CalculoFertilizacion() {
  const [f, setF] = useState({ rendObj: '', rendRelativo: '1', nNo3_0_20: '', nNo3_20_60: '', mo: '', nanLab: '', arrancador: '0', antecesor: '0', calibracion: 'original' });
  const set = (k, v) => setF({ ...f, [k]: v });
  const resultado = useMemo(() => {
    const rendObj = Number(f.rendObj) || 0;
    if (rendObj <= 0) return null;
    const rendObjZona = rendObj * (Number(f.rendRelativo) || 1);
    const requerimiento = (28 / 0.625) * rendObjZona / 1000;
    const nNo3suelo = (Number(f.nNo3_0_20) || 0) * 1.35 * 2 + (Number(f.nNo3_20_60) || 0) * 1.3 * 4;
    const mo = Number(f.mo) || 0;
    const nan = f.nanLab !== '' ? Number(f.nanLab) : (11.017 * mo) + 18.43;
    const factorNan = f.calibracion === 'calibrado' ? 3.404 : 3.7;
    const mineralizacion = (factorNan * nan + (mo / 100) * 0.58 * 1.3 * 0.2 * 10000 * 0.042 * 1000 / 10) / 2;
    const nFertTotal = Math.max(0, requerimiento - nNo3suelo - (Number(f.arrancador) || 0) - mineralizacion + (Number(f.antecesor) || 0));
    const ureaTotal = nFertTotal / 0.46;
    return { nFertTotal, ureaTotal, requiereSplit: ureaTotal > 235 };
  }, [f]);

  return (
    <div>
      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Fertilización nitrogenada — Peralta-DISA (solo invierno)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        <Field label="Rend. objetivo (kg/ha)"><input style={inputStyle} type="number" value={f.rendObj} onChange={e => set('rendObj', e.target.value)} /></Field>
        <Field label="Rend. relativo zona"><input style={inputStyle} type="number" step="0.01" value={f.rendRelativo} onChange={e => set('rendRelativo', e.target.value)} /></Field>
        <Field label="N-NO3 0-20cm"><input style={inputStyle} type="number" value={f.nNo3_0_20} onChange={e => set('nNo3_0_20', e.target.value)} /></Field>
        <Field label="N-NO3 20-60cm"><input style={inputStyle} type="number" value={f.nNo3_20_60} onChange={e => set('nNo3_20_60', e.target.value)} /></Field>
        <Field label="M.O. 0-20cm (%)"><input style={inputStyle} type="number" value={f.mo} onChange={e => set('mo', e.target.value)} /></Field>
        <Field label="Nan laboratorio"><input style={inputStyle} type="number" value={f.nanLab} onChange={e => set('nanLab', e.target.value)} placeholder="opcional" /></Field>
        <Field label="N arrancador"><input style={inputStyle} type="number" value={f.arrancador} onChange={e => set('arrancador', e.target.value)} /></Field>
        <Field label="Crédito antecesor"><input style={inputStyle} type="number" value={f.antecesor} onChange={e => set('antecesor', e.target.value)} /></Field>
        <Field label="Calibración"><select style={inputStyle} value={f.calibracion} onChange={e => set('calibracion', e.target.value)}><option value="original">Original</option><option value="calibrado">−8% calibrado</option></select></Field>
      </div>
      {resultado && <div style={{ marginTop: 12, padding: 12, background: '#EAF3DE', borderRadius: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: '#27500A' }}>{resultado.ureaTotal.toFixed(0)} kg urea/ha</div>
        <div style={{ fontSize: 12, color: '#3B6D11' }}>{resultado.nFertTotal.toFixed(1)} kg N/ha</div>
        {resultado.requiereSplit && <div style={{ fontSize: 12, color: '#854F0B', marginTop: 6 }}>Supera 235 kg/ha, repartir en 2 aplicaciones.</div>}
      </div>}
    </div>
  );
}

/* ---------- DETALLE DE LOTE ---------- */
function LoteDetalle({ lote, data, update }) {
  const [tipoAnalisis, setTipoAnalisis] = useState('Agua útil');
  const [formA, setFormA] = useState({ fecha: '', aguaUtilMm: '', profundidad: '', nNo3: '', p: '', mo: '', ph: '', notas: '' });
  const [formN, setFormN] = useState({ fecha: '', tipo: 'Observación', texto: '' });
  const analisisLote = data.analisis.filter(a => a.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const notasLote = data.notas.filter(n => n.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const guardarAnalisis = () => {
    if (!formA.fecha) return;
    update('analisis', a => [...a, { id: uid(), loteId: lote.id, tipo: tipoAnalisis, ...formA }]);
    setFormA({ fecha: '', aguaUtilMm: '', profundidad: '', nNo3: '', p: '', mo: '', ph: '', notas: '' });
  };
  const guardarNota = () => {
    if (!formN.fecha || !formN.texto.trim()) return;
    update('notas', n => [...n, { id: uid(), loteId: lote.id, ...formN }]);
    setFormN({ fecha: '', tipo: 'Observación', texto: '' });
  };

  return (
    <div style={{ marginTop: 10, padding: 12, background: '#faf9f6', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ciclos lote={lote} data={data} update={update} />
      <div style={{ borderTop: '1px solid #e3e1d8' }} />
      <Cosecha lote={lote} data={data} update={update} />
      <div style={{ borderTop: '1px solid #e3e1d8' }} />
      <CalculoFertilizacion />
      <div style={{ borderTop: '1px solid #e3e1d8' }} />
      <div>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Nuevo análisis</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select style={inputStyle} value={tipoAnalisis} onChange={e => setTipoAnalisis(e.target.value)}><option>Agua útil</option><option>Fertilidad</option></select>
          <input style={inputStyle} type="date" value={formA.fecha} onChange={e => setFormA({ ...formA, fecha: e.target.value })} />
        </div>
        {tipoAnalisis === 'Agua útil' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <Field label="Agua útil (mm)"><input style={inputStyle} type="number" value={formA.aguaUtilMm} onChange={e => setFormA({ ...formA, aguaUtilMm: e.target.value })} /></Field>
            <Field label="Profundidad (cm)"><input style={inputStyle} type="number" value={formA.profundidad} onChange={e => setFormA({ ...formA, profundidad: e.target.value })} /></Field>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
            <Field label="N-NO3"><input style={inputStyle} type="number" value={formA.nNo3} onChange={e => setFormA({ ...formA, nNo3: e.target.value })} /></Field>
            <Field label="P"><input style={inputStyle} type="number" value={formA.p} onChange={e => setFormA({ ...formA, p: e.target.value })} /></Field>
            <Field label="M.O."><input style={inputStyle} type="number" value={formA.mo} onChange={e => setFormA({ ...formA, mo: e.target.value })} /></Field>
            <Field label="pH"><input style={inputStyle} type="number" value={formA.ph} onChange={e => setFormA({ ...formA, ph: e.target.value })} /></Field>
          </div>
        )}
        <button onClick={guardarAnalisis} style={{ ...btnPrimary, marginTop: 8 }}>+ Guardar análisis</button>
        {analisisLote.map(a => <div key={a.id} style={{ fontSize: 12, color: '#5f5e5a', padding: '4px 0', borderTop: '1px solid #e3e1d8' }}><strong>{a.tipo}</strong> — {a.fecha}</div>)}
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Bitácora</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input style={inputStyle} type="date" value={formN.fecha} onChange={e => setFormN({ ...formN, fecha: e.target.value })} />
          <select style={inputStyle} value={formN.tipo} onChange={e => setFormN({ ...formN, tipo: e.target.value })}><option>Observación</option><option>Acierto</option><option>Error</option></select>
        </div>
        <textarea style={{ ...inputStyle, width: '100%', minHeight: 50 }} placeholder="Qué pasó…" value={formN.texto} onChange={e => setFormN({ ...formN, texto: e.target.value })} />
        <button onClick={guardarNota} style={{ ...btnPrimary, marginTop: 8 }}>+ Guardar nota</button>
        {notasLote.map(n => <div key={n.id} style={{ fontSize: 12, padding: '4px 0', borderTop: '1px solid #e3e1d8' }}><strong>{n.tipo}</strong> — {n.fecha} — {n.texto}</div>)}
      </div>
    </div>
  );
}

/* ---------- RIEGO ---------- */
function Riego({ data, update }) {
  const lotesRiego = data.lotes.filter(l => (l.modo || 'Riego') === 'Riego');
  const setObjetivo = (loteId, val) => update('lotes', ls => ls.map(l => l.id === loteId ? { ...l, objetivoRiego: Number(val) || 0 } : l));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {lotesRiego.map(l => {
        const campo = data.campos.find(c => c.id === l.campoId);
        const riegosLote = data.actividades.filter(a => a.loteId === l.id && a.tipo === 'Riego' && a.mm).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        const acumulado = riegosLote.reduce((s, a) => s + Number(a.mm), 0);
        const objetivo = Number(l.objetivoRiego) || 0;
        const falta = Math.max(0, objetivo - acumulado);
        const aguaUtil = data.analisis.filter(a => a.loteId === l.id && a.tipo === 'Agua útil').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
        return (
          <Card key={l.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 500 }}>{campo?.nombre} — {l.nombre}</span><span style={{ fontSize: 12, color: '#888780' }}>{l.hectareas} ha</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
              <div><div style={{ fontSize: 12, color: '#888780' }}>Acumulado</div><div style={{ fontSize: 18, fontWeight: 500 }}>{acumulado} mm</div></div>
              <div><div style={{ fontSize: 12, color: '#888780' }}>Objetivo</div><input style={{ ...inputStyle, width: 90 }} type="number" value={l.objetivoRiego || ''} onChange={e => setObjetivo(l.id, e.target.value)} /></div>
              <div><div style={{ fontSize: 12, color: '#888780' }}>Falta</div><div style={{ fontSize: 18, fontWeight: 500, color: falta > 0 ? '#854F0B' : '#3B6D11' }}>{objetivo > 0 ? `${falta} mm` : '—'}</div></div>
              <div><div style={{ fontSize: 12, color: '#888780' }}>Último agua útil</div><div style={{ fontSize: 14 }}>{aguaUtil ? `${aguaUtil.aguaUtilMm}mm (${aguaUtil.fecha})` : 'Sin datos'}</div></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- INSUMOS ---------- */
function Insumos({ data, update }) {
  const [form, setForm] = useState({ nombre: '', unidad: 'kg', stock: '', stockMinimo: '', costoUnitario: '', clienteId: '' });
  const add = () => {
    if (!form.nombre.trim()) return;
    update('insumos', i => [...i, { id: uid(), ...form, stock: Number(form.stock) || 0, stockMinimo: Number(form.stockMinimo) || 0, costoUnitario: Number(form.costoUnitario) || 0, clienteId: form.clienteId || null }]);
    setForm({ nombre: '', unidad: 'kg', stock: '', stockMinimo: '', costoUnitario: '', clienteId: '' });
  };
  const del = (id) => update('insumos', i => i.filter(x => x.id !== id));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Nuevo insumo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Unidad"><input style={inputStyle} value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} /></Field>
          <Field label="Stock"><input style={inputStyle} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></Field>
          <Field label="Stock mínimo"><input style={inputStyle} type="number" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} /></Field>
          <Field label="Costo unitario"><input style={inputStyle} type="number" value={form.costoUnitario} onChange={e => setForm({ ...form, costoUnitario: e.target.value })} /></Field>
        </div>
        <button onClick={add} style={{ ...btnPrimary, marginTop: 12 }}>+ Agregar</button>
      </Card>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Stock</div>
        {data.insumos.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f1efe8', fontSize: 14 }}>
          <span>{i.nombre}</span><span>{i.stock} {i.unidad} · {fmtMoney(precioPromedio(data, i.id))}/{i.unidad} promedio <button onClick={() => del(i.id)} style={btnGhost}>🗑</button></span>
        </div>)}
      </Card>
    </div>
  );
}

/* ---------- PROVEEDORES ---------- */
function Proveedores({ data, update }) {
  const [nombreProv, setNombreProv] = useState('');
  const [formC, setFormC] = useState({ proveedorId: '', insumoId: '', cantidad: '', precioUnitario: '', condicion: '', fecha: '', ubicacion: '', retirado: false, vencimiento: '' });
  const addProveedor = () => { if (!nombreProv.trim()) return; update('proveedores', p => [...p, { id: uid(), nombre: nombreProv.trim(), contacto: '' }]); setNombreProv(''); };
  const guardarCompra = () => {
    if (!formC.proveedorId || !formC.insumoId || !formC.fecha) return;
    const cantidad = Number(formC.cantidad) || 0, precioUnitario = Number(formC.precioUnitario) || 0;
    update('compras', c => [...c, { id: uid(), ...formC, cantidad, precioUnitario, montoTotal: cantidad * precioUnitario }]);
    update('insumos', ins => ins.map(i => i.id === formC.insumoId ? { ...i, stock: (Number(i.stock) || 0) + (formC.retirado ? cantidad : 0), costoUnitario: precioUnitario || i.costoUnitario } : i));
    setFormC({ proveedorId: '', insumoId: '', cantidad: '', precioUnitario: '', condicion: '', fecha: '', ubicacion: '', retirado: false, vencimiento: '' });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Nuevo proveedor</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Nombre" value={nombreProv} onChange={e => setNombreProv(e.target.value)} />
          <button onClick={addProveedor} style={btnPrimary}>+ Agregar</button>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Registrar compra</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <Field label="Proveedor"><select style={inputStyle} value={formC.proveedorId} onChange={e => setFormC({ ...formC, proveedorId: e.target.value })}><option value="">Elegir…</option>{data.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
          <Field label="Insumo"><select style={inputStyle} value={formC.insumoId} onChange={e => setFormC({ ...formC, insumoId: e.target.value })}><option value="">Elegir…</option>{data.insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}</select></Field>
          <Field label="Cantidad"><input style={inputStyle} type="number" value={formC.cantidad} onChange={e => setFormC({ ...formC, cantidad: e.target.value })} /></Field>
          <Field label="Precio unitario"><input style={inputStyle} type="number" value={formC.precioUnitario} onChange={e => setFormC({ ...formC, precioUnitario: e.target.value })} /></Field>
          <Field label="Vencimiento"><input style={inputStyle} type="date" value={formC.vencimiento} onChange={e => setFormC({ ...formC, vencimiento: e.target.value })} /></Field>
          <Field label="Ubicación"><input style={inputStyle} value={formC.ubicacion} onChange={e => setFormC({ ...formC, ubicacion: e.target.value })} /></Field>
          <Field label="Fecha"><input style={inputStyle} type="date" value={formC.fecha} onChange={e => setFormC({ ...formC, fecha: e.target.value })} /></Field>
        </div>
        <label style={{ display: 'flex', gap: 6, fontSize: 13, marginTop: 10 }}><input type="checkbox" checked={formC.retirado} onChange={e => setFormC({ ...formC, retirado: e.target.checked })} />Ya retirado</label>
        <button onClick={guardarCompra} style={{ ...btnPrimary, marginTop: 10 }}>+ Guardar compra</button>
      </Card>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Proveedores</div>
        {data.proveedores.map(p => {
          const comprasProv = data.compras.filter(c => c.proveedorId === p.id);
          return <div key={p.id} style={{ padding: '8px 0', borderTop: '1px solid #f1efe8', fontSize: 13 }}><strong>{p.nombre}</strong> — {comprasProv.length} compra(s)</div>;
        })}
      </Card>
    </div>
  );
}

/* ---------- ACTIVIDADES ---------- */
function Actividades({ data, update }) {
  const [form, setForm] = useState({ loteId: '', tipo: 'Fitosanitario', fecha: '', notas: '', rendimiento: '', mm: '', fuente: '' });
  const [items, setItems] = useState([{ insumoId: '', cantidad: '' }]);
  const guardar = () => {
    if (!form.loteId || !form.fecha) return;
    const usados = items.filter(it => it.insumoId && Number(it.cantidad) > 0);
    let costoTotal = 0;
    usados.forEach(it => { costoTotal += Number(it.cantidad) * precioPromedio(data, it.insumoId); });
    const ciclo = cicloActivo(data, form.loteId);
    update('actividades', a => [...a, { id: uid(), ...form, cicloId: ciclo ? ciclo.id : null, items: usados, costoTotal }]);
    update('insumos', ins => ins.map(i => { const u = usados.find(x => x.insumoId === i.id); return u ? { ...i, stock: (Number(i.stock) || 0) - Number(u.cantidad) } : i; }));
    setForm({ loteId: form.loteId, tipo: 'Fitosanitario', fecha: '', notas: '', rendimiento: '', mm: '', fuente: '' });
    setItems([{ insumoId: '', cantidad: '' }]);
  };
  const lotesConCampo = data.lotes.map(l => ({ ...l, campoNombre: data.campos.find(c => c.id === l.campoId)?.nombre || '' }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Registrar actividad</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <Field label="Lote"><select style={inputStyle} value={form.loteId} onChange={e => setForm({ ...form, loteId: e.target.value })}><option value="">Elegir…</option>{lotesConCampo.map(l => <option key={l.id} value={l.id}>{l.campoNombre} — {l.nombre}</option>)}</select></Field>
          <Field label="Tipo"><select style={inputStyle} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>{TIPOS_ACTIVIDAD.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Fecha"><input style={inputStyle} type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></Field>
          {form.tipo === 'Riego' && <>
            <Field label="mm"><input style={inputStyle} type="number" value={form.mm} onChange={e => setForm({ ...form, mm: e.target.value })} /></Field>
            <Field label="Fuente"><input style={inputStyle} value={form.fuente} onChange={e => setForm({ ...form, fuente: e.target.value })} /></Field>
          </>}
          {form.tipo === 'Cosecha' && <Field label="Rendimiento qq/ha"><input style={inputStyle} type="number" value={form.rendimiento} onChange={e => setForm({ ...form, rendimiento: e.target.value })} /></Field>}
        </div>
        <div style={{ marginTop: 12 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <select style={{ ...inputStyle, flex: 1 }} value={it.insumoId} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, insumoId: e.target.value } : x))}><option value="">Insumo…</option>{data.insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}</select>
              <input style={{ ...inputStyle, width: 100 }} type="number" placeholder="cantidad" value={it.cantidad} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, cantidad: e.target.value } : x))} />
              <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={btnGhost}>✕</button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { insumoId: '', cantidad: '' }])} style={btnSecondary}>+ Insumo</button>
        </div>
        <button onClick={guardar} style={{ ...btnPrimary, marginTop: 14 }}>+ Guardar</button>
      </Card>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Historial</div>
        {[...data.actividades].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 30).map(act => {
          const lote = data.lotes.find(l => l.id === act.loteId);
          return <div key={act.id} style={{ padding: '8px 0', borderTop: '1px solid #f1efe8', fontSize: 14 }}><strong>{act.tipo}</strong> — {lote?.nombre} — {act.fecha} — {fmtMoney(act.costoTotal)}</div>;
        })}
      </Card>
    </div>
  );
}

/* ---------- CLIENTES ---------- */
function Clientes({ data, update }) {
  const [nombre, setNombre] = useState('');
  const add = () => { if (!nombre.trim()) return; update('clientes', c => [...c, { id: uid(), nombre: nombre.trim() }]); setNombre(''); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Nuevo cliente</div>
        <div style={{ display: 'flex', gap: 10 }}><input style={{ ...inputStyle, flex: 1 }} value={nombre} onChange={e => setNombre(e.target.value)} /><button onClick={add} style={btnPrimary}>+ Agregar</button></div>
      </Card>
      {data.clientes.map(cli => {
        const campos = data.campos.filter(c => c.clienteId === cli.id);
        return <Card key={cli.id}><strong>{cli.nombre}</strong><div style={{ fontSize: 13, color: '#5f5e5a', marginTop: 6 }}>{campos.length} campo(s)</div></Card>;
      })}
    </div>
  );
}

/* ---------- USUARIOS ---------- */
function Usuarios({ data }) {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'productor', clienteId: '' });
  const [msg, setMsg] = useState('');

  const cargar = () => fetch('/api/usuarios').then(r => r.json()).then(setUsuarios);
  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    setMsg('');
    const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { const e = await res.json(); setMsg(e.error); return; }
    setForm({ nombre: '', usuario: '', password: '', rol: 'productor', clienteId: '' });
    cargar();
  };
  const borrar = async (id) => { await fetch('/api/usuarios/' + id, { method: 'DELETE' }); cargar(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Nuevo acceso</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Usuario"><input style={inputStyle} value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} /></Field>
          <Field label="Contraseña"><input style={inputStyle} type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Rol"><select style={inputStyle} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}><option value="productor">Productor</option><option value="admin">Admin</option></select></Field>
          {form.rol === 'productor' && <Field label="Cliente"><select style={inputStyle} value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}><option value="">Elegir…</option>{data.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>}
        </div>
        {msg && <div style={{ color: '#A32D2D', fontSize: 13, marginTop: 8 }}>{msg}</div>}
        <button onClick={crear} style={{ ...btnPrimary, marginTop: 12 }}>+ Crear acceso</button>
      </Card>
      <Card>
        <div style={{ fontWeight: 500, marginBottom: 10 }}>Accesos existentes</div>
        {usuarios.map(u => <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f1efe8', fontSize: 14 }}>
          <span>{u.nombre} ({u.usuario}) — {u.rol}</span><button onClick={() => borrar(u.id)} style={btnGhost}>🗑</button>
        </div>)}
      </Card>
    </div>
  );
}

/* ---------- CONSULTAS ---------- */
function Consultas({ data, update }) {
  const [respuestas, setRespuestas] = useState({});
  const responder = async (id) => {
    const respuesta = respuestas[id];
    if (!respuesta) return;
    await fetch('/api/consultas/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ respuesta }) });
    update('consultas', c => c.map(x => x.id === id ? { ...x, respuesta, respondida: true } : x));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.consultas.length === 0 && <Card><div style={{ color: '#888780', fontSize: 13 }}>Sin consultas todavía.</div></Card>}
      {[...data.consultas].reverse().map(c => {
        const cliente = data.clientes.find(cl => cl.id === c.clienteId);
        return <Card key={c.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{cliente?.nombre || 'Productor'}</strong><span style={{ fontSize: 12, color: '#888780' }}>{c.fecha}</span></div>
          <div style={{ margin: '8px 0', fontSize: 14 }}>{c.texto}</div>
          {c.respondida ? <div style={{ background: '#EAF3DE', padding: 8, borderRadius: 6, fontSize: 13 }}>{c.respuesta}</div> : <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Tu respuesta…" value={respuestas[c.id] || ''} onChange={e => setRespuestas({ ...respuestas, [c.id]: e.target.value })} />
            <button onClick={() => responder(c.id)} style={btnPrimary}>Responder</button>
          </div>}
        </Card>;
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
