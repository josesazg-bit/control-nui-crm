import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Scoreboard.css';

// --- Grupos oficiales del Mundial 2026 (sorteo del 5 dic 2025, 48 equipos / 12 grupos) ---
const GRUPOS = {
  A: ['México', 'Corea del Sur', 'Chequia', 'Sudáfrica'],
  B: ['Suiza', 'Canadá', 'Catar', 'Bosnia y Herzegovina'],
  C: ['Brasil', 'Marruecos', 'Escocia', 'Haití'],
  D: ['Estados Unidos', 'Turquía', 'Paraguay', 'Australia'],
  E: ['Alemania', 'Costa de Marfil', 'Ecuador', 'Curazao'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Uruguay', 'Cabo Verde', 'Arabia Saudita'],
  I: ['Francia', 'Senegal', 'Noruega', 'Irak'],
  J: ['Argentina', 'Austria', 'Argelia', 'Jordania'],
  K: ['Portugal', 'Colombia', 'Uzbekistán', 'Congo RD'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};
const GRUPO_KEYS = Object.keys(GRUPOS);

// Banderas (emoji) por selección.
const FLAGS = {
  'México': '🇲🇽', 'Corea del Sur': '🇰🇷', 'Chequia': '🇨🇿', 'Sudáfrica': '🇿🇦',
  'Suiza': '🇨🇭', 'Canadá': '🇨🇦', 'Catar': '🇶🇦', 'Bosnia y Herzegovina': '🇧🇦',
  'Brasil': '🇧🇷', 'Marruecos': '🇲🇦', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haití': '🇭🇹',
  'Estados Unidos': '🇺🇸', 'Turquía': '🇹🇷', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺',
  'Alemania': '🇩🇪', 'Costa de Marfil': '🇨🇮', 'Ecuador': '🇪🇨', 'Curazao': '🇨🇼',
  'Países Bajos': '🇳🇱', 'Japón': '🇯🇵', 'Suecia': '🇸🇪', 'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪', 'Egipto': '🇪🇬', 'Irán': '🇮🇷', 'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸', 'Uruguay': '🇺🇾', 'Cabo Verde': '🇨🇻', 'Arabia Saudita': '🇸🇦',
  'Francia': '🇫🇷', 'Senegal': '🇸🇳', 'Noruega': '🇳🇴', 'Irak': '🇮🇶',
  'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Argelia': '🇩🇿', 'Jordania': '🇯🇴',
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistán': '🇺🇿', 'Congo RD': '🇨🇩',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia': '🇭🇷', 'Ghana': '🇬🇭', 'Panamá': '🇵🇦',
};
const flag = (name) => FLAGS[name] || '🏳️';

// Orden de los 6 partidos de cada grupo (round-robin)
const PARES = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

// --- Cuadro de eliminatorias (formato 2026: 32 clasificados) ---
// Referencias: "1A" = 1.º grupo A; "2A" = 2.º grupo A; "T1"..."T8" = mejores terceros (1.º al 8.º);
// "WD1" = ganador del partido D1; "LS1" = perdedor de S1.
//
// NOTA: los emparejamientos 1.º/2.º y el reparto de terceros NO replican el Anexo C oficial
// (495 combinaciones). Es un esquema simplificado pero válido de eliminación directa.
const DIECISEIS = [
  { id: 'D1', a: '1A', b: 'T1' }, { id: 'D2', a: '1B', b: 'T2' },
  { id: 'D3', a: '1C', b: 'T3' }, { id: 'D4', a: '1D', b: 'T4' },
  { id: 'D5', a: '1E', b: 'T5' }, { id: 'D6', a: '1F', b: 'T6' },
  { id: 'D7', a: '1G', b: 'T7' }, { id: 'D8', a: '1H', b: 'T8' },
  { id: 'D9', a: '1I', b: '2A' }, { id: 'D10', a: '1J', b: '2C' },
  { id: 'D11', a: '1K', b: '2E' }, { id: 'D12', a: '1L', b: '2G' },
  { id: 'D13', a: '2B', b: '2D' }, { id: 'D14', a: '2F', b: '2H' },
  { id: 'D15', a: '2I', b: '2K' }, { id: 'D16', a: '2J', b: '2L' },
];
const OCTAVOS = [
  { id: 'O1', a: 'WD1', b: 'WD2' }, { id: 'O2', a: 'WD3', b: 'WD4' },
  { id: 'O3', a: 'WD5', b: 'WD6' }, { id: 'O4', a: 'WD7', b: 'WD8' },
  { id: 'O5', a: 'WD9', b: 'WD10' }, { id: 'O6', a: 'WD11', b: 'WD12' },
  { id: 'O7', a: 'WD13', b: 'WD14' }, { id: 'O8', a: 'WD15', b: 'WD16' },
];
const CUARTOS = [
  { id: 'C1', a: 'WO1', b: 'WO2' }, { id: 'C2', a: 'WO3', b: 'WO4' },
  { id: 'C3', a: 'WO5', b: 'WO6' }, { id: 'C4', a: 'WO7', b: 'WO8' },
];
const SEMIS = [{ id: 'S1', a: 'WC1', b: 'WC2' }, { id: 'S2', a: 'WC3', b: 'WC4' }];
const FINAL = { id: 'F1', a: 'WS1', b: 'WS2' };
const BRONCE = { id: 'BR', a: 'LS1', b: 'LS2' };

const COLUMNAS = [
  { nombre: 'Dieciseisavos', partidos: DIECISEIS },
  { nombre: 'Octavos', partidos: OCTAVOS },
  { nombre: 'Cuartos', partidos: CUARTOS },
  { nombre: 'Semifinales', partidos: SEMIS },
  { nombre: 'Final', partidos: [FINAL] },
];
const TODOS_KO = [...DIECISEIS, ...OCTAVOS, ...CUARTOS, ...SEMIS, FINAL, BRONCE];
const getKODef = (id) => TODOS_KO.find((m) => m.id === id);

const STORAGE_KEY = 'mundial-scores-v2';

const num = (v) => (v === '' || v === null || v === undefined || isNaN(v) ? null : parseInt(v, 10));

const buscarEnGoogle = (consulta) => {
  const q = encodeURIComponent(consulta);
  window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
};

export default function Scoreboard() {
  const [groupScores, setGroupScores] = useState({});
  const [koScores, setKoScores] = useState({});
  const [vista, setVista] = useState('grupos');
  const [busqueda, setBusqueda] = useState('');

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ groupScores, koScores }));
    } catch (e) {
      console.error('No se pudo guardar el marcador', e);
    }
  }, [groupScores, koScores]);

  const setGoles = useCallback((matchId, lado, valor) => {
    setGroupScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [lado]: valor } }));
  }, []);

  const setKO = useCallback((id, campo, valor) => {
    setKoScores((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }, []);

  const reiniciar = useCallback(() => {
    if (window.confirm('¿Borrar todos los marcadores ingresados?')) {
      setGroupScores({});
      setKoScores({});
    }
  }, []);

  // --- Tablas de posiciones ---
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

  // --- Ranking de terceros (los 8 mejores clasifican) ---
  const thirds = useMemo(() => {
    const arr = GRUPO_KEYS.map((g) => ({ ...standings[g][2], grupo: g }));
    arr.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.grupo.localeCompare(b.grupo));
    return arr; // 12 terceros; los primeros 8 avanzan
  }, [standings]);

  const qualifyingThirds = useMemo(
    () => new Set(thirds.slice(0, 8).map((t) => t.equipo)),
    [thirds]
  );

  // Resuelve qué equipo ocupa un "slot".
  const resolveSlot = useCallback(
    (ref) => {
      if (/^[12][A-L]$/.test(ref)) {
        const pos = Number(ref[0]) - 1;
        return standings[ref[1]]?.[pos]?.equipo ?? null;
      }
      if (/^T\d{1,2}$/.test(ref)) {
        return thirds[Number(ref.slice(1)) - 1]?.equipo ?? null;
      }
      if (ref[0] === 'W' || ref[0] === 'L') {
        const r = resolveKO(ref.slice(1));
        return ref[0] === 'W' ? r.winner : r.loser;
      }
      return null;
    },
    [standings, thirds, koScores] // eslint-disable-line react-hooks/exhaustive-deps
  );

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

      <header className="pitch__hero">
        <span className="pitch__live"><span className="pitch__dot" /> Mundial 2026</span>
        <h1 className="pitch__title">El Mundial<em>en tus manos</em></h1>
        <p className="pitch__sub">
          Consulta el resultado real en Google, escríbelo, y mira cómo las tablas de grupo y el
          cuadro se reordenan solos. Todo se guarda en tu teléfono.
        </p>
      </header>

      <div className="pitch__search">
        <input
          className="pitch__search-input"
          placeholder="Buscar partido en Google…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && busqueda.trim()) buscarEnGoogle(`${busqueda} resultado mundial 2026`); }}
        />
        <button
          className="pitch__search-btn"
          onClick={() => busqueda.trim() && buscarEnGoogle(`${busqueda} resultado mundial 2026`)}
        >
          🔎<span>&nbsp;Buscar</span>
        </button>
      </div>

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
        {vista === 'grupos' ? (
          GRUPO_KEYS.map((g, i) => (
            <Grupo key={g} grupo={g} index={i} tabla={standings[g]} groupScores={groupScores}
              setGoles={setGoles} qualifyingThirds={qualifyingThirds} />
          ))
        ) : (
          <section className="card bracket-card">
            <div className="card__head">
              <span className="card__tag">El <b>cuadro</b></span>
              <span className="card__rule" />
            </div>
            <p className="bracket-hint">Desliza para ver todo el cuadro →</p>
            <p className="bracket-note">
              Formato 2026: clasifican los 2 primeros de cada grupo + los 8 mejores terceros (32 equipos).
              El reparto exacto de los terceros (Anexo C) está simplificado.
            </p>

            <div className="bracket">
              {COLUMNAS.map((col) => (
                <div className="round" key={col.nombre}>
                  <div className="round__name">{col.nombre}</div>
                  <div className="round__body">
                    {col.partidos.map((m) => (
                      <div className="bracket-match" key={m.id}>
                        <BracketMatch def={m} estado={resolveKO(m.id)} setKO={setKO} koScores={koScores} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="third">
              <div className="third__name">🥉 Tercer puesto</div>
              <BracketMatch def={BRONCE} estado={resolveKO(BRONCE.id)} setKO={setKO} koScores={koScores} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// --- Tarjeta de un grupo ---
function Grupo({ grupo, index, tabla, groupScores, setGoles, qualifyingThirds }) {
  const equipos = GRUPOS[grupo];
  return (
    <section className="card" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="card__head">
        <span className="card__tag">Grupo <b>{grupo}</b></span>
        <span className="card__rule" />
      </div>

      <table className="standings">
        <thead>
          <tr>
            <th className="is-left">Equipo</th>
            <th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla?.map((t, i) => {
            const cls = i < 2 ? 'row-q' : (i === 2 && qualifyingThirds.has(t.equipo) ? 'row-q3' : undefined);
            return (
              <tr key={t.equipo} className={cls}>
                <td className="col-team">
                  <span className="team-cell">
                    <span className="pos">{i + 1}</span>
                    <span className="flag">{flag(t.equipo)}</span>
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
            );
          })}
        </tbody>
      </table>

      <div className="matches">
        {PARES.map(([i, j], k) => {
          const matchId = `${grupo}-${k}`;
          const sc = groupScores[matchId] || {};
          return (
            <div className="match-row" key={matchId}>
              <span className="match-team home">
                <span className="nm">{equipos[i]}</span>
                <span className="flag">{flag(equipos[i])}</span>
              </span>
              <input className="score" type="number" min="0" inputMode="numeric"
                value={sc.s1 ?? ''} onChange={(e) => setGoles(matchId, 's1', e.target.value)} />
              <span className="sep">:</span>
              <input className="score" type="number" min="0" inputMode="numeric"
                value={sc.s2 ?? ''} onChange={(e) => setGoles(matchId, 's2', e.target.value)} />
              <span className="match-team away">
                <span className="flag">{flag(equipos[j])}</span>
                <span className="nm">{equipos[j]}</span>
              </span>
              <button className="search-mini" title="Buscar en Google"
                onClick={() => buscarEnGoogle(`${equipos[i]} vs ${equipos[j]} resultado mundial 2026`)}>🔎</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Partido del cuadro (dos filas apiladas con bandera) ---
function BracketMatch({ def, estado, setKO, koScores }) {
  const sc = koScores[def.id] || {};
  const { teamA, teamB, winner } = estado;
  const esFinal = def.id === 'F1';
  const winA = winner && winner === teamA;
  const winB = winner && winner === teamB;
  return (
    <div className={`bm${esFinal && winner ? ' bm--champ' : ''}`}>
      <button className="bm__search" title="Buscar en Google"
        onClick={() => buscarEnGoogle(`${teamA || ''} vs ${teamB || ''} resultado mundial 2026`)}>🔎</button>

      <div className={`bm__row${winA ? ' bm__row--win' : ''}`}>
        <span className="flag">{teamA ? flag(teamA) : '⚽'}</span>
        <span className={`bm__name${teamA ? '' : ' pending'}`}>{teamA || 'Por definir'}</span>
        <input className="bm__score" type="number" min="0" inputMode="numeric"
          value={sc.s1 ?? ''} onChange={(e) => setKO(def.id, 's1', e.target.value)} />
      </div>

      <div className={`bm__row${winB ? ' bm__row--win' : ''}`}>
        <span className="flag">{teamB ? flag(teamB) : '⚽'}</span>
        <span className={`bm__name${teamB ? '' : ' pending'}`}>{teamB || 'Por definir'}</span>
        <input className="bm__score" type="number" min="0" inputMode="numeric"
          value={sc.s2 ?? ''} onChange={(e) => setKO(def.id, 's2', e.target.value)} />
      </div>

      {estado.empate && (
        <div className="bm__pens">
          Pen
          <input className="bm__pen" type="number" min="0" inputMode="numeric"
            value={sc.p1 ?? ''} onChange={(e) => setKO(def.id, 'p1', e.target.value)} />
          <input className="bm__pen" type="number" min="0" inputMode="numeric"
            value={sc.p2 ?? ''} onChange={(e) => setKO(def.id, 'p2', e.target.value)} />
        </div>
      )}
    </div>
  );
}
