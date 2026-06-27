import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Scoreboard from './Scoreboard.jsx'

// Enrutado mínimo basado en el hash de la URL, sin dependencias extra:
//   - "/"            -> CRM (App)
//   - "/#scoreboard" -> Marcadores en Vivo del Mundial
function Root() {
  const [ruta, setRuta] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRuta(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (ruta.replace(/^#/, '') === 'scoreboard') {
    return <Scoreboard />
  }
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
