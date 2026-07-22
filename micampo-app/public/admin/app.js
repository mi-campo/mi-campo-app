const {
  useState,
  useEffect,
  useMemo
} = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const TIPOS_ACTIVIDAD = ['Siembra', 'Fertilización', 'Pulverización', 'Riego', 'Cosecha'];
const METODOS_POR_TIPO = {
  Siembra: ['Sembradora', 'Drone'],
  Fertilización: ['Voleo', 'Drone', 'Con siembra'],
  Pulverización: ['Terrestre', 'Drone']
};
const TIPOS_CON_APLICACION = Object.keys(METODOS_POR_TIPO);
const CATEGORIAS_INSUMO = ['Insecticida', 'Herbicida', 'Fungicida', 'Fertilizante', 'Semilla', 'Cebo', 'Otro'];
const CULTIVOS_SIEMBRA = ['Soja', 'Trigo', 'Garbanzo', 'Maíz'];
const TIPOS_BOT = [['riego', 'Riego'], ['siembra', 'Siembra'], ['fertilizacion', 'Fertilización'], ['pulverizacion', 'Pulverización'], ['cosecha', 'Cosecha'], ['compra', 'Compra de insumo'], ['analisis_agua', 'Análisis de agua'], ['analisis_suelo', 'Análisis de suelo'], ['nota', 'Nota'], ['consulta', 'Consultas / preguntas']];
const inputStyle = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #d3d1c7',
  fontSize: 14,
  fontFamily: 'inherit'
};
const btnPrimary = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: '#3B6D11',
  color: '#EAF3DE',
  border: 'none',
  padding: '9px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500
};
const btnSecondary = {
  background: '#F1EFE8',
  color: '#444441',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13
};
const btnGhost = {
  background: 'transparent',
  border: 'none',
  color: '#888780',
  cursor: 'pointer',
  padding: 4
};
function fmtMoney(n) {
  return 'USD ' + (n || 0).toLocaleString('es-AR', {
    maximumFractionDigits: 0
  });
}
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
function cicloActivo(data, loteId) {
  return (data.ciclos || []).find(c => c.loteId === loteId && !c.fechaFin) || null;
}
function Card({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid #e3e1d8',
      borderRadius: 12,
      padding: 16,
      ...style
    }
  }, children);
}
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      color: '#5f5e5a'
    }
  }, label), children);
}
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
      fetch('/api/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).finally(() => setSaving(false));
    }, 500);
    return () => clearTimeout(t);
  }, [data]);
  const update = (key, fn) => setData(d => ({
    ...d,
    [key]: fn(d[key])
  }));
  const salir = async () => {
    await fetch('/api/logout', {
      method: 'POST'
    });
    window.location.href = '/login.html';
  };
  if (!data || !me) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      color: '#888780'
    }
  }, "Cargando MI CAMPO…");
  const tabs = [['resumen', 'Resumen'], ['campos', 'Campos y lotes'], ['riego', 'Riego'], ['insumos', 'Insumos'], ['proveedores', 'Proveedores'], ['actividades', 'Actividades'], ['clientes', 'Clientes'], ['usuarios', 'Usuarios'], ['whatsapp', 'WhatsApp'], ['consultas', 'Consultas']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 4px',
      borderBottom: '1px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      background: '#3B6D11',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#EAF3DE',
      fontWeight: 'bold'
    }
  }, "M"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 500
    }
  }, "MI CAMPO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, me.nombre || me.usuario, " · ", saving ? 'Guardando…' : 'Guardado'))), /*#__PURE__*/React.createElement("button", {
    onClick: salir,
    style: {
      ...btnSecondary
    }
  }, "Salir")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: '10px 4px 0',
      flexWrap: 'wrap'
    }
  }, tabs.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setTab(id),
    style: {
      padding: '8px 14px',
      borderRadius: '8px 8px 0 0',
      border: 'none',
      cursor: 'pointer',
      background: tab === id ? '#EAF3DE' : 'transparent',
      color: tab === id ? '#27500A' : '#5f5e5a',
      fontWeight: tab === id ? 500 : 400,
      fontSize: 14
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 4px'
    }
  }, tab === 'resumen' && /*#__PURE__*/React.createElement(Resumen, {
    data: data
  }), tab === 'campos' && /*#__PURE__*/React.createElement(Campos, {
    data: data,
    update: update
  }), tab === 'riego' && /*#__PURE__*/React.createElement(Riego, {
    data: data,
    update: update
  }), tab === 'insumos' && /*#__PURE__*/React.createElement(Insumos, {
    data: data,
    update: update
  }), tab === 'proveedores' && /*#__PURE__*/React.createElement(Proveedores, {
    data: data,
    update: update
  }), tab === 'actividades' && /*#__PURE__*/React.createElement(Actividades, {
    data: data,
    update: update
  }), tab === 'clientes' && /*#__PURE__*/React.createElement(Clientes, {
    data: data,
    update: update
  }), tab === 'usuarios' && /*#__PURE__*/React.createElement(Usuarios, {
    data: data
  }), tab === 'whatsapp' && /*#__PURE__*/React.createElement(ContactosWA, {
    data: data,
    update: update
  }), tab === 'consultas' && /*#__PURE__*/React.createElement(Consultas, {
    data: data,
    update: update
  })));
}

/* ---------- RESUMEN ---------- */
function Resumen({
  data
}) {
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
      gastoPorCampo[nombre] = gastoPorCampo[nombre] || {
        gasto: 0,
        ha: 0,
        presupuesto: 0
      };
      gastoPorCampo[nombre].gasto += a.costoTotal || 0;
    });
    data.campos.forEach(c => {
      const ha = data.lotes.filter(l => l.campoId === c.id).reduce((s, l) => s + (Number(l.hectareas) || 0), 0);
      if (!gastoPorCampo[c.nombre]) gastoPorCampo[c.nombre] = {
        gasto: 0,
        ha: 0,
        presupuesto: 0
      };
      gastoPorCampo[c.nombre].ha = ha;
      gastoPorCampo[c.nombre].presupuesto = Number(c.presupuesto) || 0;
    });
    const camposPasados = data.campos.filter(c => (gastoPorCampo[c.nombre]?.gasto || 0) > Number(c.presupuesto) && Number(c.presupuesto) > 0);
    const consultasPendientes = data.consultas.filter(c => !c.respondida).length;
    return {
      haTotal,
      gastoTotal,
      stockBajo,
      gastoPorCampo,
      camposPasados,
      consultasPendientes
    };
  }, [data]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Campos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500
    }
  }, data.campos.length)), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Hectáreas totales"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500
    }
  }, stats.haTotal.toLocaleString('es-AR'))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Gasto acumulado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500
    }
  }, fmtMoney(stats.gastoTotal))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Consultas pendientes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      color: stats.consultasPendientes > 0 ? '#854F0B' : undefined
    }
  }, stats.consultasPendientes))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "Presupuesto"), stats.camposPasados.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Ningún campo se pasó del presupuesto."), stats.camposPasados.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      fontSize: 13,
      color: '#A32D2D',
      padding: '4px 0'
    }
  }, c.nombre, ": ", fmtMoney(stats.gastoPorCampo[c.nombre]?.gasto), " de ", fmtMoney(c.presupuesto)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "Stock crítico"), stats.stockBajo.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Todo dentro del mínimo."), stats.stockBajo.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    style: {
      fontSize: 13,
      color: '#A32D2D',
      padding: '4px 0'
    }
  }, i.nombre, ": quedan ", i.stock, " ", i.unidad))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "Actividad reciente"), data.actividades.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Sin actividades todavía."), [...data.actividades].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 5).map(act => {
    const lote = data.lotes.find(l => l.id === act.loteId);
    const campo = data.campos.find(c => c.id === lote?.campoId);
    return /*#__PURE__*/React.createElement("div", {
      key: act.id,
      style: {
        fontSize: 13,
        padding: '4px 0'
      }
    }, /*#__PURE__*/React.createElement("strong", null, act.tipo), " — ", campo?.nombre, "/", lote?.nombre, " — ", act.fecha);
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Gasto por campo"), Object.entries(stats.gastoPorCampo).map(([nombre, v]) => {
    const pasado = v.presupuesto > 0 && v.gasto > v.presupuesto;
    return /*#__PURE__*/React.createElement("div", {
      key: nombre,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #f1efe8',
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("span", null, nombre), /*#__PURE__*/React.createElement("span", {
      style: {
        color: pasado ? '#A32D2D' : '#5f5e5a'
      }
    }, fmtMoney(v.gasto), v.presupuesto > 0 ? ` / ${fmtMoney(v.presupuesto)}` : '', v.ha > 0 ? ` · ${(v.gasto / v.ha).toFixed(1)} USD/ha` : ''));
  })));
}

