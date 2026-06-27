import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Paleta de estilos ---
const theme = {
  bg: '#f4f7f6',
  text: '#2c3e50',
  card: '#ffffff',
  accent: '#005A9C',
  accentHover: '#004375',
  muted: '#7f8c8d',
};

// --- Definición de grupos (8 grupos de 4 equipos) ---
const GRUPOS = {
  A: ['Argentina', 'México', 'Polonia', 'Arabia Saudita'],
  B: ['Francia', 'Países Bajos', 'Senegal', 'Australia'],
  C: ['Brasil', 'Suiza', 'Camerún', 'Serbia'],
  D: ['Inglaterra', 'Estados Unidos', 'Irán', 'Gales'],
  E: ['España', 'Alemania', 'Japón', 'Costa Rica'],
  F: ['Bélgica', 'Croacia', 'Marruecos', 'Canadá'],
  G: ['Portugal', 'Uruguay', 'Corea del Sur', 'Ghana'],
  H: ['Italia', 'Colombia', 'Ecuador', 'Nigeria'],
};
const GRUPO_KEYS = Object.keys(GRUPOS);

// Orden de los 6 partidos de cada grupo (round-robin)
const PARES = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

// --- Estructura del cuadro de eliminatorias ---
// Referencias: "1A" = 1.º del grupo A; "WO1" = ganador del partido O1; "LS1" = perdedor de S1.
const LLAVES = {
  Octavos: [
    { id: 'O1', a: '1A', b: '2B' },
    { id: 'O2', a: '1C', b: '2D' },
    { id: 'O3', a: '1E', b: '2F' },
    { id: 'O4', a: '1G', b: '2H' },
    { id: 'O5', a: '1B', b: '2A' },
    { id: 'O6', a: '1D', b: '2C' },
    { id: 'O7', a: '1F', b: '2E' },
    { id: 'O8', a: '1H', b: '2G' },
  ],
  Cuartos: [
    { id: 'C1', a: 'WO1', b: 'WO2' },
    { id: 'C2', a: 'WO3', b: 'WO4' },
    { id: 'C3', a: 'WO5', b: 'WO6' },
    { id: 'C4', a: 'WO7', b: 'WO8' },
  ],
  Semifinales: [
    { id: 'S1', a: 'WC1', b: 'WC2' },
    { id: 'S2', a: 'WC3', b: 'WC4' },
  ],
  Finales: [
    { id: 'T3', a: 'LS1', b: 'LS2' }, // Tercer puesto
    { id: 'F1', a: 'WS1', b: 'WS2' }, // Final
  ],
};
const TODOS_KO = Object.values(LLAVES).flat();
const getKODef = (id) => TODOS_KO.find((m) => m.id === id);
const NOMBRE_KO = { O: 'Octavos', C: 'Cuartos', S: 'Semifinal', T: '3.º puesto', F: 'Final' };

const STORAGE_KEY = 'mundial-scores-v1';

// Convierte el valor de un input a número, o null si está vacío/ inválido.
const num = (v) => (v === '' || v === null || v === undefined || isNaN(v) ? null : parseInt(v, 10));

// Abre la búsqueda en Google en otra pestaña.
const buscarEnGoogle = (consulta) => {
  const q = encodeURIComponent(consulta);
  window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
};

