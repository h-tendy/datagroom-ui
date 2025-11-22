This repository is the React front-end for Datagroom (see top-level `README.md`). The goal of these instructions is to give an AI coding agent the minimal, actionable knowledge to be productive quickly.

Repository Highlights
- Frontend: React app created with `create-react-app` (older `react-scripts` v3). Entry: `src/index.js` -> `src/common/components/Root.js`.
- State: Redux with `src/common/helpers/store.js` (uses `redux-thunk` and `redux-logger` in development). Reducers live in `src/common/reducers/` and are combined in `src/common/reducers/index.js`.
- Services: HTTP calls are centralized under `src/common/services/` (e.g. `user.service.js`, `ds.service.js`). API base URL is set in these services based on `process.env.NODE_ENV`.
- Styling & assets: Static assets are under `public/` and `build/` (pre-built assets present). CSS is in `src/index.css` and `src/common/components/*`.

Developer Workflows (essential commands)
- Start dev server: `npm start` (runs `react-scripts start`).
- Build production bundle: `npm run build` (runs `react-scripts build`).
- Run tests: `npm test` (runs `react-scripts test`).

Project-specific conventions & gotchas
- API host: Services set `config.apiUrl` based on `process.env.NODE_ENV` inside each service file. In development some services set `localhost:8887`; confirm and centralize if changing back-end host.
- Credentials: Fetch requests use `credentials: 'include'` across services — the app expects cookie-based sessions from the gateway backend.
- Local storage: Authentication stores a `user` object (including token) in `localStorage` — `src/common/services/user.service.js` parses/stores this.
- Redux store: `src/common/helpers/store.js` wires Redux DevTools directly when present. Tests or CI may require mocking `window.__REDUX_DEVTOOLS_EXTENSION__`.
- Third-party forks: The project depends on several Git-hosted packages (for example `@datatraccorporation/markdown-it-mermaid` and a forked `react-tabulator`). When upgrading dependencies check these remote URLs in `package.json`.

Patterns to follow when editing
- Use existing services for API interactions. Example: to add a new user API call, extend `src/common/services/user.service.js` and expose it from `src/common/services/index.js`.
- Follow reducer/action pattern: actions live in `src/common/actions/` and reducers in `src/common/reducers/`. Action creators return functions (thunks) that call services and dispatch actions.
- Prefer small, focused changes: the codebase mixes modern and older React patterns (class components and functional). Match the surrounding file style.

Key files to inspect for context
- `package.json` — scripts & dependency pointers.
- `src/index.js` — app bootstrap.
- `src/common/helpers/store.js` — store configuration and middleware.
- `src/common/services/*.js` — API integrations and `credentials: 'include'` usage.
- `src/common/reducers/index.js` and `src/common/actions` — state shape and naming conventions.
- `public/` and `build/` — static assets and pre-built bundles.

Security and runtime notes
- CORS / cookies: Because requests use `credentials: 'include'`, make sure the backend sets CORS and cookies appropriately when testing locally.
- Avoid committing credentials: The repo uses plain `config.apiUrl` strings in services for development — do not add secrets to source.

When writing code or PRs
- Keep changes small and focused; reference which backend endpoint you used (gateway repo: `h-tendy/datagroom-gateway`).
- If changing API URLs or auth flow, update `src/common/services/*` and ensure session/cookie behavior still works (see `user.service.sessionCheck`).
- Run `npm start` and verify UI flows (login, dataset listing, editing) before proposing major changes.

Examples from codebase
- Authentication flow: `src/common/services/user.service.js` -> `login()` stores `user` in `localStorage`; `auth-header.js` (in helpers) reads `localStorage` to attach headers.
- Store configuration: `src/common/helpers/store.js` applies `redux-thunk` and `redux-logger` and enables Redux DevTools when present.

If you need more
- Ask for the backend `datagroom-gateway` URL and any environment variables the maintainer uses locally.
- Ask which browser and backend session settings the user expects for reproducing auth flows.

If this file already existed, I preserved repository-specific commands and added explicit references to files that demonstrate patterns and gotchas.
