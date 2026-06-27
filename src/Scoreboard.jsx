import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Paleta de estilos (equivalente a las variables CSS originales) ---
const theme = {
  bg: '#f4f7f6',
  text: '#2c3e50',
  card: '#ffffff',
  accent: '#005A9C',
  accentHover: '#004375',
};

// Datos simulados que normalmente recibiríamos de una API deportiva.
// Se mantienen aquí para que la app funcione sin claves ni dependencias externas.
const DATOS_SIMULADOS = [
  { equipo1: 'Argentina', goles1: 2, equipo2: 'Francia', goles2: 1, estado: 'En Juego - Min 78' },
  { equipo1: 'Brasil', goles1: 0, equipo2: 'Inglaterra', goles2: 0, estado: 'Próximo' },
  { equipo1: 'España', goles1: 3, equipo2: 'Alemania', goles2: 2, estado: 'Finalizado' },
];

// Simula la llamada a una API (p. ej. API-Football) con un pequeño retardo de red.
function obtenerMarcadoresSimulados() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DATOS_SIMULADOS), 800);
  });
}

export default function Scoreboard() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(false);
  const intervaloRef = useRef(null);

  const actualizar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Aquí iría el fetch() real a una API como API-Football:
      // const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      //   { headers: { 'x-apisports-key': 'TU_API_KEY' } });
      const datos = await obtenerMarcadoresSimulados();
      setPartidos(datos);
    } catch (e) {
      console.error('Error al obtener los datos', e);
      setError('Hubo un error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial + refresco automático ("piloto automático") cada 30 s.
  useEffect(() => {
    actualizar();
    intervaloRef.current = setInterval(actualizar, 30000);
    return () => clearInterval(intervaloRef.current);
  }, [actualizar]);

  const styles = {
    body: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: '100vh',
      margin: 0,
      padding: 20,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    h1: { fontWeight: 300, marginBottom: 20 },
    boton: {
      backgroundColor: hover ? theme.accentHover : theme.accent,
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      fontSize: 16,
      borderRadius: 8,
      cursor: cargando ? 'default' : 'pointer',
      transition: 'background-color 0.3s ease',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: 30,
      opacity: cargando ? 0.7 : 1,
    },
    contenedor: {
      width: '100%',
      maxWidth: 600,
      display: 'flex',
      flexDirection: 'column',
      gap: 15,
    },
    partido: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    equipo: { fontSize: 18, fontWeight: 500 },
    marcador: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.accent,
      background: '#eef2f5',
      padding: '5px 15px',
      borderRadius: 6,
    },
    estado: {
      fontSize: 12,
      color: '#7f8c8d',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    aviso: { textAlign: 'center', color: '#7f8c8d' },
    volver: {
      alignSelf: 'flex-start',
      color: theme.accent,
      textDecoration: 'none',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 10,
    },
  };

  return (
    <div style={styles.body}>
      <a href="#" style={styles.volver}>&larr; Volver al CRM</a>
      <h1 style={styles.h1}>Llaves del Mundial</h1>

      <button
        style={styles.boton}
        onClick={actualizar}
        disabled={cargando}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {cargando ? 'Actualizando...' : 'Actualizar Marcadores'}
      </button>

      <div style={styles.contenedor}>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        {!error && partidos.length === 0 && (
          <p style={styles.aviso}>Cargando los datos en tiempo real...</p>
        )}

        {!error &&
          partidos.map((partido, i) => (
            <div className="partido" style={styles.partido} key={`${partido.equipo1}-${partido.equipo2}-${i}`}>
              <div style={styles.equipo}>{partido.equipo1}</div>
              <div style={styles.marcador}>
                {partido.goles1} - {partido.goles2}
              </div>
              <div style={styles.equipo}>{partido.equipo2}</div>
              <div style={styles.estado}>{partido.estado}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