export default function Scoreboard() {
  const [groupScores, setGroupScores] = useState({}); // { "A-0": {s1,s2}, ... }
  const [koScores, setKoScores] = useState({}); // { "O1": {s1,s2,p1,p2}, ... }
  const [vista, setVista] = useState('grupos'); // 'grupos' | 'llaves'
  const [busqueda, setBusqueda] = useState('');

  // Cargar datos guardados al iniciar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setGroupScores(data.groupScores || {});
        setKoScores(data.koScores || {});
      }
    } catch (e) {
      console.error('No se pudo cargar el marcador guardado', e);
    }
  }, []);

  // Guardar automáticamente ante cualquier cambio.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ groupScores, koScores }));
    } catch (e) {
      console.error('No se pudo guardar el marcador', e);
    }
  }, [groupScores, koScores]);

  const setGoles = useCallback((matchId, lado, valor) => {
    setGroupScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [lado]: valor },
    }));
  }, []);

  const setKO = useCallback((id, campo, valor) => {
    setKoScores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor },
    }));
  }, []);

  const reiniciar = useCallback(() => {
    if (window.confirm('¿Borrar todos los marcadores ingresados?')) {
      setGroupScores({});
      setKoScores({});
    }
  }, []);

  // --- Tablas de posiciones (se recalculan solas con cada gol) ---
  const standings = useMemo(() => {
    const tablas = {};
    GRUPO_KEYS.forEach((g) => {
      const equipos = GRUPOS[g];
      const stats = equipos.map((equipo, idx) => ({
        equipo, idx, pj: 0, pts: 0, gf: 0, gc: 0, dg: 0, g: 0, e: 0, p: 0,
      }));
      PARES.forEach(([i, j], k) => {
        const sc = groupScores[`${g}-${k}`] || {};
        const s1 = num(sc.s1);
        const s2 = num(sc.s2);
        if (s1 === null || s2 === null) return;
        const A = stats[i];
        const B = stats[j];
        A.pj++; B.pj++;
        A.gf += s1; A.gc += s2;
        B.gf += s2; B.gc += s1;
        if (s1 > s2) { A.pts += 3; A.g++; B.p++; }
        else if (s2 > s1) { B.pts += 3; B.g++; A.p++; }
        else { A.pts += 1; B.pts += 1; A.e++; B.e++; }
      });
      stats.forEach((t) => { t.dg = t.gf - t.gc; });
      stats.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.idx - b.idx);
      tablas[g] = stats;
    });
    return tablas;
  }, [groupScores]);

  // Resuelve qué equipo ocupa un "slot" (posición de grupo o ganador/perdedor de un partido).
  const resolveSlot = useCallback(
    (ref) => {
      if (/^[12][A-H]$/.test(ref)) {
        const pos = Number(ref[0]) - 1;
        const g = ref[1];
        return standings[g]?.[pos]?.equipo ?? null;
      }
      if (ref[0] === 'W' || ref[0] === 'L') {
        const r = resolveKO(ref.slice(1));
        return ref[0] === 'W' ? r.winner : r.loser;
      }
      return null;
    },
    // resolveKO definida abajo; depende de standings y koScores
    [standings, koScores] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Resuelve un partido de eliminatorias (equipos, marcador, ganador, perdedor).
  const resolveKO = useCallback(
    (id) => {
      const def = getKODef(id);
      if (!def) return {};
      const teamA = resolveSlot(def.a);
      const teamB = resolveSlot(def.b);
      const sc = koScores[id] || {};
      const s1 = num(sc.s1);
      const s2 = num(sc.s2);
      let winner = null;
      let loser = null;
      if (teamA && teamB && s1 !== null && s2 !== null) {
        if (s1 > s2) { winner = teamA; loser = teamB; }
        else if (s2 > s1) { winner = teamB; loser = teamA; }
        else {
          const p1 = num(sc.p1);
          const p2 = num(sc.p2);
          if (p1 !== null && p2 !== null && p1 !== p2) {
            if (p1 > p2) { winner = teamA; loser = teamB; }
            else { winner = teamB; loser = teamA; }
          }
        }
      }
      return { teamA, teamB, s1, s2, winner, loser, empate: s1 !== null && s2 !== null && s1 === s2 };
    },
    [resolveSlot, koScores]
  );

  return (
    <div style={S.body}>
      <a href="#" style={S.volver}>&larr; Volver al CRM</a>
      <h1 style={S.h1}>🏆 Mundial — Marcadores en Vivo</h1>

      {/* Buscador de Google */}
      <div style={S.buscadorWrap}>
        <input
          style={S.input}
          placeholder="Buscar resultado en Google (ej. Argentina vs Francia)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && busqueda.trim()) buscarEnGoogle(`${busqueda} resultado mundial`); }}
        />
        <button
          style={S.btnPrimario}
          onClick={() => busqueda.trim() && buscarEnGoogle(`${busqueda} resultado mundial`)}
        >
          🔎 Buscar en Google
        </button>
      </div>
      <p style={S.ayuda}>
        Consulta el resultado real en Google y escríbelo abajo: las tablas de grupo y el cuadro de
        llaves se actualizan solos. Todo se guarda en tu navegador.
      </p>

      {/* Pestañas */}
      <div style={S.tabs}>
        <button style={vista === 'grupos' ? S.tabActiva : S.tab} onClick={() => setVista('grupos')}>
          Fase de Grupos
        </button>
        <button style={vista === 'llaves' ? S.tabActiva : S.tab} onClick={() => setVista('llaves')}>
          Eliminatorias
        </button>
        <button style={S.btnReset} onClick={reiniciar}>Reiniciar</button>
      </div>

      <div style={S.contenido}>
        {vista === 'grupos'
          ? GRUPO_KEYS.map((g) => (
              <Grupo
                key={g}
                grupo={g}
                tabla={standings[g]}
                groupScores={groupScores}
                setGoles={setGoles}
              />
            ))
          : Object.entries(LLAVES).map(([ronda, partidos]) => (
              <div key={ronda} style={S.card}>
                <h3 style={S.cardTitulo}>{ronda}</h3>
                {partidos.map((m) => (
                  <PartidoKO key={m.id} def={m} estado={resolveKO(m.id)} setKO={setKO} koScores={koScores} />
                ))}
              </div>
            ))}
      </div>
    </div>
  );
}