/* ---------- CAMPOS Y LOTES ---------- */
const TIPOS_APORTE = ['Insumos', 'Servicios/Labores', 'Alquiler', 'Riego/Infraestructura', 'Extraordinario', 'Otro'];
function AportesParticipante({
  campo,
  participante,
  update
}) {
  const categorias = participante.categoriasAporte || [];
  const todoTildado = categorias.includes('Todo');
  const toggle = cat => {
    let nuevas;
    if (cat === 'Todo') {
      nuevas = todoTildado ? [] : ['Todo', ...TIPOS_APORTE];
    } else {
      nuevas = categorias.includes(cat) ? categorias.filter(c => c !== cat && c !== 'Todo') : [...categorias.filter(c => c !== 'Todo'), cat];
      if (TIPOS_APORTE.every(t => nuevas.includes(t))) nuevas = ['Todo', ...TIPOS_APORTE];
    }
    update('campos', cs => cs.map(c => c.id !== campo.id ? c : {
      ...c,
      participantes: c.participantes.map(p => p.id !== participante.id ? p : {
        ...p,
        categoriasAporte: nuevas
      })
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      marginLeft: 12,
      paddingLeft: 10,
      borderLeft: '2px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 4
    }
  }, "Qué aporta:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 12,
      background: todoTildado ? '#EAF3DE' : '#f4f2ea',
      padding: '3px 8px',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: todoTildado,
    onChange: () => toggle('Todo')
  }), "Todo"), TIPOS_APORTE.map(cat => /*#__PURE__*/React.createElement("label", {
    key: cat,
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 12,
      background: categorias.includes(cat) ? '#EAF3DE' : '#f4f2ea',
      padding: '3px 8px',
      borderRadius: 6,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: categorias.includes(cat),
    onChange: () => toggle(cat)
  }), cat))));
}
function ParticipacionCampo({
  campo,
  data,
  update
}) {
  const participantes = campo.participantes || [];
  const [nuevo, setNuevo] = useState({
    clienteId: '',
    porcentaje: ''
  });
  const agregar = () => {
    if (!nuevo.clienteId) return;
    update('campos', cs => cs.map(c => c.id === campo.id ? {
      ...c,
      participantes: [...(c.participantes || []), {
        id: uid(),
        clienteId: nuevo.clienteId,
        porcentaje: nuevo.porcentaje ? Number(nuevo.porcentaje) : null,
        categoriasAporte: []
      }]
    } : c));
    setNuevo({
      clienteId: '',
      porcentaje: ''
    });
  };
  const quitar = pid => update('campos', cs => cs.map(c => c.id === campo.id ? {
    ...c,
    participantes: (c.participantes || []).filter(p => p.id !== pid)
  } : c));
  const editarCampo = (pid, campoObj) => update('campos', cs => cs.map(c => c.id === campo.id ? {
    ...c,
    participantes: (c.participantes || []).map(p => p.id === pid ? {
      ...p,
      ...campoObj
    } : p)
  } : c));
  const sumaPorcentajes = participantes.reduce((s, p) => s + (Number(p.porcentaje) || 0), 0);

  // Compatibilidad: si el campo todavia usa el modelo viejo (un solo cliente) y no tiene participantes cargados, se muestra como referencia
  const clienteViejo = !participantes.length && campo.clienteId ? data.clientes.find(c => c.id === campo.clienteId) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '8px 0',
      padding: '8px 10px',
      background: '#faf9f5',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 6
    }
  }, "Participación / propietarios"), clienteViejo && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#993C1D',
      marginBottom: 6
    }
  }, "Cliente (modelo simple): ", clienteViejo.nombre, " (", campo.porcentajeProductor || 0, "%) — agregá participantes abajo para pasar al modelo detallado."), participantes.map(p => {
    const cliente = data.clientes.find(c => c.id === p.clienteId);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: '1px solid #e3e1d8'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        minWidth: 100
      }
    }, cliente?.nombre || '?'), /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 70,
        padding: '3px 6px',
        fontSize: 12
      },
      type: "number",
      placeholder: "%",
      value: p.porcentaje ?? '',
      onChange: e => editarCampo(p.id, {
        porcentaje: e.target.value ? Number(e.target.value) : null
      })
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#888780'
      }
    }, "% de la división final"), /*#__PURE__*/React.createElement("button", {
      onClick: () => quitar(p.id),
      style: {
        ...btnGhost,
        marginLeft: 'auto'
      }
    }, "✕ Quitar participante")), /*#__PURE__*/React.createElement(AportesParticipante, {
      campo: campo,
      participante: p,
      update: update
    }));
  }), participantes.length > 0 && sumaPorcentajes !== 100 && sumaPorcentajes > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#854F0B'
    }
  }, "⚠️ Los porcentajes suman ", sumaPorcentajes, "%, no 100%."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginTop: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      padding: '3px 6px',
      fontSize: 12
    },
    value: nuevo.clienteId,
    onChange: e => setNuevo({
      ...nuevo,
      clienteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "+ Agregar participante…"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre))), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 70,
      padding: '3px 6px',
      fontSize: 12
    },
    type: "number",
    placeholder: "%",
    value: nuevo.porcentaje,
    onChange: e => setNuevo({
      ...nuevo,
      porcentaje: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    onClick: agregar,
    style: {
      ...btnSecondary,
      fontSize: 12,
      padding: '4px 10px'
    }
  }, "Agregar")), participantes.length > 0 && /*#__PURE__*/React.createElement(ResumenGastosCampo, {
    campo: campo,
    participantes: participantes,
    data: data
  }));
}
function ResumenGastosCampo({
  campo,
  participantes,
  data
}) {
  const lotesCampo = data.lotes.filter(l => l.campoId === campo.id);
  const actividadesCampo = data.actividades.filter(a => lotesCampo.some(l => l.id === a.loteId));
  const gastoCompartido = actividadesCampo.filter(a => !a.paraClienteId).reduce((s, a) => s + (a.costoTotal || 0), 0);
  const filas = participantes.map(p => {
    const cliente = data.clientes.find(c => c.id === p.clienteId);
    const gastoDirecto = actividadesCampo.filter(a => a.paraClienteId === p.clienteId).reduce((s, a) => s + (a.costoTotal || 0), 0);
    const porcentaje = Number(p.porcentaje) || 0;
    const parteCompartido = gastoCompartido * (porcentaje / 100);
    const totalACargo = gastoDirecto + parteCompartido;
    return {
      nombre: cliente?.nombre || '?',
      gastoDirecto,
      parteCompartido,
      totalACargo
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 6
    }
  }, "Resumen (calculado con las actividades cargadas)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 8
    }
  }, "Gasto compartido total (actividades sin asignar a nadie en particular): ", fmtMoney(gastoCompartido)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto repeat(3, 1fr)',
      gap: '4px 10px',
      fontSize: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780'
    }
  }, "Gasto directo"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780'
    }
  }, "+ Parte compartido (según %)"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780'
    }
  }, "= Total a cargo"), filas.map((f, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, f.nombre), /*#__PURE__*/React.createElement("div", null, fmtMoney(f.gastoDirecto)), /*#__PURE__*/React.createElement("div", null, fmtMoney(f.parteCompartido)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, fmtMoney(f.totalACargo))))));
}
function Campos({
  data,
  update
}) {
  const [nuevoCampo, setNuevoCampo] = useState('');
  const [clienteCampo, setClienteCampo] = useState('');
  const [presupuestoCampo, setPresupuestoCampo] = useState('');
  const [porcentajeCampo, setPorcentajeCampo] = useState('');
  const [nuevoLote, setNuevoLote] = useState({});
  const [loteAbierto, setLoteAbierto] = useState(null);
  const addCampo = () => {
    if (!nuevoCampo.trim()) return;
    update('campos', c => [...c, {
      id: uid(),
      nombre: nuevoCampo.trim(),
      clienteId: clienteCampo || null,
      presupuesto: Number(presupuestoCampo) || 0,
      porcentajeProductor: Number(porcentajeCampo) || 0
    }]);
    setNuevoCampo('');
    setClienteCampo('');
    setPresupuestoCampo('');
    setPorcentajeCampo('');
  };
  const delCampo = id => {
    update('campos', c => c.filter(x => x.id !== id));
    update('lotes', l => l.filter(x => x.campoId !== id));
  };
  const addLote = campoId => {
    const f = nuevoLote[campoId];
    if (!f || !f.nombre) return;
    update('lotes', l => [...l, {
      id: uid(),
      campoId,
      nombre: f.nombre,
      hectareas: f.hectareas || 0,
      modo: f.modo || 'Riego',
      objetivoRiego: 0
    }]);
    setNuevoLote(p => ({
      ...p,
      [campoId]: {
        nombre: '',
        hectareas: '',
        modo: 'Riego'
      }
    }));
  };
  const delLote = id => update('lotes', l => l.filter(x => x.id !== id));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo campo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      flex: 1,
      minWidth: 140
    },
    placeholder: "Nombre del campo",
    value: nuevoCampo,
    onChange: e => setNuevoCampo(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: clienteCampo,
    onChange: e => setClienteCampo(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Propio"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre))), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 150
    },
    type: "number",
    placeholder: "Presupuesto USD",
    value: presupuestoCampo,
    onChange: e => setPresupuestoCampo(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 110
    },
    type: "number",
    placeholder: "% productor",
    value: porcentajeCampo,
    onChange: e => setPorcentajeCampo(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addCampo,
    style: btnPrimary
  }, "+ Agregar"))), data.campos.map(campo => {
    const lotes = data.lotes.filter(l => l.campoId === campo.id);
    const cliente = data.clientes.find(c => c.id === campo.clienteId);
    const f = nuevoLote[campo.id] || {
      nombre: '',
      hectareas: '',
      modo: 'Riego'
    };
    const haTotalCampo = lotes.reduce((s, l) => s + (Number(l.hectareas) || 0), 0);
    const gastoTotalCampo = data.actividades.filter(a => lotes.some(l => l.id === a.loteId)).reduce((s, a) => s + (a.costoTotal || 0), 0);
    return /*#__PURE__*/React.createElement(Card, {
      key: campo.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        fontWeight: 500,
        fontSize: 15,
        border: 'none',
        background: 'transparent',
        padding: '2px 4px',
        width: 200
      },
      value: campo.nombre,
      onChange: e => update('campos', cs => cs.map(c => c.id === campo.id ? {
        ...c,
        nombre: e.target.value
      } : c))
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888780',
        marginLeft: 8
      }
    }, haTotalCampo, " ha · ", lotes.length, " lote(s)", gastoTotalCampo > 0 ? ` · Gasto: ${fmtMoney(gastoTotalCampo)}` : '')), /*#__PURE__*/React.createElement("button", {
      onClick: () => delCampo(campo.id),
      style: btnGhost
    }, "🗑")), /*#__PURE__*/React.createElement(ParticipacionCampo, {
      campo: campo,
      data: data,
      update: update
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, lotes.map(l => {
      const actsLote = data.actividades.filter(a => a.loteId === l.id);
      const gastoLote = actsLote.reduce((s, a) => s + (a.costoTotal || 0), 0);
      const ultima = [...actsLote].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
      const mmAcumulados = actsLote.filter(a => a.tipo === 'Riego' && a.mm).reduce((s, a) => s + Number(a.mm), 0);
      return /*#__PURE__*/React.createElement("div", {
        key: l.id,
        style: {
          padding: '6px 0',
          borderTop: '1px solid #f1efe8'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 14,
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("input", {
        style: {
          ...inputStyle,
          width: 130,
          padding: '3px 6px'
        },
        value: l.nombre,
        onChange: e => update('lotes', ls => ls.map(x => x.id === l.id ? {
          ...x,
          nombre: e.target.value
        } : x))
      }), /*#__PURE__*/React.createElement("input", {
        style: {
          ...inputStyle,
          width: 70,
          padding: '3px 6px'
        },
        type: "number",
        value: l.hectareas,
        onChange: e => update('lotes', ls => ls.map(x => x.id === l.id ? {
          ...x,
          hectareas: Number(e.target.value) || 0
        } : x))
      }), " ha", /*#__PURE__*/React.createElement("select", {
        style: {
          ...inputStyle,
          padding: '3px 6px'
        },
        value: l.modo || 'Riego',
        onChange: e => update('lotes', ls => ls.map(x => x.id === l.id ? {
          ...x,
          modo: e.target.value
        } : x))
      }, /*#__PURE__*/React.createElement("option", null, "Riego"), /*#__PURE__*/React.createElement("option", null, "Secano"))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setLoteAbierto(loteAbierto === l.id ? null : l.id),
        style: {
          ...btnSecondary,
          padding: '4px 10px'
        }
      }, loteAbierto === l.id ? 'Cerrar' : 'Análisis'), /*#__PURE__*/React.createElement("button", {
        onClick: () => delLote(l.id),
        style: btnGhost
      }, "✕"))), actsLote.length > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: '#888780',
          marginTop: 2
        }
      }, "Gasto: ", fmtMoney(gastoLote), l.hectareas > 0 ? ` (${(gastoLote / l.hectareas).toFixed(1)} USD/ha)` : '', ultima ? ` · Última: ${ultima.tipo} ${ultima.fecha}` : '', mmAcumulados > 0 ? ` · Riego: ${mmAcumulados}mm` : ''), loteAbierto === l.id && /*#__PURE__*/React.createElement(LoteDetalle, {
        lote: l,
        data: data,
        update: update
      }));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        flex: 1
      },
      placeholder: "Nombre de lote",
      value: f.nombre,
      onChange: e => setNuevoLote(p => ({
        ...p,
        [campo.id]: {
          ...f,
          nombre: e.target.value
        }
      }))
    }), /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 90
      },
      placeholder: "ha",
      type: "number",
      value: f.hectareas,
      onChange: e => setNuevoLote(p => ({
        ...p,
        [campo.id]: {
          ...f,
          hectareas: e.target.value
        }
      }))
    }), /*#__PURE__*/React.createElement("select", {
      style: inputStyle,
      value: f.modo,
      onChange: e => setNuevoLote(p => ({
        ...p,
        [campo.id]: {
          ...f,
          modo: e.target.value
        }
      }))
    }, /*#__PURE__*/React.createElement("option", null, "Riego"), /*#__PURE__*/React.createElement("option", null, "Secano")), /*#__PURE__*/React.createElement("button", {
      onClick: () => addLote(campo.id),
      style: btnSecondary
    }, "+ Lote"))));
  }));
}

