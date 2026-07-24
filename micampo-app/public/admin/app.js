const {
  useState,
  useEffect,
  useMemo
} = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const TIPOS_ACTIVIDAD = ['Siembra', 'Fertilización', 'Pulverización', 'Riego', 'Cosecha', 'Aporte'];
const METODOS_POR_TIPO = {
  Siembra: ['Sembradora', 'Drone'],
  Fertilización: ['Voleo', 'Drone', 'Con siembra'],
  Pulverización: ['Terrestre', 'Drone', 'Aéreo (avión)'],
  Cosecha: ['Propia', 'Contratada']
};
const TIPOS_CON_APLICACION = [...Object.keys(METODOS_POR_TIPO), 'Cosecha'];
function laborKey(tipo, metodo) {
  if (tipo === 'Cosecha') return 'Cosecha';
  if (tipo === 'Siembra') {
    if (metodo === 'Drone') return 'Siembra con drone';
    return 'Siembra';
  }
  if (tipo === 'Fertilización') {
    if (metodo === 'Voleo') return 'Fertilización voleo';
    if (metodo === 'Drone') return 'Fertilización drone';
    if (metodo === 'Con siembra') return 'Siembra con fertilización';
    return null;
  }
  if (tipo === 'Pulverización') {
    if (metodo === 'Terrestre') return 'Pulverización terrestre';
    if (metodo === 'Drone') return 'Pulverización drone';
    if (metodo === 'Aéreo (avión)') return 'Pulverización avión';
    return null;
  }
  return null;
}
const CATEGORIAS_INSUMO = ['Insecticida', 'Herbicida', 'Fungicida', 'Coadyuvante', 'Fertilizante', 'Semilla', 'Cebo', 'Otro'];
const CULTIVOS_SIEMBRA = ['Soja', 'Trigo', 'Garbanzo', 'Maíz'];
const COLOR_CULTIVO = {
  'Soja': {
    texto: '#27500A',
    fondo: '#EAF3DE',
    borde: '#8FBF5E'
  },
  'Trigo': {
    texto: '#8A6D00',
    fondo: '#FFF6D6',
    borde: '#E8C547'
  },
  'Garbanzo': {
    texto: '#6B3E75',
    fondo: '#F2E4F5',
    borde: '#B98FC4'
  },
  'Maíz': {
    texto: '#A3450A',
    fondo: '#FCE9DC',
    borde: '#E28A4C'
  },
  'sin cultivo': {
    texto: '#5f5e5a',
    fondo: '#f1efe8',
    borde: '#c9c6bb'
  }
};
const OBJETIVO_RIEGO_POR_CULTIVO = {
  'Garbanzo': 400,
  'Trigo': 550,
  'Soja': 120,
  'Maíz': 200
};
const TIPOS_BOT = [['riego', 'Riego'], ['precipitacion', 'Lluvia'], ['siembra', 'Siembra'], ['fertilizacion', 'Fertilización'], ['pulverizacion', 'Pulverización'], ['cosecha', 'Cosecha'], ['compra', 'Compra de insumo'], ['aporte_insumo', 'Aporte de insumo'], ['analisis_agua', 'Análisis de agua'], ['analisis_suelo', 'Análisis de suelo'], ['analisis_foto', 'Análisis por foto/PDF'], ['nota', 'Nota'], ['consulta', 'Consultas / preguntas']];
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
function proximoCultivoBarbecho(data, loteId) {
  const cerrados = (data.ciclos || []).filter(c => c.loteId === loteId && c.fechaFin).sort((a, b) => (b.fechaFin || '').localeCompare(a.fechaFin || ''));
  const ultimo = cerrados[0];
  const anterior = cerrados[1];
  if (!ultimo) return 'Soja 1ra'; // sin antecedentes, default
  if (ultimo.cultivo === 'Garbanzo') return 'Maíz 2da';
  if (ultimo.cultivo === 'Maíz') return 'Soja 1ra';
  if (ultimo.cultivo === 'Trigo') return 'Soja 2da';
  if (ultimo.cultivo === 'Soja') {
    // La rotación tiene 2 sojas (1ra después del maíz, 2da después del trigo) — hay que mirar el cultivo anterior para saber cuál fue
    if (anterior?.cultivo === 'Trigo') return 'Garbanzo';
    return 'Trigo'; // por defecto asume que la soja que acaba de cerrar fue la de 1ra
  }
  return 'Soja 1ra';
}
function aguaUtilPromedio(data, loteId) {
  const registros = data.analisis.filter(a => a.loteId === loteId && a.tipo === 'Agua útil' && a.aguaUtilMm !== '' && a.aguaUtilMm != null);
  if (registros.length === 0) return null;
  const ultimaFecha = registros.reduce((max, r) => (r.fecha || '') > max ? r.fecha : max, '');
  const delUltimoMuestreo = registros.filter(r => r.fecha === ultimaFecha);
  const promedio = delUltimoMuestreo.reduce((s, r) => s + Number(r.aguaUtilMm), 0) / delUltimoMuestreo.length;
  return {
    promedio: Math.round(promedio * 10) / 10,
    fecha: ultimaFecha,
    cantidadLecturas: delUltimoMuestreo.length
  };
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
function InputUnidad({
  value,
  onChange,
  unidad,
  placeholder,
  disabled
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: '100%',
      paddingRight: 8 + unidad.length * 6.5,
      background: disabled ? '#f4f2ea' : '#fff',
      color: disabled ? '#888780' : 'inherit'
    },
    type: "number",
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 12,
      color: '#aaa89f',
      pointerEvents: 'none'
    }
  }, unidad));
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
  const tabs = [['resumen', 'Resumen'], ['mercado', 'Mercado'], ['campos', 'Campos y lotes'], ['riego', 'Riego'], ['fertilizacion', 'Fertilización'], ['recetas', 'Recetas'], ['insumos', 'Insumos'], ['proveedores', 'Proveedores'], ['actividades', 'Actividades'], ['tarifario', 'Tarifario'], ['clientes', 'Clientes'], ['usuarios', 'Usuarios'], ['whatsapp', 'WhatsApp'], ['consultas', 'Consultas']];
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
  }), tab === 'mercado' && /*#__PURE__*/React.createElement(Mercado, null), tab === 'campos' && /*#__PURE__*/React.createElement(Campos, {
    data: data,
    update: update
  }), tab === 'riego' && /*#__PURE__*/React.createElement(Riego, {
    data: data,
    update: update
  }), tab === 'fertilizacion' && /*#__PURE__*/React.createElement(Fertilizacion, {
    data: data,
    update: update
  }), tab === 'recetas' && /*#__PURE__*/React.createElement(Recetas, {
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
  }), tab === 'tarifario' && /*#__PURE__*/React.createElement(Tarifario, {
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
const COLOR_TENDENCIA = {
  'Alcista': {
    texto: '#27500A',
    fondo: '#EAF3DE',
    borde: '#8FBF5E'
  },
  'Bajista': {
    texto: '#A32D2D',
    fondo: '#FBE7E4',
    borde: '#E28A8A'
  },
  'Neutral': {
    texto: '#5f5e5a',
    fondo: '#f1efe8',
    borde: '#c9c6bb'
  }
};
function Mercado() {
  const [mercado, setMercado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const cargar = forzar => {
    setCargando(true);
    setError('');
    fetch('/api/mercado' + (forzar ? '?forzar=1' : '')).then(async r => {
      if (r.ok) return r.json();
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error || `Error ${r.status}`);
    }).then(setMercado).catch(err => setError(err.message || 'No se pudo obtener la información de mercado ahora mismo.')).finally(() => setCargando(false));
  };
  useEffect(() => {
    cargar(false);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500
    }
  }, "Panorama de mercado"), mercado?.fechaConsulta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780'
    }
  }, "Actualizado: ", mercado.fechaConsulta)), /*#__PURE__*/React.createElement("button", {
    onClick: () => cargar(true),
    disabled: cargando,
    style: btnSecondary
  }, cargando ? 'Actualizando…' : '↻ Actualizar ahora')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#aaa89f',
      marginTop: 6
    }
  }, "Se actualiza solo cada 6 horas para no golpear de más — usá \"Actualizar ahora\" si necesitás el dato más fresco.")), cargando && !mercado && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Buscando precios y noticias… puede tardar hasta 1 minuto, está buscando en la web en vivo.")), error && !mercado && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#A32D2D'
    }
  }, error)), mercado?.granos && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12
    }
  }, mercado.granos.map((g, i) => {
    const col = COLOR_TENDENCIA[g.tendencia] || COLOR_TENDENCIA.Neutral;
    return /*#__PURE__*/React.createElement(Card, {
      key: i,
      style: {
        borderLeft: `4px solid ${col.borde}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500
      }
    }, g.nombre), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: col.texto,
        background: col.fondo,
        border: `1px solid ${col.borde}`,
        borderRadius: 5,
        padding: '2px 8px'
      }
    }, g.tendencia)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 600,
        marginTop: 6
      }
    }, "USD ", g.precioUSDtn, "/tn"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780'
      }
    }, g.fuente, " · ", g.vsPromedio, " del promedio", g.promedioPropio ? /*#__PURE__*/React.createElement(React.Fragment, null, " (propio, USD ", g.promedioPropio, "/tn — ", g.cantidadLecturas, " lecturas)") : /*#__PURE__*/React.createElement(React.Fragment, null, " (estimado por búsqueda web)")), g.comentario && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: '#5f5e5a',
        marginTop: 8
      }
    }, g.comentario));
  })), mercado?.urea && mercado.granos && (() => {
    const trigo = mercado.granos.find(g => g.nombre === 'Trigo');
    if (!trigo) return null;
    const KG_UREA_POR_TN_TRIGO = 97.4; // 28kgN/tn / 0.625 eficiencia / 0.46 urea — requerimiento BRUTO, antes de descontar suelo
    const costoUreaPorTn = KG_UREA_POR_TN_TRIGO / 1000 * mercado.urea.precioUSDtn;
    const porcentajeCosto = costoUreaPorTn / trigo.precioUSDtn * 100;
    const col = porcentajeCosto < 30 ? COLOR_TENDENCIA.Alcista : porcentajeCosto < 55 ? COLOR_TENDENCIA.Neutral : COLOR_TENDENCIA.Bajista;
    return /*#__PURE__*/React.createElement(Card, {
      style: {
        borderLeft: `4px solid ${col.borde}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        marginBottom: 8
      }
    }, "Costo de la urea en trigo — referencia rápida"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 600,
        color: col.texto
      }
    }, porcentajeCosto.toFixed(0), "%"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780'
      }
    }, "del valor de 1tn de trigo, si se aplicara la demanda total de N sin ningún descuento del suelo (peor caso — la dosis real casi siempre es menor)"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780',
        marginTop: 8
      }
    }, "97,4kg urea/tn (Peralta-DISA, bruto) a USD ", mercado.urea.precioUSDtn, "/tn = USD ", costoUreaPorTn.toFixed(0), " — trigo a USD ", trigo.precioUSDtn, "/tn. Para el costo real de un lote puntual, usá la calculadora de la pestaña Fertilización (esa sí descuenta el suelo)."));
  })(), mercado?.relaciones && mercado.relaciones.length > 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Relación insumo-producto (urea)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 8
    }
  }, "Comparado contra el promedio histórico de cada cultivo (fuente: Coninagro/BCR/fyo)."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12
    }
  }, mercado.relaciones.map((r, i) => {
    const col = r.momento === 'favorable' ? COLOR_TENDENCIA.Alcista : r.momento === 'desfavorable' ? COLOR_TENDENCIA.Bajista : COLOR_TENDENCIA.Neutral;
    const grano = mercado.granos?.find(g => g.nombre === r.cultivo);
    const precioUreaHoy = mercado.urea?.precioUSDtn;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: 10,
        background: col.fondo,
        border: `1px solid ${col.borde}`,
        borderRadius: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, r.cultivo), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: col.texto
      }
    }, r.momento === 'favorable' ? 'Favorable' : r.momento === 'desfavorable' ? 'Desfavorable' : 'Neutro')), precioUreaHoy && r.promedioHistorico && grano ? (() => {
      const precioHistoricoTeorico = r.promedioHistorico * grano.precioUSDtn / 1000;
      const diferencia = precioUreaHoy - precioHistoricoTeorico;
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 20,
          fontWeight: 600,
          color: col.texto,
          marginTop: 4
        }
      }, "USD ", precioUreaHoy, "/tn"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: '#888780'
        }
      }, "precio de la urea hoy — al ratio histórico de ", r.cultivo.toLowerCase(), " \"debería\" costar ~USD ", precioHistoricoTeorico.toFixed(0), "/tn"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: col.texto,
          marginTop: 4
        }
      }, diferencia < 0 ? `Ahorrás ~USD ${Math.abs(diferencia).toFixed(0)}/tn` : diferencia > 0 ? `Pagás ~USD ${diferencia.toFixed(0)}/tn de más` : 'En línea con el histórico'));
    })() : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 600,
        color: col.texto,
        marginTop: 4
      }
    }, r.kgGranoPorKgUrea, " kg de ", r.cultivo.toLowerCase(), " / kg urea"), r.comentario && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#5f5e5a',
        marginTop: 6
      }
    }, r.comentario));
  }))), mercado?.factores && mercado.factores.length > 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "Factores a seguir"), mercado.factores.map((f, i) => {
    const col = f.impacto === 'alcista' ? COLOR_TENDENCIA.Alcista : f.impacto === 'bajista' ? COLOR_TENDENCIA.Bajista : COLOR_TENDENCIA.Neutral;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '8px 0',
        borderTop: '1px solid #f1efe8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: col.texto,
        background: col.fondo,
        border: `1px solid ${col.borde}`,
        borderRadius: 5,
        padding: '2px 8px',
        whiteSpace: 'nowrap'
      }
    }, f.impacto === 'alcista' ? '↑ Alcista' : f.impacto === 'bajista' ? '↓ Bajista' : '· Neutral'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, f.tema), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#5f5e5a'
      }
    }, f.detalle)));
  })));
}
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
    const riegos = data.lotes.filter(l => (l.modo || 'Riego') === 'Riego').map(l => {
      const campo = data.campos.find(c => c.id === l.campoId);
      const registros = data.actividades.filter(a => a.loteId === l.id && a.tipo === 'Riego' && a.mm);
      const esLluvia = r => (r.fuente || '').toLowerCase().includes('lluvia');
      const acumuladoRiego = registros.filter(r => !esLluvia(r)).reduce((s, a) => s + Number(a.mm), 0);
      const acumuladoLluvia = registros.filter(esLluvia).reduce((s, a) => s + Number(a.mm), 0);
      const aguaUtil = aguaUtilPromedio(data, l.id);
      const ciclo = cicloActivo(data, l.id);
      const objetivo = Number(l.objetivoRiego) || (ciclo ? OBJETIVO_RIEGO_POR_CULTIVO[ciclo.cultivo] : 0) || 0;
      const disponible = (aguaUtil ? aguaUtil.promedio : 0) + acumuladoRiego + acumuladoLluvia;
      return {
        lote: l,
        campo,
        balance: objetivo > 0 ? objetivo - disponible : null
      };
    }).filter(r => r.balance !== null).sort((a, b) => b.balance - a.balance);
    const lotesInvierno = data.lotes.map(l => ({
      lote: l,
      campo: data.campos.find(c => c.id === l.campoId),
      ciclo: cicloActivo(data, l.id)
    })).filter(x => x.ciclo && ['Trigo', 'Garbanzo'].includes(x.ciclo.cultivo));
    return {
      haTotal,
      gastoTotal,
      stockBajo,
      gastoPorCampo,
      camposPasados,
      consultasPendientes,
      riegos,
      lotesInvierno
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
  }, stats.consultasPendientes))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "💧 Riego"), stats.riegos.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Sin objetivos de riego cargados todavía."), stats.riegos.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.lote.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid #f1efe8',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, r.campo?.nombre, " — ", r.lote.nombre), /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.balance > 0 ? '#854F0B' : '#3B6D11',
      fontWeight: 500
    }
  }, r.balance >= 0 ? `Faltan ${r.balance}mm` : `Sobran ${Math.abs(r.balance)}mm`)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 8
    }
  }, "🌾 Cultivos de invierno activos"), stats.lotesInvierno.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Sin lotes de Trigo o Garbanzo activos ahora."), stats.lotesInvierno.map(({
    lote,
    campo,
    ciclo
  }) => {
    const col = COLOR_CULTIVO[ciclo.cultivo] || COLOR_CULTIVO['sin cultivo'];
    return /*#__PURE__*/React.createElement("div", {
      key: lote.id,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid #f1efe8',
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("span", null, campo?.nombre, " — ", lote.nombre), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 500,
        color: col.texto,
        background: col.fondo,
        border: `1px solid ${col.borde}`,
        borderRadius: 5,
        padding: '2px 8px'
      }
    }, ciclo.cultivo));
  })), /*#__PURE__*/React.createElement("div", {
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
const GRUPOS_APORTE = {
  'Insumos': ['Insumos'],
  'Labores': ['Siembra', 'Siembra con fertilización', 'Siembra con drone', 'Fertilización voleo', 'Fertilización drone', 'Pulverización terrestre', 'Pulverización avión', 'Pulverización drone', 'Cosecha'],
  'Otros rubros': ['Alquiler', 'Riego']
};
const TIPOS_APORTE = Object.values(GRUPOS_APORTE).flat();
function AportesParticipante({
  campo,
  participante,
  update
}) {
  const categorias = participante.categoriasAporte || [];
  const todoTildado = categorias.includes('Todo');
  const [abierto, setAbierto] = useState(false);
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
  const resumen = todoTildado ? 'Todo' : categorias.length > 0 ? categorias.join(', ') : 'nada tildado';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      marginLeft: 12,
      paddingLeft: 10,
      borderLeft: '2px solid #e3e1d8'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAbierto(!abierto),
    style: {
      ...btnGhost,
      fontSize: 11,
      padding: '2px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, abierto ? '▾' : '▸', " Qué aporta: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#5f5e5a',
      fontWeight: 400
    }
  }, resumen)), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 12,
      background: todoTildado ? '#EAF3DE' : '#f4f2ea',
      padding: '3px 8px',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: 500,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: todoTildado,
    onChange: () => toggle('Todo')
  }), "Todo"), Object.entries(GRUPOS_APORTE).map(([grupo, items]) => /*#__PURE__*/React.createElement("div", {
    key: grupo,
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa89f',
      textTransform: 'uppercase',
      marginBottom: 2
    }
  }, grupo), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, items.map(cat => /*#__PURE__*/React.createElement("label", {
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
  }), cat)))))));
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
  const [abierto, setAbierto] = useState(false);
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
  const resumenCompacto = participantes.map(p => {
    const cliente = data.clientes.find(c => c.id === p.clienteId);
    return `${cliente?.nombre || '?'}${p.porcentaje != null ? ` (${p.porcentaje}%)` : ''}`;
  }).join(' · ');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '8px 0',
      padding: '8px 10px',
      background: '#faf9f5',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAbierto(!abierto),
    style: {
      ...btnGhost,
      fontSize: 12,
      padding: '3px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      justifyContent: 'flex-start'
    }
  }, abierto ? '▾' : '▸', " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#888780'
    }
  }, "Participación / propietarios"), !abierto && resumenCompacto && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#5f5e5a',
      fontWeight: 400
    }
  }, "— ", resumenCompacto)), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, clienteViejo && /*#__PURE__*/React.createElement("div", {
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
  })));
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
  const [nuevoLote, setNuevoLote] = useState({});
  const [loteAbierto, setLoteAbierto] = useState(null);
  const addCampo = () => {
    if (!nuevoCampo.trim()) return;
    update('campos', c => [...c, {
      id: uid(),
      nombre: nuevoCampo.trim(),
      clienteId: clienteCampo || null,
      presupuesto: 0,
      porcentajeProductor: 0
    }]);
    setNuevoCampo('');
    setClienteCampo('');
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
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Productor"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: clienteCampo,
    onChange: e => setClienteCampo(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Propio"), data.clientes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre)))), /*#__PURE__*/React.createElement(Field, {
    label: "Nombre del campo"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      minWidth: 160
    },
    value: nuevoCampo,
    onChange: e => setNuevoCampo(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    onClick: addCampo,
    style: {
      ...btnPrimary,
      alignSelf: 'end'
    }
  }, "+ Agregar")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginTop: 6
    }
  }, "La participación de cada cliente/productor (con %, aportes, etc) se carga después, dentro del campo ya creado.")), data.campos.map(campo => {
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
    const objetivoDefault = OBJETIVO_RIEGO_POR_CULTIVO[form.cultivo.trim()];
    if (objetivoDefault && (lote.modo || 'Riego') === 'Riego') {
      update('lotes', ls => ls.map(l => l.id === lote.id ? {
        ...l,
        objetivoRiego: objetivoDefault
      } : l));
    }
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
function AnalisisFoto() {
  const [estado, setEstado] = useState('idle'); // idle | cargando | listo | error
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const elegirArchivo = e => {
    const file = e.target.files[0];
    if (!file) return;
    setEstado('cargando');
    setError('');
    setResultado(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch('/api/analizar-foto', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: base64,
            mediaType: file.type
          })
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Error analizando la foto');
          setEstado('error');
          return;
        }
        setResultado(json);
        setEstado('listo');
      } catch (err) {
        setError('No se pudo conectar para analizar la foto.');
        setEstado('error');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const colorEstado = {
    ok: {
      bg: '#EAF3DE',
      texto: '#27500A',
      borde: '#8FBF5E',
      label: 'OK'
    },
    alerta: {
      bg: '#FFF6D6',
      texto: '#8A6D00',
      borde: '#E8C547',
      label: 'ALERTA'
    },
    critico: {
      bg: '#FBE7E4',
      texto: '#A32D2D',
      borde: '#E28A8A',
      label: 'CRÍTICO'
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 6
    }
  }, "Subir foto del análisis"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: elegirArchivo,
    style: {
      fontSize: 13
    }
  }), estado === 'cargando' && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginTop: 6
    }
  }, "Analizando…"), estado === 'error' && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#A32D2D',
      marginTop: 6
    }
  }, error), estado === 'listo' && resultado && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, (() => {
    const c = colorEstado[resultado.resumenGeneral] || colorEstado.ok;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-block',
        fontSize: 13,
        fontWeight: 600,
        color: c.texto,
        background: c.bg,
        border: `1px solid ${c.borde}`,
        borderRadius: 6,
        padding: '4px 12px',
        marginBottom: 8
      }
    }, c.label);
  })(), (resultado.parametros || []).map((p, i) => {
    const c = colorEstado[p.estado] || colorEstado.ok;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        marginBottom: 3,
        background: c.bg,
        border: `1px solid ${c.borde}`,
        borderRadius: 5,
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, p.nombre), ": ", p.valor), /*#__PURE__*/React.createElement("span", {
      style: {
        color: c.texto,
        fontWeight: 500
      }
    }, p.comentario || c.label));
  })));
}
function CalculoFertilizacion({
  lote,
  data,
  update,
  cultivo
}) {
  const fertilidadLote = data.analisis.filter(a => a.loteId === lote.id && a.tipo === 'Fertilidad').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const ultima = fertilidadLote[0];
  const [formBase, setFormBase] = useState({
    fecha: '',
    nNo3_0_20: '',
    nNo3_20_60: '',
    mo: '',
    ph: ''
  });
  const rendObj = lote.rendimientoObjetivo != null ? String(lote.rendimientoObjetivo) : '';
  const setRendObj = val => update('lotes', ls => ls.map(l => l.id === lote.id ? {
    ...l,
    rendimientoObjetivo: val
  } : l));
  const [calibracion, setCalibracion] = useState('original');
  const [pctZona1, setPctZona1] = useState('50');
  const guardarBase = () => {
    if (!formBase.fecha) return;
    update('analisis', a => [...a, {
      id: uid(),
      loteId: lote.id,
      tipo: 'Fertilidad',
      ...formBase
    }]);
    setFormBase({
      fecha: '',
      nNo3_0_20: '',
      nNo3_20_60: '',
      mo: '',
      ph: ''
    });
  };

  // Agrupa las lecturas de la fecha mas reciente: si hay 2 o mas, son distintas zonas de fertilidad dentro del mismo lote
  const fechaMasReciente = ultima?.fecha;
  const muestrasUltimoMuestreo = fertilidadLote.filter(a => a.fecha === fechaMasReciente);
  const scoreFertilidad = m => (Number(m.mo) || 0) * 10 + (Number(m.nNo3_0_20) || 0) / 10; // MO pesa mas, N-NO3 desempata
  const muestrasOrdenadas = [...muestrasUltimoMuestreo].sort((a, b) => scoreFertilidad(b) - scoreFertilidad(a));
  const zonas = muestrasOrdenadas.length >= 2 ? [{
    etiqueta: 'Zona 1 (Alta)',
    rendRelativo: 1.03,
    muestra: muestrasOrdenadas[0],
    pct: Number(pctZona1) || 0
  }, {
    etiqueta: 'Zona 2 (Baja)',
    rendRelativo: 0.96,
    muestra: muestrasOrdenadas[muestrasOrdenadas.length - 1],
    pct: 100 - (Number(pctZona1) || 0)
  }] : muestrasOrdenadas.length === 1 ? [{
    etiqueta: null,
    rendRelativo: 1,
    muestra: muestrasOrdenadas[0],
    pct: 100
  }] : [];
  const calcularZona = (muestra, rendRelativo) => {
    const rendObjNum = Number(rendObj) || 0;
    if (rendObjNum <= 0 || !muestra) return null;
    const rendObjZona = rendObjNum * rendRelativo;
    const requerimiento = 28 / 0.625 * rendObjZona / 1000;
    const nNo3suelo = (Number(muestra.nNo3_0_20) || 0) * 1.35 * 2 + (Number(muestra.nNo3_20_60) || 0) * 1.3 * 4;
    const moN = Number(muestra.mo) || 0;
    const nan = 11.017 * moN + 18.43;
    const factorNan = calibracion === 'calibrado' ? 3.404 : 3.7;
    const mineralizacion = (factorNan * nan + moN / 100 * 0.58 * 1.3 * 0.2 * 10000 * 0.042 * 1000 / 10) / 2;
    const nFertTotal = Math.max(0, requerimiento - nNo3suelo - mineralizacion);
    const ureaTotal = nFertTotal / 0.46;
    return {
      nFertTotal,
      ureaTotal,
      requiereSplit: ureaTotal > 235
    };
  };
  const resultadosPorZona = zonas.map(z => ({
    ...z,
    resultado: calcularZona(z.muestra, z.rendRelativo)
  }));
  const ureaTotalLote = resultadosPorZona.reduce((s, z) => s + (z.resultado ? z.resultado.ureaTotal * (Number(lote.hectareas) || 0) * (z.pct / 100) : 0), 0);
  const haZona1 = zonas.length === 2 ? (Number(lote.hectareas) || 0) * (zonas[0].pct / 100) : null;
  const aplicacionesReales = data.actividades.filter(a => a.loteId === lote.id && a.tipo === 'Fertilización').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(AnalisisFoto, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 8
    }
  }, "Datos base (fertilidad)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Fecha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formBase.fecha,
    onChange: e => setFormBase({
      ...formBase,
      fecha: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "N-NO3 0-20cm"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formBase.nNo3_0_20,
    onChange: e => setFormBase({
      ...formBase,
      nNo3_0_20: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "N-NO3 20-60cm"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formBase.nNo3_20_60,
    onChange: e => setFormBase({
      ...formBase,
      nNo3_20_60: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "M.O. (%)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formBase.mo,
    onChange: e => setFormBase({
      ...formBase,
      mo: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "pH"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formBase.ph,
    onChange: e => setFormBase({
      ...formBase,
      ph: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: guardarBase,
    style: btnSecondary
  }, "+ Guardar datos base"), fertilidadLote.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, fertilidadLote.slice(0, 4).map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      padding: '3px 0',
      borderTop: '1px solid #e3e1d8'
    }
  }, a.fecha, " — N-NO3 ", a.nNo3_0_20 || 0, "/", a.nNo3_20_60 || 0, " ppm · MO ", a.mo || 0, "% · pH ", a.ph || '-'))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8',
      margin: '14px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 4
    }
  }, "Recomendación — Peralta-DISA"), cultivo !== 'Trigo' ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#854F0B',
      marginBottom: 8
    }
  }, "La fórmula de fertilización de Maíz todavía no está cargada — avisame los parámetros cuando la tengas y la agrego. Por ahora Peralta-DISA solo corre para Trigo.") : zonas.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 8
    }
  }, "Cargá datos base arriba para que aparezca la recomendación.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 8
    }
  }, zonas.length === 2 ? `Detecté 2 muestras del muestreo del ${fechaMasReciente} — Zona 1 (mejor fertilidad, rinde un poco más) y Zona 2 (rinde un poco menos), rendimiento relativo ${zonas[0].rendRelativo} y ${zonas[1].rendRelativo}.` : `Usa el dato base del ${fechaMasReciente}.`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'end',
      flexWrap: 'wrap',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Rendimiento objetivo (kg/ha)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: rendObj,
    onChange: e => setRendObj(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 4
    }
  }, "Calibración"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCalibracion('original'),
    style: {
      padding: '8px 14px',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      background: calibracion === 'original' ? '#EAF3DE' : '#f0efe8',
      color: calibracion === 'original' ? '#27500A' : '#5f5e5a',
      fontWeight: calibracion === 'original' ? 600 : 400
    }
  }, "Peralta"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCalibracion('calibrado'),
    style: {
      padding: '8px 14px',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      background: calibracion === 'calibrado' ? '#EAF3DE' : '#f0efe8',
      color: calibracion === 'calibrado' ? '#27500A' : '#5f5e5a',
      fontWeight: calibracion === 'calibrado' ? 600 : 400
    }
  }, "Peralta −8%"))), zonas.length === 2 && /*#__PURE__*/React.createElement(Field, {
    label: "% Zona 1 del lote"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 90
    },
    type: "number",
    min: "0",
    max: "100",
    value: pctZona1,
    onChange: e => setPctZona1(e.target.value)
  }))), zonas.length === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 8
    }
  }, "Zona 1: ", haZona1?.toFixed(0), "ha (", zonas[0].pct, "%) · Zona 2: ", ((Number(lote.hectareas) || 0) - haZona1).toFixed(0), "ha (", zonas[1].pct, "%)"), resultadosPorZona.map((z, i) => z.resultado && /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginTop: 8,
      padding: 12,
      background: '#EAF3DE',
      borderRadius: 8
    }
  }, z.etiqueta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: '#27500A',
      marginBottom: 4
    }
  }, z.etiqueta, " — ", z.pct, "% del lote"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      color: '#27500A'
    }
  }, z.resultado.ureaTotal.toFixed(0), " kg urea/ha"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#3B6D11'
    }
  }, z.resultado.nFertTotal.toFixed(1), " kg N/ha"), z.resultado.requiereSplit && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#854F0B',
      marginTop: 6
    }
  }, "Supera 235 kg/ha, repartir en 1ª y 2ª fertilización."))), ureaTotalLote > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: 12,
      background: '#FFF6D6',
      border: '1px solid #E8C547',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#8A6D00'
    }
  }, "Promedio a aplicar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      color: '#8A6D00',
      marginBottom: 8
    }
  }, (ureaTotalLote / (Number(lote.hectareas) || 1)).toFixed(0), " kg urea/ha"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#8A6D00'
    }
  }, "Total urea a comprar/aplicar en todo el lote (", lote.hectareas, "ha)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      color: '#8A6D00'
    }
  }, ureaTotalLote.toFixed(0), " kg"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8',
      margin: '14px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 13,
      marginBottom: 6
    }
  }, "Aplicaciones reales"), aplicacionesReales.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Todavía no hay ninguna fertilización cargada en este lote."), aplicacionesReales.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      padding: '3px 0',
      borderTop: '1px solid #e3e1d8'
    }
  }, a.fecha, " — ", a.metodo || 'sin método', " — ", (a.items || []).map(it => {
    const ins = data.insumos.find(i => i.id === it.insumoId);
    return `${it.cantidad}${ins?.unidad || ''} ${ins?.nombre || '?'}`;
  }).join(', ') || 'sin insumos')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginTop: 4
    }
  }, "Para cargar una nueva aplicación (1ª o 2ª fertilización), andá a la pestaña Actividades."));
}
function Fertilizacion({
  data,
  update
}) {
  const PRIORIDAD = {
    'Trigo': 0,
    'Maíz': 1
  };
  const tieneAnalisis = loteId => data.analisis.some(a => a.loteId === loteId && a.tipo === 'Fertilidad');
  const lotesOrdenados = [...data.lotes].sort((a, b) => {
    const tieneA = tieneAnalisis(a.id) ? 0 : 1;
    const tieneB = tieneAnalisis(b.id) ? 0 : 1;
    if (tieneA !== tieneB) return tieneA - tieneB;
    const modoA = (a.modo || 'Riego') === 'Secano' ? 1 : 0;
    const modoB = (b.modo || 'Riego') === 'Secano' ? 1 : 0;
    if (modoA !== modoB) return modoA - modoB;
    const cicloA = cicloActivo(data, a.id),
      cicloB = cicloActivo(data, b.id);
    const pa = cicloA && PRIORIDAD[cicloA.cultivo] != null ? PRIORIDAD[cicloA.cultivo] : 99;
    const pb = cicloB && PRIORIDAD[cicloB.cultivo] != null ? PRIORIDAD[cicloB.cultivo] : 99;
    return pa - pb;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, lotesOrdenados.map(l => {
    const campo = data.campos.find(c => c.id === l.campoId);
    const ciclo = cicloActivo(data, l.id);
    const esGraminea = ciclo && ['Trigo', 'Maíz'].includes(ciclo.cultivo);
    return /*#__PURE__*/React.createElement(Card, {
      key: l.id,
      style: {
        borderLeft: `4px solid ${(COLOR_CULTIVO[ciclo?.cultivo] || COLOR_CULTIVO['sin cultivo']).borde}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: esGraminea ? 10 : 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, campo?.nombre, " — ", l.nombre), (() => {
      const col = COLOR_CULTIVO[ciclo?.cultivo] || COLOR_CULTIVO['sin cultivo'];
      return /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 500,
          color: col.texto,
          background: col.fondo,
          border: `1px solid ${col.borde}`,
          borderRadius: 5,
          padding: '2px 8px',
          marginLeft: 8
        }
      }, ciclo ? ciclo.cultivo : `Barbecho → ${proximoCultivoBarbecho(data, l.id)}`);
    })()), esGraminea ? /*#__PURE__*/React.createElement(CalculoFertilizacion, {
      lote: l,
      data: data,
      update: update,
      cultivo: ciclo.cultivo
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Solo se fertiliza Trigo o Maíz — este lote no aplica ahora (el Garbanzo fija su propio nitrógeno, no se fertiliza)."));
  }));
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
function Seccion({
  titulo,
  children,
  defaultOpen
}) {
  const [abierto, setAbierto] = useState(!!defaultOpen);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAbierto(!abierto),
    style: {
      ...btnGhost,
      fontSize: 13,
      fontWeight: 500,
      padding: '4px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, abierto ? '▾' : '▸', " ", titulo), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, children));
}
function AguaUtilSecano({
  lote,
  data,
  update
}) {
  const [f, setF] = useState({
    fecha: '',
    aguaUtilMm: '',
    profundidad: '200'
  });
  const lecturas = data.analisis.filter(a => a.loteId === lote.id && a.tipo === 'Agua útil').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const guardar = () => {
    if (!f.fecha || f.aguaUtilMm === '') return;
    update('analisis', a => [...a, {
      id: uid(),
      loteId: lote.id,
      tipo: 'Agua útil',
      ...f
    }]);
    setF({
      fecha: '',
      aguaUtilMm: '',
      profundidad: '200'
    });
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Fecha"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: f.fecha,
    onChange: e => setF({
      ...f,
      fecha: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Agua útil (mm)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.aguaUtilMm,
    onChange: e => setF({
      ...f,
      aguaUtilMm: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Profundidad (cm)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: f.profundidad,
    onChange: e => setF({
      ...f,
      profundidad: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: guardar,
    style: {
      ...btnSecondary,
      marginTop: 8
    }
  }, "+ Guardar lectura"), lecturas.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, lecturas.slice(0, 6).map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      padding: '3px 0',
      borderTop: '1px solid #e3e1d8'
    }
  }, a.fecha, " — ", a.aguaUtilMm, "mm (", a.profundidad || '200', "cm)"))));
}
function LoteDetalle({
  lote,
  data,
  update
}) {
  const [formN, setFormN] = useState({
    fecha: '',
    tipo: 'Observación',
    texto: ''
  });
  const notasLote = data.notas.filter(n => n.loteId === lote.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
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
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Seccion, {
    titulo: "Acuerdos del lote"
  }, /*#__PURE__*/React.createElement(AcuerdosLote, {
    lote: lote,
    data: data,
    update: update
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(Seccion, {
    titulo: "Ciclos de cultivo",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(Ciclos, {
    lote: lote,
    data: data,
    update: update
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(Seccion, {
    titulo: "Cosecha"
  }, /*#__PURE__*/React.createElement(Cosecha, {
    lote: lote,
    data: data,
    update: update
  })), (lote.modo || 'Riego') === 'Secano' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement(Seccion, {
    titulo: "Agua útil (2m)"
  }, /*#__PURE__*/React.createElement(AguaUtilSecano, {
    lote: lote,
    data: data,
    update: update
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #e3e1d8'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780'
    }
  }, (lote.modo || 'Riego') === 'Riego' ? 'El agua útil también se puede cargar desde la pestaña "Riego". ' : '', "Los datos de fertilidad + la recomendación se cargan desde la pestaña \"Fertilización\"."), /*#__PURE__*/React.createElement(Seccion, {
    titulo: "Bitácora"
  }, /*#__PURE__*/React.createElement("div", {
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
  const lotesRiego = [...data.lotes.filter(l => (l.modo || 'Riego') === 'Riego')].sort((a, b) => {
    const tieneA = cicloActivo(data, a.id) ? 0 : 1;
    const tieneB = cicloActivo(data, b.id) ? 0 : 1;
    return tieneA - tieneB;
  });
  const setObjetivo = (loteId, val) => update('lotes', ls => ls.map(l => l.id === loteId ? {
    ...l,
    objetivoRiego: Number(val) || 0
  } : l));
  const [formAgua, setFormAgua] = useState({});
  const guardarAgua = loteId => {
    const f = formAgua[loteId];
    if (!f || !f.fecha || f.aguaUtilMm === '' || f.aguaUtilMm == null) return;
    update('analisis', a => [...a, {
      id: uid(),
      loteId,
      tipo: 'Agua útil',
      fecha: f.fecha,
      aguaUtilMm: f.aguaUtilMm,
      profundidad: f.profundidad || '200'
    }]);
    setFormAgua(p => ({
      ...p,
      [loteId]: {
        fecha: '',
        aguaUtilMm: '',
        profundidad: '200'
      }
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, lotesRiego.map(l => {
    const campo = data.campos.find(c => c.id === l.campoId);
    const registrosLote = data.actividades.filter(a => a.loteId === l.id && a.tipo === 'Riego' && a.mm).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const esLluvia = r => (r.fuente || '').toLowerCase().includes('lluvia');
    const riegosLote = registrosLote.filter(r => !esLluvia(r));
    const lluviasLote = registrosLote.filter(esLluvia);
    const acumuladoRiego = riegosLote.reduce((s, a) => s + Number(a.mm), 0);
    const acumuladoLluvia = lluviasLote.reduce((s, a) => s + Number(a.mm), 0);
    const ciclo = cicloActivo(data, l.id);
    const objetivo = Number(l.objetivoRiego) || (ciclo ? OBJETIVO_RIEGO_POR_CULTIVO[ciclo.cultivo] : 0) || 0;
    const aguaUtil = aguaUtilPromedio(data, l.id);
    const aguaUtilMm = aguaUtil ? aguaUtil.promedio : 0;
    const disponible = aguaUtilMm + acumuladoRiego + acumuladoLluvia;
    const balance = objetivo - disponible;
    const lecturasAguaLote = data.analisis.filter(a => a.loteId === l.id && a.tipo === 'Agua útil').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const fAgua = formAgua[l.id] || {
      fecha: '',
      aguaUtilMm: '',
      profundidad: '200'
    };
    return /*#__PURE__*/React.createElement(Card, {
      key: l.id,
      style: {
        borderLeft: `4px solid ${(COLOR_CULTIVO[ciclo?.cultivo] || COLOR_CULTIVO['sin cultivo']).borde}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, campo?.nombre, " — ", l.nombre), (() => {
      const col = COLOR_CULTIVO[ciclo?.cultivo] || COLOR_CULTIVO['sin cultivo'];
      return /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 500,
          color: col.texto,
          background: col.fondo,
          border: `1px solid ${col.borde}`,
          borderRadius: 5,
          padding: '2px 8px',
          marginLeft: 8
        }
      }, ciclo ? ciclo.cultivo : `Barbecho → ${proximoCultivoBarbecho(data, l.id)}`);
    })(), /*#__PURE__*/React.createElement("span", {
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
    }, "Agua útil (2m)"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500
      }
    }, aguaUtil ? `${aguaUtilMm} mm` : 'Sin datos'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#aaa89f'
      }
    }, aguaUtil ? `${aguaUtil.fecha}${aguaUtil.cantidadLecturas > 1 ? ` · promedio de ${aguaUtil.cantidadLecturas} lecturas` : ''}` : '')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      value: objetivo || '',
      onChange: e => setObjetivo(l.id, e.target.value)
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Riego"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500
      }
    }, acumuladoRiego, " mm")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "Precipitaciones"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500
      }
    }, acumuladoLluvia, " mm")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, balance >= 0 ? 'Falta' : 'Sobra'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 500,
        color: balance > 0 ? '#854F0B' : '#3B6D11'
      }
    }, objetivo > 0 ? `${Math.abs(balance)} mm` : '—'))), objetivo > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780',
        marginTop: 6
      }
    }, "Objetivo ", objetivo, "mm = agua útil (", aguaUtilMm, "mm) + riego (", acumuladoRiego, "mm) + precipitaciones (", acumuladoLluvia, "mm) → cubierto ", disponible, "mm de ", objetivo, "mm"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement(Seccion, {
      titulo: "💧 Cargar lectura de agua útil"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Fecha"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      type: "date",
      value: fAgua.fecha,
      onChange: e => setFormAgua(p => ({
        ...p,
        [l.id]: {
          ...fAgua,
          fecha: e.target.value
        }
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Agua útil (mm)"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      type: "number",
      value: fAgua.aguaUtilMm,
      onChange: e => setFormAgua(p => ({
        ...p,
        [l.id]: {
          ...fAgua,
          aguaUtilMm: e.target.value
        }
      }))
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Profundidad (cm)"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      type: "number",
      value: fAgua.profundidad,
      onChange: e => setFormAgua(p => ({
        ...p,
        [l.id]: {
          ...fAgua,
          profundidad: e.target.value
        }
      }))
    }))), /*#__PURE__*/React.createElement("button", {
      onClick: () => guardarAgua(l.id),
      style: {
        ...btnPrimary,
        marginTop: 8
      }
    }, "+ Guardar lectura"), lecturasAguaLote.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, lecturasAguaLote.slice(0, 6).map(a => /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        fontSize: 12,
        color: '#5f5e5a',
        padding: '3px 0',
        borderTop: '1px solid #e3e1d8'
      }
    }, a.fecha, " — ", a.aguaUtilMm, "mm (", a.profundidad || '200', "cm)"))))), registrosLote.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement(Seccion, {
      titulo: `Ver ${registrosLote.length} registro(s) individuales`
    }, registrosLote.map(r => /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        fontSize: 13,
        padding: '4px 0',
        borderTop: '1px solid #f1efe8',
        color: '#5f5e5a'
      }
    }, r.fecha, " — ", esLluvia(r) ? '🌧️ Lluvia' : '💧 Riego', " ", r.mm, "mm", r.fuente && !esLluvia(r) ? ` (${r.fuente})` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#888780',
        marginTop: 4
      }
    }, "Para editar o borrar un registro, andá a la pestaña Actividades y filtrá por este lote."))));
  }));
}

