# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Marcadores del Mundial

La app incluye un marcador del Mundial (`src/Scoreboard.jsx`). Funciona sin
instalar nada extra ni claves de API, y guarda los datos en el navegador
(`localStorage`).

- CRM (por defecto): `/` — botón **MUNDIAL** en la cabecera.
- Marcadores: `/#scoreboard`

Cómo funciona:

- 🔎 **Buscador a Google**: abre la búsqueda del partido en otra pestaña para
  consultar el resultado real (el navegador no puede leer Google
  automáticamente; el dato lo confirmas tú).
- ✏️ **Marcadores editables** en fase de grupos y eliminatorias.
- 🔄 **Tablas de grupo** que se recalculan solas (PJ, G, E, P, GF, GC, DG, Pts).
- 🏆 **Cuadro de llaves** (octavos → cuartos → semifinales → 3.º puesto → final)
  donde los ganadores avanzan solos, con penales para desempates.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