/* ---------- CICLOS DE CULTIVO ---------- */
function Ciclos({
  lote,
  data,
  update
}) {
  const [form, setForm] = useState({
    cultivo: '',
    tipo: 'Invierno',
    campaña: '',
    alquiler: ''
  });
  const ciclos = data.ciclos.filter(c => c.loteId === lote.id).sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  const abierto = ciclos.find(c => !c.fechaFin);
  const hoyStr = () => new Date().toISOString().slice(0, 10);
  const abrirCiclo = () => {
    if (!form.cultivo.trim()) return;
    update('ciclos', cs => {
      // Si había uno abierto, lo cerramos automáticamente al abrir el nuevo
      const cerrados = cs.map(c => c.loteId === lote.id && !c.fechaFin ? {
        ...c,
        fechaFin: hoyStr()
      } : c);
      return [...cerrados, {
        id: uid(),
        loteId: lote.id,
        cultivo: form.cultivo.trim(),
        tipo: form.tipo,
        campaña: form.campaña,
        alquiler: Number(form.alquiler) || 0,
        fechaInicio: hoyStr(),
        fechaFin: null
      }];
    });
    setForm({
      cultivo: '',
      tipo: 'Invierno',
      campaña: '',
      alquiler: ''
    });
  };
  const cerrarCiclo = id => update('ciclos', cs => cs.map(c => c.id === id ? {
    ...c,
    fechaFin: hoyStr()
  } : c));
  const borrarCiclo = id => update('ciclos', cs => cs.filter(c => c.id !== id));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Ciclos de cultivo"), abierto ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      background: '#EAF3DE',
      borderRadius: 8,
      marginBottom: 10,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("strong", null, "En curso:"), " ", abierto.tipo, " — ", abierto.cultivo, " (", abierto.campaña || 's/campaña', ") desde ", abierto.fechaInicio, abierto.alquiler > 0 && /*#__PURE__*/React.createElement("span", null, " · Alquiler asignado: ", fmtMoney(abierto.alquiler)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => cerrarCiclo(abierto.id),
    style: btnSecondary
  }, "Cerrar este ciclo"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Cultivo"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.cultivo,
    onChange: e => setForm({
      ...form,
      cultivo: e.target.value
    }),
    placeholder: "ej. Trigo"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tipo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.tipo,
    onChange: e => setForm({
      ...form,
      tipo: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Invierno"), /*#__PURE__*/React.createElement("option", null, "Verano"))), /*#__PURE__*/React.createElement(Field, {
    label: "Campaña"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.campaña,
    onChange: e => setForm({
      ...form,
      campaña: e.target.value
    }),
    placeholder: "ej. 2026"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Alquiler asignado (USD)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.alquiler,
    onChange: e => setForm({
      ...form,
      alquiler: e.target.value
    }),
    placeholder: "opcional"
  }))), !abierto && /*#__PURE__*/React.createElement("button", {
    onClick: abrirCiclo,
    style: btnPrimary
  }, "+ Abrir nuevo ciclo"), ciclos.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      marginBottom: 4
    }
  }, "Historial"), ciclos.map(c => {
    const actsCiclo = data.actividades.filter(a => a.cicloId === c.id);
    const gastoCiclo = actsCiclo.reduce((s, a) => s + (a.costoTotal || 0), 0) + (Number(c.alquiler) || 0);
    const cargasCiclo = data.cargas.filter(cg => cg.cicloId === c.id);
    const kgTotal = cargasCiclo.reduce((s, cg) => s + Number(cg.kgDestino || cg.kgCampo || 0), 0);
    const rendimiento = lote.hectareas > 0 ? kgTotal / 100 / lote.hectareas : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: {
        fontSize: 12,
        padding: '6px 0',
        borderTop: '1px solid #e3e1d8'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, c.tipo, " — ", c.cultivo, " (", c.campaña || 's/campaña', ") — ", c.fechaInicio, " a ", c.fechaFin || 'en curso'), /*#__PURE__*/React.createElement("button", {
      onClick: () => borrarCiclo(c.id),
      style: btnGhost
    }, "🗑")), /*#__PURE__*/React.createElement("div", {
      style: {
        color: '#888780'
      }
    }, "Gasto total (con alquiler): ", fmtMoney(gastoCiclo), rendimiento > 0 ? ` · Rinde: ${rendimiento.toFixed(1)} qq/ha` : ''));
  })));
}