/* ---------- INSUMOS ---------- */
const UNIDADES_INSUMO = ['kg', 'g', 'L', 'cc'];
function Insumos({
  data,
  update
}) {
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Herbicida',
    especificar: '',
    unidad: 'kg',
    stockMinimo: '',
    clienteId: ''
  });
  const add = () => {
    if (!form.nombre.trim()) return;
    update('insumos', i => [...i, {
      id: uid(),
      ...form,
      stock: 0,
      stockMinimo: Number(form.stockMinimo) || 0,
      costoUnitario: 0,
      clienteId: form.clienteId || null
    }]);
    setForm({
      nombre: '',
      categoria: form.categoria,
      especificar: '',
      unidad: 'kg',
      stockMinimo: '',
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
      marginBottom: 4
    }
  }, "Nuevo insumo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 10
    }
  }, "Esto es solo la ficha del producto — el stock y el costo se van cargando solos con las Compras que registres a cada proveedor, y se van descontando cuando lo uses en una Actividad. El \"Stock mínimo\" es un aviso: si el stock real baja de ese número, te lo marca en rojo en el Resumen (ej: poné 50 y cuando queden 50kg o menos te avisa que hay que comprar más)."), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.unidad,
    onChange: e => setForm({
      ...form,
      unidad: e.target.value
    })
  }, UNIDADES_INSUMO.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u)))), /*#__PURE__*/React.createElement(Field, {
    label: "Stock mínimo"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: form.stockMinimo,
    onChange: e => setForm({
      ...form,
      stockMinimo: e.target.value
    }),
    placeholder: "ej: 50"
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
const UBICACIONES_STOCK = ['Proveedor', 'Planta', 'Campo'];
function agregarAUbicacion(insumo, ubicacion, rack, posicion, campoId, cantidad) {
  const buckets = insumo.stockUbicaciones || [];
  const idx = buckets.findIndex(b => b.ubicacion === ubicacion && (b.rack || '') === (rack || '') && (b.posicion || '') === (posicion || '') && (b.campoId || '') === (campoId || ''));
  if (idx >= 0) {
    const nuevos = [...buckets];
    nuevos[idx] = {
      ...nuevos[idx],
      cantidad: (Number(nuevos[idx].cantidad) || 0) + cantidad
    };
    return nuevos;
  }
  return [...buckets, {
    id: uid(),
    ubicacion,
    rack: rack || '',
    posicion: posicion || '',
    campoId: campoId || '',
    cantidad
  }];
}
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
    moneda: 'USD',
    financiacion: 'Contado',
    diasPlazo: '',
    tasaInteres: '',
    vencimientoDeuda: '',
    fecha: '',
    ubicacion: 'Proveedor',
    rack: '',
    posicion: '',
    campoId: ''
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
  const precioFinanciado = formC.financiacion === 'Plazo' && formC.precioUnitario && formC.tasaInteres ? Number(formC.precioUnitario) * (1 + Number(formC.tasaInteres) / 100) : Number(formC.precioUnitario) || 0;
  const guardarCompra = () => {
    if (!formC.proveedorId || !formC.insumoId || !formC.fecha) return;
    const cantidad = Number(formC.cantidad) || 0;
    const precioUnitario = Number(formC.precioUnitario) || 0;
    update('compras', c => [...c, {
      id: uid(),
      ...formC,
      cantidad,
      precioUnitario,
      precioFinanciado,
      montoTotal: cantidad * precioFinanciado
    }]);
    update('insumos', ins => ins.map(i => i.id === formC.insumoId ? {
      ...i,
      stock: (Number(i.stock) || 0) + cantidad,
      costoUnitario: precioFinanciado || i.costoUnitario,
      stockUbicaciones: agregarAUbicacion(i, formC.ubicacion, formC.rack, formC.posicion, formC.campoId, cantidad)
    } : i));
    setFormC({
      proveedorId: '',
      insumoId: '',
      cantidad: '',
      precioUnitario: '',
      moneda: 'USD',
      financiacion: 'Contado',
      diasPlazo: '',
      tasaInteres: '',
      vencimientoDeuda: '',
      fecha: '',
      ubicacion: 'Proveedor',
      rack: '',
      posicion: '',
      campoId: ''
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
    label: "Precio unitario (contado)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formC.precioUnitario,
    onChange: e => setFormC({
      ...formC,
      precioUnitario: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Moneda"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.moneda,
    onChange: e => setFormC({
      ...formC,
      moneda: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "USD"
  }, "USD"), /*#__PURE__*/React.createElement("option", {
    value: "$"
  }, "$ (pesos)"))), /*#__PURE__*/React.createElement(Field, {
    label: "Financiación"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.financiacion,
    onChange: e => setFormC({
      ...formC,
      financiacion: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "Contado"
  }, "Contado"), /*#__PURE__*/React.createElement("option", {
    value: "Plazo"
  }, "Plazo"))), formC.financiacion === 'Plazo' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Días de plazo"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formC.diasPlazo,
    onChange: e => setFormC({
      ...formC,
      diasPlazo: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tasa interés (%)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    value: formC.tasaInteres,
    onChange: e => setFormC({
      ...formC,
      tasaInteres: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Vencimiento de la deuda"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formC.vencimientoDeuda,
    onChange: e => setFormC({
      ...formC,
      vencimientoDeuda: e.target.value
    })
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Fecha de compra"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: formC.fecha,
    onChange: e => setFormC({
      ...formC,
      fecha: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Ubicación"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.ubicacion,
    onChange: e => setFormC({
      ...formC,
      ubicacion: e.target.value
    })
  }, UBICACIONES_STOCK.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u)))), formC.ubicacion === 'Planta' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Rack"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: formC.rack,
    onChange: e => setFormC({
      ...formC,
      rack: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Posición"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: formC.posicion,
    onChange: e => setFormC({
      ...formC,
      posicion: e.target.value
    })
  }))), formC.ubicacion === 'Campo' && /*#__PURE__*/React.createElement(Field, {
    label: "Campo"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: formC.campoId,
    onChange: e => setFormC({
      ...formC,
      campoId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), data.campos.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.nombre))))), formC.financiacion === 'Plazo' && formC.precioUnitario && formC.tasaInteres && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginTop: 8
    }
  }, "Precio financiado: ", formC.moneda, " ", precioFinanciado.toFixed(2), "/unidad (contado ", formC.moneda, " ", Number(formC.precioUnitario).toFixed(2), " + ", formC.tasaInteres, "%)"), /*#__PURE__*/React.createElement("button", {
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
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Stock por ubicación"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888780',
      marginBottom: 10
    }
  }, "Dónde está físicamente cada insumo, y cómo moverlo entre lugares (ej: de Planta al Campo antes de una aplicación)."), data.insumos.map(i => /*#__PURE__*/React.createElement(StockUbicacionInsumo, {
    key: i.id,
    insumo: i,
    data: data,
    update: update
  }))));
}
function StockUbicacionInsumo({
  insumo,
  data,
  update
}) {
  const buckets = insumo.stockUbicaciones || [];
  const [abierto, setAbierto] = useState(false);
  const [mov, setMov] = useState({
    desdeIdx: '',
    ubicacion: 'Campo',
    rack: '',
    posicion: '',
    campoId: '',
    cantidad: ''
  });
  if (buckets.length === 0 && !abierto) return null;
  const transferir = () => {
    const idx = Number(mov.desdeIdx);
    const cantidad = Number(mov.cantidad) || 0;
    if (isNaN(idx) || !buckets[idx] || cantidad <= 0 || cantidad > Number(buckets[idx].cantidad)) return;
    update('insumos', ins => ins.map(i => {
      if (i.id !== insumo.id) return i;
      const restantes = i.stockUbicaciones.map((b, bi) => bi === idx ? {
        ...b,
        cantidad: Number(b.cantidad) - cantidad
      } : b).filter(b => Number(b.cantidad) > 0);
      const conDestino = agregarAUbicacion({
        ...i,
        stockUbicaciones: restantes
      }, mov.ubicacion, mov.rack, mov.posicion, mov.campoId, cantidad);
      return {
        ...i,
        stockUbicaciones: conDestino
      };
    }));
    setMov({
      desdeIdx: '',
      ubicacion: 'Campo',
      rack: '',
      posicion: '',
      campoId: '',
      cantidad: ''
    });
  };
  const nombreBucket = b => `${b.ubicacion}${b.rack ? ` (rack ${b.rack}${b.posicion ? '/' + b.posicion : ''})` : ''}${b.campoId ? ` (${data.campos.find(c => c.id === b.campoId)?.nombre || '?'})` : ''}`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0',
      borderTop: '1px solid #f1efe8'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAbierto(!abierto),
    style: {
      ...btnGhost,
      fontSize: 13,
      padding: '2px 4px'
    }
  }, abierto ? '▾' : '▸', " ", insumo.nombre), abierto && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      paddingLeft: 8
    }
  }, buckets.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "Sin stock ubicado todavía."), buckets.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      padding: '2px 0'
    }
  }, nombreBucket(b), ": ", b.cantidad, " ", insumo.unidad)), buckets.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      padding: '3px 6px',
      fontSize: 12
    },
    value: mov.desdeIdx,
    onChange: e => setMov({
      ...mov,
      desdeIdx: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Desde…"), buckets.map((b, i) => /*#__PURE__*/React.createElement("option", {
    key: i,
    value: i
  }, nombreBucket(b)))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "→"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      padding: '3px 6px',
      fontSize: 12
    },
    value: mov.ubicacion,
    onChange: e => setMov({
      ...mov,
      ubicacion: e.target.value
    })
  }, UBICACIONES_STOCK.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u))), mov.ubicacion === 'Planta' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 60,
      padding: '3px 6px',
      fontSize: 12
    },
    placeholder: "Rack",
    value: mov.rack,
    onChange: e => setMov({
      ...mov,
      rack: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 60,
      padding: '3px 6px',
      fontSize: 12
    },
    placeholder: "Pos.",
    value: mov.posicion,
    onChange: e => setMov({
      ...mov,
      posicion: e.target.value
    })
  })), mov.ubicacion === 'Campo' && /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      padding: '3px 6px',
      fontSize: 12
    },
    value: mov.campoId,
    onChange: e => setMov({
      ...mov,
      campoId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Campo…"), data.campos.map(c => /*#__PURE__*/React.createElement("option", {
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
    placeholder: "Cant.",
    value: mov.cantidad,
    onChange: e => setMov({
      ...mov,
      cantidad: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    onClick: transferir,
    style: {
      ...btnGhost,
      fontSize: 11,
      padding: '3px 8px'
    }
  }, "Mover"))));
}

