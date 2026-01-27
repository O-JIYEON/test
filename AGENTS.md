# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Express + MySQL API server (`index.js`) and SQL helpers in `backend/sql/`.
- `frontend/`: Vite + React app. Source is in `frontend/src/` (pages, components, styles).
- Root `AGENTS.md`: contributor guide (this file).

## Build, Test, and Development Commands
- `cd backend && pnpm dev` — run API server with nodemon (auto-reload on changes).
- `cd backend && pnpm start` — run API server with Node.
- `cd frontend && pnpm dev` — run Vite dev server.
- `cd frontend && pnpm build` — build production assets.
- `cd frontend && pnpm preview` — preview production build.

## Coding Style & Naming Conventions
- JavaScript/JSX uses 2-space indentation.
- Prefer functional React components and hooks.
- File naming: `PascalCase` for React components, `camelCase` for utilities.
- Keep CSS class names in BEM-ish style (e.g., `dashboard__overview-card`).
- No automated formatter configured; keep diffs minimal and consistent with existing files.

## Testing Guidelines
- No automated test framework is configured.
- If adding tests, document the tool and add run instructions here.

## Commit & Pull Request Guidelines
- Commit messages in history are short and descriptive (often Korean). Follow that style, e.g. `대시보드 - 수주액 차트 수정`.
- PRs should include: summary of changes, screenshots for UI changes, and notes on manual testing.

## Configuration Tips
- Backend expects MySQL connection settings in `backend/index.js`.
- Frontend talks to the backend on port `5001`, Vite dev runs on `5173`.
