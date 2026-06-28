import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Scoreboard.css';
import { ANNEX_C } from './annexC';

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

// --- Cuadro de eliminatorias OFICIAL del Mundial 2026 (art. 12.6–12.11 del reglamento) ---
// Referencias: "1A"/"2A" = 1.º/2.º del grupo A; "TX" = mejor tercero asignado a la casilla del
// ganador del grupo X según el Anexo C; "W73" = ganador del partido 73; "L101" = perdedor del 101.
// Las columnas de cada ronda van en el orden visual del cuadro (para que los conectores alineen).
const COLS_TERCEROS = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L']; // ganadores que enfrentan a un tercero

const DIECISEIS = [
  { id: '74', a: '1E', b: 'TE' }, { id: '77', a: '1I', b: 'TI' },
  { id: '73', a: '2A', b: '2B' }, { id: '75', a: '1F', b: '2C' },
  { id: '83', a: '2K', b: '2L' }, { id: '84', a: '1H', b: '2J' },
  { id: '81', a: '1D', b: 'TD' }, { id: '82', a: '1G', b: 'TG' },
  { id: '76', a: '1C', b: '2F' }, { id: '78', a: '2E', b: '2I' },
  { id: '79', a: '1A', b: 'TA' }, { id: '80', a: '1L', b: 'TL' },
  { id: '86', a: '1J', b: '2H' }, { id: '88', a: '2D', b: '2G' },
  { id: '85', a: '1B', b: 'TB' }, { id: '87', a: '1K', b: 'TK' },
];
const OCTAVOS = [
  { id: '89', a: 'W74', b: 'W77' }, { id: '90', a: 'W73', b: 'W75' },
  { id: '93', a: 'W83', b: 'W84' }, { id: '94', a: 'W81', b: 'W82' },
  { id: '91', a: 'W76', b: 'W78' }, { id: '92', a: 'W79', b: 'W80' },
  { id: '95', a: 'W86', b: 'W88' }, { id: '96', a: 'W85', b: 'W87' },
];
const CUARTOS = [
  { id: '97', a: 'W89', b: 'W90' }, { id: '98', a: 'W93', b: 'W94' },
  { id: '99', a: 'W91', b: 'W92' }, { id: '100', a: 'W95', b: 'W96' },
];
const SEMIS = [{ id: '101', a: 'W97', b: 'W98' }, { id: '102', a: 'W99', b: 'W100' }];
const FINAL = { id: '104', a: 'W101', b: 'W102' };
const BRONCE = { id: '103', a: 'L101', b: 'L102' };

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

  // Asignación oficial de terceros (Anexo C): grupo del ganador -> grupo del tercero que enfrenta.
  const annexAssignment = useMemo(() => {
    const top8 = thirds.slice(0, 8).map((t) => t.grupo);
    const key = [...top8].sort().join('');
    const val = ANNEX_C[key];
    const map = {};
    if (val) COLS_TERCEROS.forEach((c, i) => { map[c] = val[i]; });
    return map;
  }, [thirds]);

  // Resuelve qué equipo ocupa un "slot".
  const resolveSlot = useCallback(
    (ref) => {
      if (/^[12][A-L]$/.test(ref)) {
        const pos = Number(ref[0]) - 1;
        return standings[ref[1]]?.[pos]?.equipo ?? null;
      }
      if (/^T[A-L]$/.test(ref)) {
        const g = annexAssignment[ref[1]];
        return g ? (standings[g]?.[2]?.equipo ?? null) : null;
      }
      if (ref[0] === 'W' || ref[0] === 'L') {
        const r = resolveKO(ref.slice(1));
        return ref[0] === 'W' ? r.winner : r.loser;
      }
      return null;
    },
    [standings, thirds, annexAssignment, koScores] // eslint-disable-line react-hooks/exhaustive-deps
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
              Cuadro oficial 2026: 2 primeros de cada grupo + 8 mejores terceros (32 equipos). El
              reparto de los terceros sigue el Anexo C oficial del reglamento FIFA (495 combinaciones).
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
  const esFinal = def.id === '104';
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