/* ---------- ACTIVIDADES ---------- */
function Recetas({
  data,
  update
}) {
  const recetas = data.recetas || [];
  const setHaAplicables = (loteId, val) => update('hectareasAplicables', h => ({
    ...(h || {}),
    [loteId]: val ? Number(val) : null
  }));
  const recetasOrdenadas = [...recetas].sort((a, b) => b.numero - a.numero);
  const fechaDDMMAAAA = iso => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return y && m && d ? `${d}/${m}/${y}` : iso;
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
      marginBottom: 4
    }
  }, "Hectáreas aplicables por lote"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 10
    }
  }, "Cargá acá cuántas hectáreas se aplican realmente en cada lote (siempre un poco más que las reales, por la superposición de la máquina). El bot usa este número para calcular cuánto insumo pedirle al aplicador — así no le queda corto y se le termina antes de cubrir todo el lote."), data.lotes.map(l => {
    const campo = data.campos.find(c => c.id === l.campoId);
    const valor = (data.hectareasAplicables || {})[l.id];
    return /*#__PURE__*/React.createElement("div", {
      key: l.id,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderTop: '1px solid #f1efe8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, campo?.nombre, " — ", l.nombre, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#888780'
      }
    }, "(", l.hectareas, "ha reales)")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        width: 90
      },
      type: "number",
      placeholder: String(l.hectareas),
      value: valor ?? '',
      onChange: e => setHaAplicables(l.id, e.target.value)
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888780'
      }
    }, "ha aplicables")));
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 10
    }
  }, "Historial de órdenes (", recetasOrdenadas.length, ")"), recetasOrdenadas.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888780'
    }
  }, "Todavía no se generó ninguna orden. Mandá por WhatsApp el lote y los productos con dosis para que se genere sola."), recetasOrdenadas.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      padding: '10px 0',
      borderTop: '1px solid #f1efe8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      fontSize: 14
    }
  }, "N° ", String(r.numero).padStart(5, '0'), " — ", r.establecimiento, " — Lote ", r.lote), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, fechaDDMMAAAA(r.fecha), " · ", r.hectareasAplicables, "ha aplicables")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#5f5e5a',
      marginTop: 4
    }
  }, r.items.map((it, i) => `${it.producto} ${it.dosisPorHa}/ha (total ${it.totalProducto.toFixed(1)})`).join(' · '))))));
}
function Tarifario({
  data,
  update
}) {
  const tarifario = data.tarifario || {};
  const setValor = (labor, val) => update('tarifario', t => ({
    ...(t || {}),
    [labor]: val ? Number(val) : null
  }));
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
  }, "Riego"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 10
    }
  }, "El riego se cobra por mm aplicado, no por ha fija — el costo final sale de multiplicar esta tarifa × los mm regados × las hectáreas del lote."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: '1px solid #f1efe8'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "mm de riego"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 100
    },
    type: "number",
    step: "0.01",
    placeholder: "0",
    value: tarifario['Riego'] ?? '',
    onChange: e => setValor('Riego', e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "USD/mm/ha")))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      marginBottom: 4
    }
  }, "Tarifario de labores"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 10
    }
  }, "Cargá acá el valor USD/ha de cada labor. Cuando registrés una actividad de ese tipo, el campo \"Tarifa contratista\" se va a completar solo con este valor (siempre lo podés cambiar en el momento si esa vez fue distinto)."), GRUPOS_APORTE['Labores'].map(labor => /*#__PURE__*/React.createElement("div", {
    key: labor,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: '1px solid #f1efe8'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, labor), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      width: 100
    },
    type: "number",
    placeholder: "0",
    value: tarifario[labor] ?? '',
    onChange: e => setValor(labor, e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: '#888780'
    }
  }, "USD/ha"))))));
}
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
    densidadUnidad: 'kg/ha',
    paraClienteId: '',
    esParcial: false
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
    let costoContratista = esAplicacion && form.tarifaContratista ? Number(form.tarifaContratista) * haFact : 0;
    if (form.tipo === 'Riego' && data.tarifario?.Riego && form.mm) {
      const loteRiego = data.lotes.find(l => l.id === form.loteId);
      costoContratista = Number(data.tarifario.Riego) * Number(form.mm) * (Number(loteRiego?.hectareas) || 0);
    }
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
      fontSize: 11,
      color: '#aaa89f',
      textTransform: 'uppercase',
      marginBottom: 6
    }
  }, "Qué se hizo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Lote"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.loteId,
    onChange: e => {
      const loteId = e.target.value;
      const loteElegido = data.lotes.find(l => l.id === loteId);
      setForm({
        ...form,
        loteId,
        haReales: loteElegido ? String(loteElegido.hectareas) : form.haReales
      });
    }
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
    onChange: e => {
      const nuevoTipo = e.target.value;
      const key = laborKey(nuevoTipo, '');
      const tarifaAuto = key && data.tarifario && data.tarifario[key] ? data.tarifario[key] : form.tarifaContratista;
      setForm({
        ...form,
        tipo: nuevoTipo,
        metodo: '',
        tarifaContratista: tarifaAuto
      });
    }
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
  })), esAplicacion && /*#__PURE__*/React.createElement(Field, {
    label: "Método"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.metodo,
    onChange: e => {
      const nuevoMetodo = e.target.value;
      const key = laborKey(form.tipo, nuevoMetodo);
      const tarifaAuto = key && data.tarifario && data.tarifario[key] ? data.tarifario[key] : form.tarifaContratista;
      setForm({
        ...form,
        metodo: nuevoMetodo,
        tarifaContratista: tarifaAuto
      });
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Elegir…"), (METODOS_POR_TIPO[form.tipo] || []).map(m => /*#__PURE__*/React.createElement("option", {
    key: m
  }, m)))), form.tipo === 'Siembra' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
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
  }))), participantesDelLote.length > 0 && /*#__PURE__*/React.createElement(Field, {
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
  }, data.clientes.find(c => c.id === p.clienteId)?.nombre || '?'))))), (form.tipo === 'Riego' || form.tipo === 'Cosecha' || form.tipo === 'Siembra' || esAplicacion) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#aaa89f',
      textTransform: 'uppercase',
      marginBottom: 6
    }
  }, "Cantidad y costo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 10,
      marginBottom: 14
    }
  }, form.tipo === 'Riego' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Milímetros"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: "mm",
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
  })), data.tarifario?.Riego && form.mm && form.loteId && (() => {
    const loteRiegoPreview = data.lotes.find(l => l.id === form.loteId);
    const costoPreview = Number(data.tarifario.Riego) * Number(form.mm) * (Number(loteRiegoPreview?.hectareas) || 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#888780',
        alignSelf: 'end',
        paddingBottom: 6
      }
    }, "Costo estimado: ", fmtMoney(costoPreview), " (", data.tarifario.Riego, " USD/mm/ha × ", form.mm, "mm × ", loteRiegoPreview?.hectareas || 0, "ha)");
  })()), form.tipo === 'Cosecha' && /*#__PURE__*/React.createElement(Field, {
    label: "Rendimiento"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: "qq/ha",
    value: form.rendimiento,
    onChange: e => setForm({
      ...form,
      rendimiento: e.target.value
    })
  })), form.tipo === 'Siembra' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Densidad"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: form.cultivo === 'Soja' ? form.densidadUnidad || 'kg/ha' : 'kg/ha',
    value: form.densidad,
    onChange: e => setForm({
      ...form,
      densidad: e.target.value
    })
  })), form.cultivo === 'Soja' && /*#__PURE__*/React.createElement(Field, {
    label: "Unidad densidad"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: form.densidadUnidad || 'kg/ha',
    onChange: e => setForm({
      ...form,
      densidadUnidad: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "kg/ha"
  }, "kg/ha"), /*#__PURE__*/React.createElement("option", {
    value: "semillas/ha"
  }, "semillas/ha")))), esAplicacion && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Ha reales (dosis)"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: "ha",
    value: form.haReales,
    onChange: e => setForm({
      ...form,
      haReales: e.target.value
    })
  })), (() => {
    const loteActual = data.lotes.find(l => l.id === form.loteId);
    const cobertura = form.haReales && loteActual?.hectareas ? Number(form.haReales) / Number(loteActual.hectareas) : null;
    if (cobertura !== null && cobertura <= 0.6) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'end',
          paddingBottom: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: '#A32D2D',
          background: '#FBE7E4',
          padding: '4px 8px',
          borderRadius: 5
        }
      }, "⚠️ Manchoneo detectado (", Math.round(cobertura * 100), "% del lote)"));
    }
    return null;
  })(), /*#__PURE__*/React.createElement(Field, {
    label: "Ha facturadas contratista"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: "ha",
    placeholder: "= ha reales si vacío",
    value: form.haFacturadas,
    onChange: e => setForm({
      ...form,
      haFacturadas: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tarifa contratista"
  }, /*#__PURE__*/React.createElement(InputUnidad, {
    unidad: "USD/ha",
    value: form.tarifaContratista,
    onChange: e => setForm({
      ...form,
      tarifaContratista: e.target.value
    })
  }))))), /*#__PURE__*/React.createElement("div", {
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
      fontSize: 11,
      color: '#aaa89f',
      textTransform: 'uppercase',
      marginBottom: 6
    }
  }, "Insumos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888780',
      marginBottom: 6
    }
  }, "Cantidad total aplicada, se divide sola por las ha reales"), items.map((it, idx) => {
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
    const cobertura = act.haReales && lote?.hectareas ? Number(act.haReales) / Number(lote.hectareas) : null;
    const esManchoneo = cobertura !== null && cobertura <= 0.6;
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
    }, "(", paraCliente.nombre, ")"), esManchoneo && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#A32D2D',
        background: '#FBE7E4',
        padding: '1px 6px',
        borderRadius: 4,
        marginLeft: 6,
        fontWeight: 500
      }
    }, "⚠️ Manchoneo (", Math.round(cobertura * 100), "% del lote)"), act.costoContratista > 0 && /*#__PURE__*/React.createElement("div", {
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