// --- Componente: tarjeta de un grupo (tabla + partidos editables) ---
function Grupo({ grupo, tabla, groupScores, setGoles }) {
  const equipos = GRUPOS[grupo];
  return (
    <div style={S.card}>
      <h3 style={S.cardTitulo}>Grupo {grupo}</h3>

      {/* Tabla de posiciones */}
      <table style={S.tabla}>
        <thead>
          <tr style={S.thead}>
            <th style={{ ...S.th, textAlign: 'left' }}>Equipo</th>
            <th style={S.th}>PJ</th>
            <th style={S.th}>G</th>
            <th style={S.th}>E</th>
            <th style={S.th}>P</th>
            <th style={S.th}>GF</th>
            <th style={S.th}>GC</th>
            <th style={S.th}>DG</th>
            <th style={S.th}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla?.map((t, i) => (
            <tr key={t.equipo} style={i < 2 ? S.filaClasifica : undefined}>
              <td style={{ ...S.td, textAlign: 'left', fontWeight: 600 }}>
                {i < 2 ? '✅ ' : ''}{t.equipo}
              </td>
              <td style={S.td}>{t.pj}</td>
              <td style={S.td}>{t.g}</td>
              <td style={S.td}>{t.e}</td>
              <td style={S.td}>{t.p}</td>
              <td style={S.td}>{t.gf}</td>
              <td style={S.td}>{t.gc}</td>
              <td style={S.td}>{t.dg}</td>
              <td style={{ ...S.td, fontWeight: 700, color: theme.accent }}>{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Partidos editables */}
      <div style={S.partidos}>
        {PARES.map(([i, j], k) => {
          const matchId = `${grupo}-${k}`;
          const sc = groupScores[matchId] || {};
          return (
            <div key={matchId} style={S.partidoRow}>
              <span style={S.equipoIzq}>{equipos[i]}</span>
              <input style={S.score} type="number" min="0" inputMode="numeric"
                value={sc.s1 ?? ''} onChange={(e) => setGoles(matchId, 's1', e.target.value)} />
              <span style={S.guion}>-</span>
              <input style={S.score} type="number" min="0" inputMode="numeric"
                value={sc.s2 ?? ''} onChange={(e) => setGoles(matchId, 's2', e.target.value)} />
              <span style={S.equipoDer}>{equipos[j]}</span>
              <button style={S.lupa} title="Buscar en Google"
                onClick={() => buscarEnGoogle(`${equipos[i]} vs ${equipos[j]} resultado mundial`)}>🔎</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Componente: partido de eliminatorias ---
function PartidoKO({ def, estado, setKO, koScores }) {
  const sc = koScores[def.id] || {};
  const a = estado.teamA || 'Por definir';
  const b = estado.teamB || 'Por definir';
  const etiqueta = NOMBRE_KO[def.id[0]];
  return (
    <div style={S.koRow}>
      <span style={S.koEtiqueta}>{def.id === 'T3' ? '3.º puesto' : def.id === 'F1' ? 'Final' : etiqueta}</span>
      <div style={S.koLinea}>
        <span style={S.equipoIzq}>{a}</span>
        <input style={S.score} type="number" min="0" inputMode="numeric"
          value={sc.s1 ?? ''} onChange={(e) => setKO(def.id, 's1', e.target.value)} />
        <span style={S.guion}>-</span>
        <input style={S.score} type="number" min="0" inputMode="numeric"
          value={sc.s2 ?? ''} onChange={(e) => setKO(def.id, 's2', e.target.value)} />
        <span style={S.equipoDer}>{b}</span>
        <button style={S.lupa} title="Buscar en Google"
          onClick={() => buscarEnGoogle(`${a} vs ${b} resultado mundial`)}>🔎</button>
      </div>
      {estado.empate && (
        <div style={S.penales}>
          Penales:
          <input style={S.scorePenal} type="number" min="0" inputMode="numeric"
            value={sc.p1 ?? ''} onChange={(e) => setKO(def.id, 'p1', e.target.value)} />
          <span style={S.guion}>-</span>
          <input style={S.scorePenal} type="number" min="0" inputMode="numeric"
            value={sc.p2 ?? ''} onChange={(e) => setKO(def.id, 'p2', e.target.value)} />
        </div>
      )}
      {estado.winner && <div style={S.avanza}>➡️ Avanza: <strong>{estado.winner}</strong></div>}
    </div>
  );
}

// --- Estilos ---
const S = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', margin: 0,
    padding: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  volver: { alignSelf: 'flex-start', color: theme.accent, textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 10 },
  h1: { fontWeight: 300, marginBottom: 16, textAlign: 'center' },
  buscadorWrap: { display: 'flex', gap: 10, width: '100%', maxWidth: 600, flexWrap: 'wrap', justifyContent: 'center' },
  input: { flex: 1, minWidth: 220, padding: '10px 14px', fontSize: 15, border: '1px solid #cfd8dc', borderRadius: 8, outline: 'none' },
  btnPrimario: { backgroundColor: theme.accent, color: 'white', border: 'none', padding: '10px 18px', fontSize: 15, borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  ayuda: { color: theme.muted, fontSize: 13, maxWidth: 600, textAlign: 'center', margin: '10px 0 20px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  tab: { background: '#fff', color: theme.text, border: '1px solid #cfd8dc', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  tabActiva: { background: theme.accent, color: '#fff', border: '1px solid ' + theme.accent, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnReset: { background: '#fff', color: '#c0392b', border: '1px solid #e0b4b0', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  contenido: { width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 },
  card: { backgroundColor: theme.card, padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  cardTitulo: { margin: '0 0 12px', fontSize: 18, color: theme.accent },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 },
  thead: { borderBottom: '2px solid #eef2f5' },
  th: { padding: '6px 4px', textAlign: 'center', color: theme.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' },
  td: { padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #f0f3f5' },
  filaClasifica: { background: '#eef7ef' },
  partidos: { display: 'flex', flexDirection: 'column', gap: 8 },
  partidoRow: { display: 'flex', alignItems: 'center', gap: 6 },
  koRow: { padding: '10px 0', borderBottom: '1px solid #f0f3f5' },
  koLinea: { display: 'flex', alignItems: 'center', gap: 6 },
  koEtiqueta: { fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 },
  equipoIzq: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: 500 },
  equipoDer: { flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 500 },
  score: { width: 44, padding: '6px', textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: theme.accent, background: '#eef2f5', border: '1px solid #dce4e8', borderRadius: 6 },
  scorePenal: { width: 38, padding: '4px', textAlign: 'center', fontSize: 13, border: '1px solid #dce4e8', borderRadius: 6, margin: '0 4px' },
  guion: { fontWeight: 'bold', color: theme.muted },
  lupa: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2 },
  penales: { fontSize: 12, color: theme.muted, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avanza: { fontSize: 13, color: '#27ae60', marginTop: 6, textAlign: 'center' },
};