/* ---------- COSECHA (dentro del detalle de lote) ---------- */
function Cosecha({
  lote,
  data,
  update
}) {
  const [form, setForm] = useState({
    fecha: '',
    identificador: '',
    kgCampo: ''
  });
  const [precios, setPrecios] = useState({
    estimado: lote.precioEstimado || '',
    real: lote.precioReal || ''
  });
  const ciclo = cicloActivo(data, lote.id);
  const cargas = data.cargas.filter(c => c.loteId === lote.id && (!ciclo || c.cicloId === ciclo.id)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const gastoLote = data.actividades.filter(a => a.loteId === lote.id && (!ciclo || a.cicloId === ciclo.id)).reduce((s, a) => s + (a.costoTotal || 0), 0);
  const agregarCarga = () => {
    if (!form.fecha || !form.identificador || !form.kgCampo) return;
    const ciclo = cicloActivo(data, lote.id);
    update('cargas', c => [...c, {
      id: uid(),
      loteId: lote.id,
      cicloId: ciclo ? ciclo.id : null,
      fecha: form.fecha,
      identificador: form.identificador,
      kgCampo: Number(form.kgCampo),
      kgDestino: ''
    }]);
    setForm({
      fecha: form.fecha,
      identificador: '',
      kgCampo: ''
    });
  };
  const setKgDestino = (id, val) => update('cargas', c => c.map(x => x.id === id ? {
    ...x,
    kgDestino: val
  } : x));
  const delCarga = id => update('cargas', c => c.filter(x => x.id !== id));
  const guardarPrecios = () => update('lotes', ls => ls.map(l => l.id === lote.id ? {
    ...l,
    precioEstimado: Number(precios.estimado) || 0,
    precioReal: Number(precios.real) || 0
  } : l));
  const totales = useMemo(() => {
    let totalConfirmado = 0,
      diferencia = 0,
      pendientes = 0;
    cargas.forEach(c => {
      if (c.kgDestino !== '' && c.kgDestino != null) {
        totalConfirmado += Number(c.kgDestino);
        diferencia += Number(c.kgDestino) - Number(c.kgCampo);
      } else {
        totalConfirmado += Number(c.kgCampo) || 0;
        pendientes++;
      }
    });
    const rendimiento = lote.hectareas > 0 ? totalConfirmado / 100 / lote.hectareas : 0;
    const precio = Number(lote.precioReal) > 0 ? Number(lote.precioReal) : Number(lote.precioEstimado) || 0;
    const ingreso = totalConfirmado / 100 * precio;
    const margen = ingreso - gastoLote;
    return {
      totalConfirmado,
      diferencia,
      pendientes,
      rendimiento,
      precio,
      ingreso,
      margen
    };
  }, [cargas, lote, gastoLote]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Cosecha — cargas y reconciliación ", ciclo ? `(ciclo: ${ciclo.tipo} ${ciclo.cultivo})` : ''), !ciclo && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#854F0B',
      marginBottom: 8
    }
  }, "No hay un ciclo abierto en este lote — abrí uno abajo para que el rendimiento no se mezcle con años anteriores."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: form.fecha,
    onChange: e => setForm({
      ...form,
      fecha: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      flex: 1,
      minWidth: 120
    },
    placeholder: "Patente o Silobolsa",
    value: form.identificador,
    onChange: e => setForm({
      ...form,
      identificador: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 100
    },
    type: "number",
    placeholder: "kg campo",
    value: form.kgCampo,
    onChange: e => setForm({
      ...form,
      kgCampo: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    onClick: agregarCarga,
    style: btnPrimary
  }, "+ Cargar")), cargas.map(c => {
    const tiene = c.kgDestino !== '' && c.kgDestino != null;
    const diff = tiene ? Number(c.kgDestino) - Number(c.kgCampo) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        padding: '4px 0',
        borderTop: '1px solid #e3e1d8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 80
      }
    }, c.fecha), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, c.identificador), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 90
      }
    }, "Campo: ", c.kgCampo, "kg"), /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 90,
        padding: '4px 6px'
      },
      type: "number",
      placeholder: "kg destino",
      value: c.kgDestino,
      onChange: e => setKgDestino(c.id, e.target.value)
    }), tiene && /*#__PURE__*/React.createElement("span", {
      style: {
        color: diff === 0 ? '#3B6D11' : diff < 0 ? '#A32D2D' : '#854F0B',
        width: 90
      }
    }, diff === 0 ? 'OK' : diff < 0 ? `Falta ${Math.abs(diff)}` : `Sobra ${diff}`), /*#__PURE__*/React.createElement("button", {
      onClick: () => delCarga(c.id),
      style: btnGhost
    }, "✕"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: 8,
      margin: '10px 0'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Precio estimado (USD/qq)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: precios.estimado,
    onChange: e => setPrecios({
      ...precios,
      estimado: e.target.value
    }),
    onBlur: guardarPrecios
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Precio real (USD/qq)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: precios.real,
    onChange: e => setPrecios({
      ...precios,
      real: e.target.value
    }),
    onBlur: guardarPrecios
  }))), cargas.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: '#EAF3DE',
      borderRadius: 8,
      fontSize: 13,
      color: '#27500A'
    }
  }, /*#__PURE__*/React.createElement("div", null, "Total confirmado: ", /*#__PURE__*/React.createElement("strong", null, totales.totalConfirmado.toFixed(0), " kg"), " ", totales.pendientes > 0 ? `(${totales.pendientes} esperando balanza)` : ''), /*#__PURE__*/React.createElement("div", null, "Rendimiento: ", /*#__PURE__*/React.createElement("strong", null, totales.rendimiento.toFixed(1), " qq/ha")), totales.precio > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, "Ingreso: ", /*#__PURE__*/React.createElement("strong", null, fmtMoney(totales.ingreso))), /*#__PURE__*/React.createElement("div", null, "Margen: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: totales.margen >= 0 ? '#27500A' : '#A32D2D'
    }
  }, fmtMoney(totales.margen))))));
}

/* ---------- CALCULADORA PERALTA-DISA ---------- */
function CalculoFertilizacion() {
  const [f, setF] = useState({
    rendObj: '',
    rendRelativo: '1',
    nNo3_0_20: '',
    nNo3_20_60: '',
    mo: '',
    nanLab: '',
    arrancador: '0',
    antecesor: '0',
    calibracion: 'original'
  });
  const set = (k, v) => setF({
    ...f,
    [k]: v
  });
  const resultado = useMemo(() => {
    const rendObj = Number(f.rendObj) || 0;
    if (rendObj <= 0) return null;
    const rendObjZona = rendObj * (Number(f.rendRelativo) || 1);
    const requerimiento = 28 / 0.625 * rendObjZona / 1000;
    const nNo3suelo = (Number(f.nNo3_0_20) || 0) * 1.35 * 2 + (Number(f.nNo3_20_60) || 0) * 1.3 * 4;
    const mo = Number(f.mo) || 0;
    const nan = f.nanLab !== '' ? Number(f.nanLab) : 11.017 * mo + 18.43;
    const factorNan = f.calibracion === 'calibrado' ? 3.404 : 3.7;
    const mineralizacion = (factorNan * nan + mo / 100 * 0.58 * 1.3 * 0.2 * 10000 * 0.042 * 1000 / 10) / 2;
    const nFertTotal = Math.max(0, requerimiento - nNo3suelo - (Number(f.arrancador) || 0) - mineralizacion + (Number(f.antecesor) || 0));
    const ureaTotal = nFertTotal / 0.46;
    return {
      nFertTotal,
      ureaTotal,
      requiereSplit: ureaTotal > 235
    };
  }, [f]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Fertilización nitrogenada — Peralta-DISA (solo invierno)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Rend. objetivo (kg/ha)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.rendObj,
    onChange: e => set('rendObj', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Rend. relativo zona"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    step: "0.01",
    value: f.rendRelativo,
    onChange: e => set('rendRelativo', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "N-NO3 0-20cm"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.nNo3_0_20,
    onChange: e => set('nNo3_0_20', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "N-NO3 20-60cm"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.nNo3_20_60,
    onChange: e => set('nNo3_20_60', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "M.O. 0-20cm (%)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.mo,
    onChange: e => set('mo', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Nan laboratorio"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.nanLab,
    onChange: e => set('nanLab', e.target.value),
    placeholder: "opcional"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "N arrancador"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.arrancador,
    onChange: e => set('arrancador', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Crédito antecesor"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.antecesor,
    onChange: e => set('antecesor', e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Calibración"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: f.calibracion,
    onChange: e => set('calibracion', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "original"
  }, "Original"), /*#__PURE__*/React.createElement("option", {
    value: "calibrado"
  }, "−8% calibrado")))), resultado && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 12,
      background: '#EAF3DE',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      color: '#27500A'
    }
  }, resultado.ureaTotal.toFixed(0), " kg urea/ha"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#3B6D11'
    }
  }, resultado.nFertTotal.toFixed(1), " kg N/ha"), resultado.requiereSplit && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#854F0B',
      marginTop: 6
    }
  }, "Supera 235 kg/ha, repartir en 2 aplicaciones.")));
}

