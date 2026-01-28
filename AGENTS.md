# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + Vite UI.
  - `frontend/src/pages/` for page-level screens (e.g., `dashboard`, `deals`, `leads`).
  - `frontend/src/components/` for shared UI (e.g., `Sidebar`, `TopHeader`, dialogs).
  - `frontend/src/assets/icon/` for menu SVG icons.
  - `frontend/src/index.css` holds global styles and theme tokens.
- `backend/`: Express API.
  - `backend/index.js` contains routes, DB access, and app setup.
  - `backend/sql/` has schema and seed SQL files.

## Architecture Overview
API (Express, `backend/index.js`):
- Health: `GET /health`
- Overview: `GET /api/overview`
- CRUD: `/api/users`, `/api/projects`, `/api/customers`, `/api/customer-contacts`,
  `/api/leads`, `/api/deals`, `/api/activity-logs`, `/api/lookup-categories`, `/api/lookup-values`
  (standard `GET/POST/PUT/DELETE` where applicable).

Core DB tables (see `backend/sql/`):
- `users`, `project`, `customers`, `customer_contacts`
- `lead`, `deal`, `activity_logs`
- `lookup_categories`, `lookup_values` (settings/options)

## Build, Test, and Development Commands
Frontend:
- `cd frontend && npm install`
- `npm run dev` — start Vite dev server.
- `npm run build` — production build.
- `npm run preview` — preview build output.

Backend:
- `cd backend && npm install`
- `npm run dev` — start API with nodemon on `:5001`.
- `npm run start` — start API without watch.

## Coding Style & Naming Conventions
- JavaScript/JSX with 2‑space indentation.
- Prefer descriptive component names in `PascalCase` and hooks in `camelCase`.
- CSS classes follow BEM‑like naming (e.g., `.dashboard__table--scroll`).
- No formatter/linter configured; keep changes consistent with nearby code.

## Testing Guidelines
- No automated test framework is configured.
- Validate manually in browser and via API calls; note any manual steps in PRs.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commit prefixes (e.g., `feat:`, `fix:`, `chore:`, `style:`).
- PRs should include:
  - A short summary of changes.
  - Screenshots for UI changes.
  - Any SQL migrations or seed data added.

## Release/Deploy
- No automated deployment scripts are included.
- Typical manual flow:
  - Build UI: `cd frontend && npm run build`
  - Serve UI output from `frontend/dist/` (static hosting or web server).
  - Run API: `cd backend && npm run start` (or `pm2`/systemd in production).
- Ensure `ALLOWED_ORIGINS` is set for the deployed frontend URL.

## Configuration Tips
- Backend DB config via environment variables:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, optional `ALLOWED_ORIGINS`.
- Example: `ALLOWED_ORIGINS=http://localhost:5173,http://<ip>:5173` for local CORS.
