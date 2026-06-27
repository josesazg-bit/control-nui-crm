import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Scoreboard.css';

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
const NOMBRE_KO = { O: 'Octavos de final', C: 'Cuartos de final', S: 'Semifinal', T: 'Tercer puesto', F: 'Gran final' };

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
    <div className="pitch">
      <a className="pitch__back" href="#">&larr; Volver al CRM</a>

      {/* Hero */}
      <header className="pitch__hero">
        <span className="pitch__live"><span className="pitch__dot" /> En vivo</span>
        <h1 className="pitch__title">El Mundial<em>en tus manos</em></h1>
        <p className="pitch__sub">
          Consulta el resultado real en Google, escríbelo, y mira cómo las tablas de grupo y el
          cuadro de llaves se reordenan solos. Todo se guarda en tu teléfono.
        </p>
      </header>

      {/* Buscador de Google */}
      <div className="pitch__search">
        <input
          className="pitch__search-input"
          placeholder="Buscar partido en Google…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && busqueda.trim()) buscarEnGoogle(`${busqueda} resultado mundial`); }}
        />
        <button
          className="pitch__search-btn"
          onClick={() => busqueda.trim() && buscarEnGoogle(`${busqueda} resultado mundial`)}
        >
          🔎<span>&nbsp;Buscar</span>
        </button>
      </div>

      {/* Pestañas */}
      <nav className="pitch__tabs">
        <button className="pitch__tab" data-active={vista === 'grupos'} onClick={() => setVista('grupos')}>
          Fase de grupos
        </button>
        <button className="pitch__tab" data-active={vista === 'llaves'} onClick={() => setVista('llaves')}>
          Eliminatorias
        </button>
        <button className="pitch__reset" title="Reiniciar marcadores" onClick={reiniciar}>↺</button>
      </nav>

      <main className="pitch__grid">
        {vista === 'grupos'
          ? GRUPO_KEYS.map((g, i) => (
              <Grupo
                key={g}
                grupo={g}
                index={i}
                tabla={standings[g]}
                groupScores={groupScores}
                setGoles={setGoles}
              />
            ))
          : Object.entries(LLAVES).map(([ronda, partidos], i) => (
              <section className="card" style={{ animationDelay: `${i * 60}ms` }} key={ronda}>
                <div className="card__head">
                  <span className="card__tag">{ronda}</span>
                  <span className="card__rule" />
                </div>
                {partidos.map((m) => (
                  <PartidoKO key={m.id} def={m} estado={resolveKO(m.id)} setKO={setKO} koScores={koScores} />
                ))}
              </section>
            ))}
      </main>
    </div>
  );
}

// --- Componente: tarjeta de un grupo (tabla + partidos editables) ---
function Grupo({ grupo, index, tabla, groupScores, setGoles }) {
  const equipos = GRUPOS[grupo];
  return (
    <section className="card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="card__head">
        <span className="card__tag">Grupo <b>{grupo}</b></span>
        <span className="card__rule" />
      </div>

      {/* Tabla de posiciones */}
      <table className="standings">
        <thead>
          <tr>
            <th className="is-left">Equipo</th>
            <th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla?.map((t, i) => (
            <tr key={t.equipo} className={i < 2 ? 'row-q' : undefined}>
              <td className="col-team">
                <span className="team-cell">
                  <span className="pos">{i + 1}</span>
                  <span className="team-name">{t.equipo}</span>
                </span>
              </td>
              <td>{t.pj}</td>
              <td>{t.g}</td>
              <td>{t.e}</td>
              <td>{t.p}</td>
              <td>{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
              <td className="pts">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Partidos editables */}
      <div className="matches">
        {PARES.map(([i, j], k) => {
          const matchId = `${grupo}-${k}`;
          const sc = groupScores[matchId] || {};
          return (
            <div className="match" key={matchId}>
              <span className="match__team home">{equipos[i]}</span>
              <input className="score" type="number" min="0" inputMode="numeric"
                value={sc.s1 ?? ''} onChange={(e) => setGoles(matchId, 's1', e.target.value)} />
              <span className="sep">:</span>
              <input className="score" type="number" min="0" inputMode="numeric"
                value={sc.s2 ?? ''} onChange={(e) => setGoles(matchId, 's2', e.target.value)} />
              <span className="match__team away">{equipos[j]}</span>
              <button className="search-mini" title="Buscar en Google"
                onClick={() => buscarEnGoogle(`${equipos[i]} vs ${equipos[j]} resultado mundial`)}>🔎</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Componente: partido de eliminatorias ---
function PartidoKO({ def, estado, setKO, koScores }) {
  const sc = koScores[def.id] || {};
  const a = estado.teamA;
  const b = estado.teamB;
  const esFinal = def.id === 'F1';
  return (
    <div className={`ko${esFinal ? ' ko--final' : ''}`}>
      <div className="ko__round">{NOMBRE_KO[def.id[0]]}</div>
      <div className="ko__row">
        <span className={`match__team home${a ? '' : ' pending'}`}>{a || 'Por definir'}</span>
        <input className="score" type="number" min="0" inputMode="numeric"
          value={sc.s1 ?? ''} onChange={(e) => setKO(def.id, 's1', e.target.value)} />
        <span className="sep">:</span>
        <input className="score" type="number" min="0" inputMode="numeric"
          value={sc.s2 ?? ''} onChange={(e) => setKO(def.id, 's2', e.target.value)} />
        <span className={`match__team away${b ? '' : ' pending'}`}>{b || 'Por definir'}</span>
        <button className="search-mini" title="Buscar en Google"
          onClick={() => buscarEnGoogle(`${a || ''} vs ${b || ''} resultado mundial`)}>🔎</button>
      </div>
      {estado.empate && (
        <div className="ko__pens">
          Penales
          <input className="pen" type="number" min="0" inputMode="numeric"
            value={sc.p1 ?? ''} onChange={(e) => setKO(def.id, 'p1', e.target.value)} />
          <span className="sep">:</span>
          <input className="pen" type="number" min="0" inputMode="numeric"
            value={sc.p2 ?? ''} onChange={(e) => setKO(def.id, 'p2', e.target.value)} />
        </div>
      )}
      {estado.winner && <div className="ko__winner">{esFinal ? '🏆 Campeón:' : '➡ Avanza:'} <strong>&nbsp;{estado.winner}</strong></div>}
    </div>
  );
}