/* ---------- DETALLE DE LOTE ---------- */
const TIPOS_ACUERDO = ['Alquiler fijo', 'Servicio + costos + reparto', 'Participación libre', 'Otro'];
function AcuerdosLote({
  lote,
  data,
  update
}) {
  const acuerdos = lote.acuerdos || [];
  const [nuevo, setNuevo] = useState({
    hectareas: '',
    clienteId: '',
    tipo: 'Alquiler fijo',
    valorFijo: '',
    unidadValor: 'qq/ha',
    detalle: ''
  });
  const haConAcuerdo = acuerdos.reduce((s, a) => s + (Number(a.hectareas) || 0), 0);
  const haSinAcuerdo = Math.max(0, (Number(lote.hectareas) || 0) - haConAcuerdo);
  const agregar = () => {
    if (!nuevo.hectareas) return;
    update('lotes', ls => ls.map(l => l.id === lote.id ? {
      ...l,
      acuerdos: [...(l.acuerdos || []), {
        id: uid(),
        ...nuevo,
        hectareas: Number(nuevo.hectareas),
        valorFijo: nuevo.valorFijo ? Number(nuevo.valorFijo) : null
      }]
    } : l));
    setNuevo({
      hectareas: '',
      clienteId: '',
      tipo: 'Alquiler fijo',
      valorFijo: '',
      unidadValor: 'qq/ha',
      detalle: ''
    });
  };
  const quitar = aid => update('lotes', ls => ls.map(l => l.id === lote.id ? {
    ...l,
    acuerdos: (l.acuerdos || []).filter(a => a.id !== aid)
  } : l));
  const editar = (aid, campoObj) => update('lotes', ls => ls.map(l => l.id === lote.id ? {
    ...l,
    acuerdos: (l.acuerdos || []).map(a => a.id === aid ? {
      ...a,
      ...campoObj
    } : a)
  } : l));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Acuerdos dentro del lote"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 8
    }
  }, "Para cuando un mismo lote tiene partes con arreglos distintos (ej: parte alquilada a valor fijo, parte donde vos ponés todo y después cobrás un fijo + costos y se reparte el resto)."), acuerdos.map(a => {
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        padding: '8px 10px',
        background: '#fff',
        borderRadius: 6,
        marginBottom: 6,
        border: '1px solid #e3e1d8'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 6,
        alignItems: 'end'
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Ha"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        padding: '4px 6px'
      },
      type: "number",
      value: a.hectareas,
      onChange: e => editar(a.id, {
        hectareas: Number(e.target.value) || 0
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Con quién"
    }, /*#__PURE__*/React.createElement("select", {
      style: {
        ...inputStyle,
        padding: '4px 6px'
      },
      value: a.clienteId || '',
      onChange: e => editar(a.id, {
        clienteId: e.target.value
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Elegir…"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.nombre)))), /*#__PURE__*/React.createElement(Field, {
      label: "Tipo"
    }, /*#__PURE__*/React.createElement("select", {
      style: {
        ...inputStyle,
        padding: '4px 6px'
      },
      value: a.tipo,
      onChange: e => editar(a.id, {
        tipo: e.target.value
      })
    }, TIPOS_ACUERDO.map(t => /*#__PURE__*/React.createElement("option", {
      key: t
    }, t)))), /*#__PURE__*/React.createElement(Field, {
      label: "Valor fijo"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        padding: '4px 6px'
      },
      type: "number",
      value: a.valorFijo ?? '',
      onChange: e => editar(a.id, {
        valorFijo: e.target.value ? Number(e.target.value) : null
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Unidad"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        padding: '4px 6px'
      },
      placeholder: "qq/ha, USD/ha…",
      value: a.unidadValor || '',
      onChange: e => editar(a.id, {
        unidadValor: e.target.value
      })
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => quitar(a.id),
      style: {
        ...btnGhost,
        height: 32
      }
    }, "✕")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      style: {
        ...inputStyle,
        width: '100%',
        minHeight: 40,
        resize: 'vertical',
        fontSize: 12
      },
      placeholder: "Detalle del acuerdo (reparto, condiciones, etc)",
      value: a.detalle || '',
      onChange: e => editar(a.id, {
        detalle: e.target.value
      })
    })));
  }), haSinAcuerdo > 0 && acuerdos.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#854F0B',
      marginBottom: 8
    }
  }, "⚠️ ", haSinAcuerdo, " ha del lote todavía no tienen un acuerdo asignado."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginTop: 10,
      marginBottom: 4
    }
  }, "Nuevo acuerdo:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Hectáreas"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: nuevo.hectareas,
    onChange: e => setNuevo({
      ...nuevo,
      hectareas: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Con quién"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: nuevo.clienteId,
    onChange: e => setNuevo({
      ...nuevo,
      clienteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre)))), /*#__PURE__*/React.createElement(Field, {
    label: "Tipo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: nuevo.tipo,
    onChange: e => setNuevo({
      ...nuevo,
      tipo: e.target.value
    })
  }, TIPOS_ACUERDO.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "Valor fijo"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: nuevo.valorFijo,
    onChange: e => setNuevo({
      ...nuevo,
      valorFijo: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Unidad"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    placeholder: "qq/ha, USD/ha…",
    value: nuevo.unidadValor,
    onChange: e => setNuevo({
      ...nuevo,
      unidadValor: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Detalle del acuerdo (opcional)"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inputStyle,
      width: '100%',
      minHeight: 50,
      resize: 'vertical'
    },
    placeholder: "Ej: \"el resto de la producción, después del fijo y los costos, se reparte 50/50\"",
    value: nuevo.detalle,
    onChange: e => setNuevo({
      ...nuevo,
      detalle: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: agregar,
    style: {
      ...btnSecondary,
      marginTop: 8
    }
  }, "+ Agregar acuerdo"));
}
function LoteDetalle({
  lote,
  data,
  update
}) {
  const [tipoAnalisis, setTipoAnalisis] = useState('Agua útil');
  const [formA, setFormA] = useState({
    fecha: '',
    aguaUtilMm: '',
    profundidad: '',
    nNo3: '',
    p: '',
    mo: '',
    ph: '',
    notas: ''
  });
  const [formN, setFormN] = useState({
    fecha: '',
    tipo: 'Observación',
    texto: ''
  });
  const analisisLote = data.analisis.filter(a => a.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const notasLote = data.notas.filter(n => n.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const guardarAnalisis = () => {
    if (!formA.fecha) return;
    update('analisis', a => [...a, {
      id: uid(),
      loteId: lote.id,
      tipo: tipoAnalisis,
      ...formA
    }]);
    setFormA({
      fecha: '',
      aguaUtilMm: '',
      profundidad: '',
      nNo3: '',
      p: '',
      mo: '',
      ph: '',
      notas: ''
    });
  };
  const guardarNota = () => {
    if (!formN.fecha || !formN.texto.trim()) return;
    update('notas', n => [...n, {
      id: uid(),
      loteId: lote.id,
      ...formN
    }]);
    setFormN({
      fecha: '',
      tipo: 'Observación',
      texto: ''
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 12,
      background: '#faf9f6',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(AcuerdosLote, {
    lote: lote,
    data: data,
    update: update
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(Ciclos, {
    lote: lote,
    data: data,
    update: update
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(Cosecha, {
    lote: lote,
    data: data,
    update: update
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(CalculoFertilizacion, null), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Nuevo análisis"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: tipoAnalisis,
    onChange: e => setTipoAnalisis(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "Agua útil"), /*#__PURE__*/React.createElement("option", null, "Fertilidad")), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formA.fecha,
    onChange: e => setFormA({
      ...formA,
      fecha: e.target.value
    })
  })), tipoAnalisis === 'Agua útil' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Agua útil (mm)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.aguaUtilMm,
    onChange: e => setFormA({
      ...formA,
      aguaUtilMm: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Profundidad (cm)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.profundidad,
    onChange: e => setFormA({
      ...formA,
      profundidad: e.target.value
    })
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "N-NO3"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.nNo3,
    onChange: e => setFormA({
      ...formA,
      nNo3: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "P"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.p,
    onChange: e => setFormA({
      ...formA,
      p: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "M.O."
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.mo,
    onChange: e => setFormA({
      ...formA,
      mo: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "pH"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formA.ph,
    onChange: e => setFormA({
      ...formA,
      ph: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: guardarAnalisis,
    style: {
      ...btnPrimary,
      marginTop: 8
    }
  }, "+ Guardar análisis"), analisisLote.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      padding: '4px 0',
      borderTop: '1px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("strong", null, a.tipo), " — ", a.fecha))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Bitácora"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formN.fecha,
    onChange: e => setFormN({
      ...formN,
      fecha: e.target.value
    })
  }), /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formN.tipo,
    onChange: e => setFormN({
      ...formN,
      tipo: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Observación"), /*#__PURE__*/React.createElement("option", null, "Acierto"), /*#__PURE__*/React.createElement("option", null, "Error"))), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inputStyle,
      width: '100%',
      minHeight: 50
    },
    placeholder: "Qué pasó…",
    value: formN.texto,
    onChange: e => setFormN({
      ...formN,
      texto: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    onClick: guardarNota,
    style: {
      ...btnPrimary,
      marginTop: 8
    }
  }, "+ Guardar nota"), notasLote.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    style: {
      fontSize: 12,
      padding: '4px 0',
      borderTop: '1px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("strong", null, n.tipo), " — ", n.fecha, " — ", n.texto))));
}

/* ---------- RIEGO ---------- */
function Riego({
  data,
  update
}) {
  const lotesRiego = data.lotes.filter(l => (l.modo || 'Riego') === 'Riego');
  const setObjetivo = (loteId, val) => update('lotes', ls => ls.map(l => l.id === loteId ? {
    ...l,
    objetivoRiego: Number(val) || 0
  } : l));
  const [expandidos, setExpandidos] = useState({});
  const toggle = id => setExpandidos(e => ({
    ...e,
    [id]: !e[id]
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, lotesRiego.map(l => {
    const campo = data.campos.find(c => c.id === l.campoId);
    const riegosLote = data.actividades.filter(a => a.loteId === l.id && a.tipo === 'Riego' && a.mm).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const acumulado = riegosLote.reduce((s, a) => s + Number(a.mm), 0);
    const objetivo = Number(l.objetivoRiego) || 0;
    const falta = Math.max(0, objetivo - acumulado);
    const aguaUtil = data.analisis.filter(a => a.loteId === l.id && a.tipo === 'Agua útil').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
    return /*#__PURE__*/React.createElement(Card, {
      key: l.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, campo?.nombre, " — ", l.nombre), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, l.hectareas, " ha")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Acumulado"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500
      }
    }, acumulado, " mm")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Objetivo"), /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 90
      },
      type: "number",
      value: l.objetivoRiego || '',
      onChange: e => setObjetivo(l.id, e.target.value)
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Falta"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500,
        color: falta > 0 ? '#854F0B' : '#3B6D11'
      }
    }, objetivo > 0 ? `${falta} mm` : '—')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Último agua útil"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14
      }
    }, aguaUtil ? `${aguaUtil.aguaUtilMm}mm (${aguaUtil.fecha})` : 'Sin datos'))), riegosLote.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggle(l.id),
      style: {
        ...btnGhost,
        fontSize: 12
      }
    }, expandidos[l.id] ? '▲ Ocultar detalle' : `▼ Ver ${riegosLote.length} riego(s) individuales`), expandidos[l.id] && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, riegosLote.map(r => /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        fontSize: 13,
        padding: '4px 0',
        borderTop: '1px solid #f1efe8',
        color: '#5f5e5a'
      }
    }, r.fecha, " — ", r.mm, "mm", r.fuente ? ` (${r.fuente})` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780',
        marginTop: 4
      }
    }, "Para editar o borrar un registro, andá a la pestaña Actividades y filtrá por este lote."))));
  }));
}

/* ---------- INSUMOS ---------- */
function Insumos({
  data,
  update
}) {
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Herbicida',
    especificar: '',
    unidad: 'kg',
    stock: '',
    stockMinimo: '',
    costoUnitario: '',
    clienteId: ''
  });
  const add = () => {
    if (!form.nombre.trim()) return;
    update('insumos', i => [...i, {
      id: uid(),
      ...form,
      stock: Number(form.stock) || 0,
      stockMinimo: Number(form.stockMinimo) || 0,
      costoUnitario: Number(form.costoUnitario) || 0,
      clienteId: form.clienteId || null
    }]);
    setForm({
      nombre: '',
      categoria: form.categoria,
      especificar: '',
      unidad: 'kg',
      stock: '',
      stockMinimo: '',
      costoUnitario: '',
      clienteId: ''
    });
  };
  const del = id => update('insumos', i => i.filter(x => x.id !== id));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo insumo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nombre"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.nombre,
    onChange: e => setForm({
      ...form,
      nombre: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Categoría"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.categoria,
    onChange: e => setForm({
      ...form,
      categoria: e.target.value
    })
  }, CATEGORIAS_INSUMO.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), form.categoria === 'Otro' && /*#__PURE__*/React.createElement(Field, {
    label: "Especificar"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.especificar,
    onChange: e => setForm({
      ...form,
      especificar: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Unidad"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.unidad,
    onChange: e => setForm({
      ...form,
      unidad: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Stock"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.stock,
    onChange: e => setForm({
      ...form,
      stock: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Stock mínimo"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.stockMinimo,
    onChange: e => setForm({
      ...form,
      stockMinimo: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Costo unitario"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.costoUnitario,
    onChange: e => setForm({
      ...form,
      costoUnitario: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: add,
    style: {
      ...btnPrimary,
      marginTop: 12
    }
  }, "+ Agregar")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Stock"), data.insumos.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderTop: '1px solid #f1efe8',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", null, i.nombre, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: '#888780'
    }
  }, "(", i.categoria, i.categoria === 'Otro' && i.especificar ? ': ' + i.especificar : '', ")")), /*#__PURE__*/React.createElement("span", null, i.stock, " ", i.unidad, " · ", fmtMoney(precioPromedio(data, i.id)), "/", i.unidad, " promedio ", /*#__PURE__*/React.createElement("button", {
    onClick: () => del(i.id),
    style: btnGhost
  }, "🗑"))))));
}

/* ---------- PROVEEDORES ---------- */
function Proveedores({
  data,
  update
}) {
  const [nombreProv, setNombreProv] = useState('');
  const [formC, setFormC] = useState({
    proveedorId: '',
    insumoId: '',
    cantidad: '',
    precioUnitario: '',
    condicion: '',
    fecha: '',
    ubicacion: '',
    retirado: false,
    vencimiento: ''
  });
  const addProveedor = () => {
    if (!nombreProv.trim()) return;
    update('proveedores', p => [...p, {
      id: uid(),
      nombre: nombreProv.trim(),
      contacto: ''
    }]);
    setNombreProv('');
  };
  const guardarCompra = () => {
    if (!formC.proveedorId || !formC.insumoId || !formC.fecha) return;
    const cantidad = Number(formC.cantidad) || 0,
      precioUnitario = Number(formC.precioUnitario) || 0;
    update('compras', c => [...c, {
      id: uid(),
      ...formC,
      cantidad,
      precioUnitario,
      montoTotal: cantidad * precioUnitario
    }]);
    update('insumos', ins => ins.map(i => i.id === formC.insumoId ? {
      ...i,
      stock: (Number(i.stock) || 0) + (formC.retirado ? cantidad : 0),
      costoUnitario: precioUnitario || i.costoUnitario
    } : i));
    setFormC({
      proveedorId: '',
      insumoId: '',
      cantidad: '',
      precioUnitario: '',
      condicion: '',
      fecha: '',
      ubicacion: '',
      retirado: false,
      vencimiento: ''
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo proveedor"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      flex: 1
    },
    placeholder: "Nombre",
    value: nombreProv,
    onChange: e => setNombreProv(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addProveedor,
    style: btnPrimary
  }, "+ Agregar"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Registrar compra"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Proveedor"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.proveedorId,
    onChange: e => setFormC({
      ...formC,
      proveedorId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), data.proveedores.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.nombre)))), /*#__PURE__*/React.createElement(Field, {
    label: "Insumo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.insumoId,
    onChange: e => setFormC({
      ...formC,
      insumoId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), data.insumos.map(i => /*#__PURE__*/React.createElement("option", {
    key: i.id,
    value: i.id
  }, i.nombre)))), /*#__PURE__*/React.createElement(Field, {
    label: "Cantidad"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formC.cantidad,
    onChange: e => setFormC({
      ...formC,
      cantidad: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Precio unitario"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formC.precioUnitario,
    onChange: e => setFormC({
      ...formC,
      precioUnitario: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Vencimiento"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formC.vencimiento,
    onChange: e => setFormC({
      ...formC,
      vencimiento: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Ubicación"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: formC.ubicacion,
    onChange: e => setFormC({
      ...formC,
      ubicacion: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Fecha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formC.fecha,
    onChange: e => setFormC({
      ...formC,
      fecha: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 6,
      fontSize: 13,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formC.retirado,
    onChange: e => setFormC({
      ...formC,
      retirado: e.target.checked
    })
  }), "Ya retirado"), /*#__PURE__*/React.createElement("button", {
    onClick: guardarCompra,
    style: {
      ...btnPrimary,
      marginTop: 10
    }
  }, "+ Guardar compra")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Proveedores"), data.proveedores.map(p => {
    const comprasProv = data.compras.filter(c => c.proveedorId === p.id);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        padding: '8px 0',
        borderTop: '1px solid #f1efe8',
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("strong", null, p.nombre), " — ", comprasProv.length, " compra(s)");
  })));
}

/* ---------- ACTIVIDADES ---------- */
function Actividades({
  data,
  update
}) {
  const formInicial = {
    loteId: '',
    tipo: 'Siembra',
    fecha: '',
    notas: '',
    rendimiento: '',
    mm: '',
    fuente: '',
    metodo: '',
    haReales: '',
    haFacturadas: '',
    tarifaContratista: '',
    cultivo: '',
    variedad: '',
    densidad: '',
    paraClienteId: ''
  };
  const [form, setForm] = useState(formInicial);
  const [items, setItems] = useState([{
    insumoId: '',
    cantidad: ''
  }]);
  const [editandoId, setEditandoId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const esAplicacion = TIPOS_CON_APLICACION.includes(form.tipo);
  const revertirStock = act => {
    if (!act.items || act.items.length === 0) return;
    update('insumos', ins => ins.map(i => {
      const u = act.items.find(x => x.insumoId === i.id);
      return u ? {
        ...i,
        stock: (Number(i.stock) || 0) + Number(u.cantidad)
      } : i;
    }));
  };
  const guardar = () => {
    if (!form.loteId || !form.fecha) return;
    const usados = items.filter(it => it.insumoId && Number(it.cantidad) > 0);
    let costoInsumos = 0;
    usados.forEach(it => {
      costoInsumos += Number(it.cantidad) * precioPromedio(data, it.insumoId);
    });
    const haFact = Number(form.haFacturadas) || Number(form.haReales) || 0;
    const costoContratista = esAplicacion && form.tarifaContratista ? Number(form.tarifaContratista) * haFact : 0;
    const costoTotal = costoInsumos + costoContratista;
    if (editandoId) {
      const actVieja = data.actividades.find(a => a.id === editandoId);
      if (actVieja) revertirStock(actVieja);
      update('actividades', a => a.map(x => x.id === editandoId ? {
        ...x,
        ...form,
        items: usados,
        costoInsumos,
        costoContratista,
        costoTotal
      } : x));
      update('insumos', ins => ins.map(i => {
        const u = usados.find(x => x.insumoId === i.id);
        return u ? {
          ...i,
          stock: (Number(i.stock) || 0) - Number(u.cantidad)
        } : i;
      }));
      setEditandoId(null);
    } else {
      const ciclo = cicloActivo(data, form.loteId);
      update('actividades', a => [...a, {
        id: uid(),
        ...form,
        cicloId: ciclo ? ciclo.id : null,
        items: usados,
        costoInsumos,
        costoContratista,
        costoTotal
      }]);
      update('insumos', ins => ins.map(i => {
        const u = usados.find(x => x.insumoId === i.id);
        return u ? {
          ...i,
          stock: (Number(i.stock) || 0) - Number(u.cantidad)
        } : i;
      }));
    }
    setForm({
      ...formInicial,
      loteId: form.loteId,
      tipo: form.tipo
    });
    setItems([{
      insumoId: '',
      cantidad: ''
    }]);
  };
  const editar = act => {
    setEditandoId(act.id);
    setForm({
      ...formInicial,
      ...act
    });
    setItems(act.items && act.items.length > 0 ? act.items.map(it => ({
      insumoId: it.insumoId,
      cantidad: String(it.cantidad)
    })) : [{
      insumoId: '',
      cantidad: ''
    }]);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm(formInicial);
    setItems([{
      insumoId: '',
      cantidad: ''
    }]);
  };
  const borrar = act => {
    if (!confirm(`¿Borrar esta actividad (${act.tipo} — ${act.fecha})? Esto no se puede deshacer.`)) return;
    revertirStock(act);
    update('actividades', a => a.filter(x => x.id !== act.id));
    if (editandoId === act.id) cancelarEdicion();
  };
  const lotesConCampo = data.lotes.map(l => ({
    ...l,
    campoNombre: data.campos.find(c => c.id === l.campoId)?.nombre || ''
  }));
  const loteSeleccionado = data.lotes.find(l => l.id === form.loteId);
  const campoDelLoteSeleccionado = loteSeleccionado ? data.campos.find(c => c.id === loteSeleccionado.campoId) : null;
  const participantesDelLote = (campoDelLoteSeleccionado?.participantes || []).length > 1 ? campoDelLoteSeleccionado.participantes : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, editandoId ? 'Editando actividad' : 'Registrar actividad'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Lote"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.loteId,
    onChange: e => setForm({
      ...form,
      loteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), lotesConCampo.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.campoNombre, " — ", l.nombre)))), /*#__PURE__*/React.createElement(Field, {
    label: "Tipo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.tipo,
    onChange: e => setForm({
      ...form,
      tipo: e.target.value
    })
  }, TIPOS_ACTIVIDAD.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "Fecha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: form.fecha,
    onChange: e => setForm({
      ...form,
      fecha: e.target.value
    })
  })), participantesDelLote.length > 0 && /*#__PURE__*/React.createElement(Field, {
    label: "¿Para quién es este gasto?"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.paraClienteId,
    onChange: e => setForm({
      ...form,
      paraClienteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Todos (compartido)"), participantesDelLote.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.clienteId,
    value: p.clienteId
  }, data.clientes.find(c => c.id === p.clienteId)?.nombre || '?')))), form.tipo === 'Riego' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "mm"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.mm,
    onChange: e => setForm({
      ...form,
      mm: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Fuente"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.fuente,
    onChange: e => setForm({
      ...form,
      fuente: e.target.value
    })
  }))), form.tipo === 'Cosecha' && /*#__PURE__*/React.createElement(Field, {
    label: "Rendimiento qq/ha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.rendimiento,
    onChange: e => setForm({
      ...form,
      rendimiento: e.target.value
    })
  })), form.tipo === 'Siembra' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Cultivo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.cultivo,
    onChange: e => setForm({
      ...form,
      cultivo: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), CULTIVOS_SIEMBRA.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement(Field, {
    label: form.cultivo === 'Maíz' ? 'Híbrido' : 'Variedad'
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.variedad,
    onChange: e => setForm({
      ...form,
      variedad: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Densidad (kg/ha)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.densidad,
    onChange: e => setForm({
      ...form,
      densidad: e.target.value
    })
  }))), esAplicacion && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Método"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.metodo,
    onChange: e => setForm({
      ...form,
      metodo: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), (METODOS_POR_TIPO[form.tipo] || []).map(m => /*#__PURE__*/React.createElement("option", {
    key: m
  }, m)))), /*#__PURE__*/React.createElement(Field, {
    label: "Ha reales (dosis)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.haReales,
    onChange: e => setForm({
      ...form,
      haReales: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Ha facturadas contratista"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    placeholder: "= ha reales si vacío",
    value: form.haFacturadas,
    onChange: e => setForm({
      ...form,
      haFacturadas: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tarifa contratista USD/ha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.tarifaContratista,
    onChange: e => setForm({
      ...form,
      tarifaContratista: e.target.value
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Observaciones"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inputStyle,
      width: '100%',
      minHeight: 50,
      resize: 'vertical'
    },
    value: form.notas,
    onChange: e => setForm({
      ...form,
      notas: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 6
    }
  }, "Insumos aplicados (cantidad total, se divide por las ha reales)"), items.map((it, idx) => {
    const dosis = form.haReales && it.cantidad ? (Number(it.cantidad) / Number(form.haReales)).toFixed(2) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 6,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("select", {
      style: {
        ...inputStyle,
        flex: 1
      },
      value: it.insumoId,
      onChange: e => setItems(items.map((x, i) => i === idx ? {
        ...x,
        insumoId: e.target.value
      } : x))
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Insumo…"), data.insumos.map(i => /*#__PURE__*/React.createElement("option", {
      key: i.id,
      value: i.id
    }, i.nombre))), /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 100
      },
      type: "number",
      placeholder: "cantidad total",
      value: it.cantidad,
      onChange: e => setItems(items.map((x, i) => i === idx ? {
        ...x,
        cantidad: e.target.value
      } : x))
    }), dosis && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888780',
        width: 90
      }
    }, dosis, " /ha"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setItems(items.filter((_, i) => i !== idx)),
      style: btnGhost
    }, "✕"));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setItems([...items, {
      insumoId: '',
      cantidad: ''
    }]),
    style: btnSecondary
  }, "+ Insumo")), /*#__PURE__*/React.createElement("button", {
    onClick: guardar,
    style: {
      ...btnPrimary,
      marginTop: 14
    }
  }, editandoId ? '✓ Guardar cambios' : '+ Guardar'), editandoId && /*#__PURE__*/React.createElement("button", {
    onClick: cancelarEdicion,
    style: {
      ...btnGhost,
      marginTop: 14,
      marginLeft: 8
    }
  }, "Cancelar edición")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, "Historial"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: '5px 8px'
    },
    value: filtroTipo,
    onChange: e => setFiltroTipo(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Todos los tipos"), TIPOS_ACTIVIDAD.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))), /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: '5px 8px'
    },
    value: filtroLote,
    onChange: e => setFiltroLote(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Todos los lotes"), lotesConCampo.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.campoNombre, " — ", l.nombre))))), data.actividades.filter(a => (!filtroTipo || a.tipo === filtroTipo) && (!filtroLote || a.loteId === filtroLote)).length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780',
      fontSize: 13
    }
  }, "Sin actividades que coincidan con el filtro."), [...data.actividades].filter(a => (!filtroTipo || a.tipo === filtroTipo) && (!filtroLote || a.loteId === filtroLote)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 30).map(act => {
    const lote = data.lotes.find(l => l.id === act.loteId);
    const haInfo = act.haReales ? ` · ${act.haReales}ha` + (act.haFacturadas && act.haFacturadas != act.haReales ? ` (${act.haFacturadas}ha facturadas)` : '') : '';
    const siembraInfo = act.tipo === 'Siembra' && act.cultivo ? ` — ${act.cultivo}${act.variedad ? ' ' + act.variedad : ''}${act.densidad ? ` (${act.densidad} kg/ha)` : ''}` : '';
    const riegoInfo = act.tipo === 'Riego' && act.mm ? ` — ${act.mm}mm${act.fuente ? ` (${act.fuente})` : ''}` : '';
    const paraCliente = act.paraClienteId ? data.clientes.find(c => c.id === act.paraClienteId) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: act.id,
      style: {
        padding: '8px 0',
        borderTop: '1px solid #f1efe8',
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, act.tipo), act.metodo ? ` (${act.metodo})` : '', " — ", lote?.nombre, " — ", act.fecha, riegoInfo, haInfo, siembraInfo, " — ", fmtMoney(act.costoTotal), paraCliente && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#993C1D',
        marginLeft: 6
      }
    }, "(", paraCliente.nombre, ")"), act.costoContratista > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Insumos: ", fmtMoney(act.costoInsumos), " + Contratista: ", fmtMoney(act.costoContratista)), act.items && act.items.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, act.items.map(it => data.insumos.find(i => i.id === it.insumoId)?.nombre).filter(Boolean).join(', ')), act.notas && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#5f5e5a',
        fontStyle: 'italic'
      }
    }, act.notas)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => editar(act),
      style: btnGhost
    }, "✏️"), /*#__PURE__*/React.createElement("button", {
      onClick: () => borrar(act),
      style: btnGhost
    }, "🗑"))));
  })));
}

/* ---------- CLIENTES ---------- */
function Clientes({
  data,
  update
}) {
  const [nombre, setNombre] = useState('');
  const add = () => {
    if (!nombre.trim()) return;
    update('clientes', c => [...c, {
      id: uid(),
      nombre: nombre.trim()
    }]);
    setNombre('');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo cliente"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      flex: 1
    },
    value: nombre,
    onChange: e => setNombre(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: add,
    style: btnPrimary
  }, "+ Agregar"))), data.clientes.map(cli => {
    const campos = data.campos.filter(c => c.clienteId === cli.id || (c.participantes || []).some(p => p.clienteId === cli.id));
    return /*#__PURE__*/React.createElement(Card, {
      key: cli.id
    }, /*#__PURE__*/React.createElement("strong", null, cli.nombre), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: '#5f5e5a',
        marginTop: 6
      }
    }, campos.length, " campo(s)"));
  }));
}

/* ---------- USUARIOS ---------- */
function Usuarios({
  data
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    usuario: '',
    password: '',
    rol: 'productor',
    clienteId: ''
  });
  const [msg, setMsg] = useState('');
  const cargar = () => fetch('/api/usuarios').then(r => r.json()).then(setUsuarios);
  useEffect(() => {
    cargar();
  }, []);
  const crear = async () => {
    setMsg('');
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const e = await res.json();
      setMsg(e.error);
      return;
    }
    setForm({
      nombre: '',
      usuario: '',
      password: '',
      rol: 'productor',
      clienteId: ''
    });
    cargar();
  };
  const borrar = async id => {
    await fetch('/api/usuarios/' + id, {
      method: 'DELETE'
    });
    cargar();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo acceso"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nombre"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.nombre,
    onChange: e => setForm({
      ...form,
      nombre: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Usuario"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.usuario,
    onChange: e => setForm({
      ...form,
      usuario: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Contraseña"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "text",
    value: form.password,
    onChange: e => setForm({
      ...form,
      password: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Rol"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.rol,
    onChange: e => setForm({
      ...form,
      rol: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "productor"
  }, "Productor"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Admin"))), form.rol === 'productor' && /*#__PURE__*/React.createElement(Field, {
    label: "Cliente"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.clienteId,
    onChange: e => setForm({
      ...form,
      clienteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre))))), msg && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#A32D2D',
      fontSize: 13,
      marginTop: 8
    }
  }, msg), /*#__PURE__*/React.createElement("button", {
    onClick: crear,
    style: {
      ...btnPrimary,
      marginTop: 12
    }
  }, "+ Crear acceso")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Accesos existentes"), usuarios.map(u => /*#__PURE__*/React.createElement("div", {
    key: u.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderTop: '1px solid #f1efe8',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", null, u.nombre, " (", u.usuario, ") — ", u.rol), /*#__PURE__*/React.createElement("button", {
    onClick: () => borrar(u.id),
    style: btnGhost
  }, "🗑")))));
}

/* ---------- CONSULTAS ---------- */
function Consultas({
  data,
  update
}) {
  const [respuestas, setRespuestas] = useState({});
  const responder = async id => {
    const respuesta = respuestas[id];
    if (!respuesta) return;
    await fetch('/api/consultas/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        respuesta
      })
    });
    update('consultas', c => c.map(x => x.id === id ? {
      ...x,
      respuesta,
      respondida: true
    } : x));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, data.consultas.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780',
      fontSize: 13
    }
  }, "Sin consultas todavía.")), [...data.consultas].reverse().map(c => {
    const cliente = data.clientes.find(cl => cl.id === c.clienteId);
    return /*#__PURE__*/React.createElement(Card, {
      key: c.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("strong", null, cliente?.nombre || 'Productor'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, c.fecha)), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '8px 0',
        fontSize: 14
      }
    }, c.texto), c.respondida ? /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#EAF3DE',
        padding: 8,
        borderRadius: 6,
        fontSize: 13
      }
    }, c.respuesta) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        flex: 1
      },
      placeholder: "Tu respuesta…",
      value: respuestas[c.id] || '',
      onChange: e => setRespuestas({
        ...respuestas,
        [c.id]: e.target.value
      })
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => responder(c.id),
      style: btnPrimary
    }, "Responder")));
  }));
}

/* ---------- WHATSAPP: números autorizados y sus permisos ---------- */
function ContactosWA({
  data,
  update
}) {
  const [form, setForm] = useState({
    nombre: '',
    numero: '',
    tipos: [],
    clienteId: ''
  });
  const contactos = data.contactosBot || [];
  const toggleTipo = t => setForm(f => ({
    ...f,
    tipos: f.tipos.includes(t) ? f.tipos.filter(x => x !== t) : [...f.tipos, t]
  }));
  const add = () => {
    if (!form.nombre.trim() || !form.numero.trim() || form.tipos.length === 0) return;
    update('contactosBot', c => [...c, {
      id: uid(),
      nombre: form.nombre.trim(),
      numero: form.numero.trim(),
      tipos: form.tipos,
      clienteId: form.clienteId || null
    }]);
    setForm({
      nombre: '',
      numero: '',
      tipos: [],
      clienteId: ''
    });
  };
  const del = id => update('contactosBot', c => c.filter(x => x.id !== id));
  const toggleTipoExistente = (id, t) => update('contactosBot', c => c.map(x => x.id === id ? {
    ...x,
    tipos: x.tipos.includes(t) ? x.tipos.filter(y => y !== t) : [...x.tipos, t]
  } : x));
  const setClienteExistente = (id, clienteId) => update('contactosBot', c => c.map(x => x.id === id ? {
    ...x,
    clienteId: clienteId || null
  } : x));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Números autorizados para el bot de WhatsApp"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#993C1D',
      marginBottom: 10
    }
  }, "⚠️ Cualquier número que NO esté en esta lista queda bloqueado — incluido el tuyo. Registrate a vos mismo con todos los tipos si todavía no lo hiciste.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Nuevo contacto"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nombre"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.nombre,
    onChange: e => setForm({
      ...form,
      nombre: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Número (con código país, ej 549351...)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: form.numero,
    onChange: e => setForm({
      ...form,
      numero: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Cliente/productor (opcional)"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.clienteId,
    onChange: e => setForm({
      ...form,
      clienteId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Sin restringir (acceso a todo)"), data.clientes.map(cl => /*#__PURE__*/React.createElement("option", {
    key: cl.id,
    value: cl.id
  }, cl.nombre))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginTop: 4
    }
  }, "Si le asignás un cliente, sus consultas y reportes van a quedar limitados solo a los campos de ese cliente."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 6
    }
  }, "Puede reportar:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, TIPOS_BOT.map(([t, label]) => /*#__PURE__*/React.createElement("label", {
    key: t,
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 13,
      background: form.tipos.includes(t) ? '#EAF3DE' : '#f4f2ea',
      padding: '4px 8px',
      borderRadius: 6,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.tipos.includes(t),
    onChange: () => toggleTipo(t)
  }), label)))), /*#__PURE__*/React.createElement("button", {
    onClick: add,
    style: {
      ...btnPrimary,
      marginTop: 12
    }
  }, "+ Agregar")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Contactos (", contactos.length, ")"), contactos.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888780',
      fontSize: 13
    }
  }, "Sin contactos autorizados todavía — el bot va a rechazar todos los mensajes hasta que agregues al menos uno."), contactos.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      padding: '10px 0',
      borderTop: '1px solid #f1efe8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, c.nombre), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, c.numero)), /*#__PURE__*/React.createElement("button", {
    onClick: () => del(c.id),
    style: btnGhost
  }, "🗑")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '6px 0'
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      fontSize: 12,
      padding: '4px 8px'
    },
    value: c.clienteId || '',
    onChange: e => setClienteExistente(c.id, e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Sin restringir (acceso a todo)"), data.clientes.map(cl => /*#__PURE__*/React.createElement("option", {
    key: cl.id,
    value: cl.id
  }, cl.nombre)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 6
    }
  }, TIPOS_BOT.map(([t, label]) => /*#__PURE__*/React.createElement("label", {
    key: t,
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 12,
      background: c.tipos.includes(t) ? '#EAF3DE' : '#f4f2ea',
      padding: '3px 7px',
      borderRadius: 5,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: c.tipos.includes(t),
    onChange: () => toggleTipoExistente(c.id, t)
  }), label)))))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
