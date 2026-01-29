## Agent 규칙 우선순위

규칙은 아래의 우선순위에 따라 적용한다.

1. **작업 중인 디렉토리에 가장 가까운 `agent.md`가 최우선이다.**  
   (하위 디렉토리의 규칙은 상위 디렉토리의 규칙을 덮어쓴다)
2. **적용 범위가 더 좁은 규칙이 넓은 범위의 규칙보다 우선한다.**
3. **문서에 명시적으로 작성된 규칙은 암묵적인 관례보다 우선한다.**
4. **리팩토링을 의도한 경우가 아니라면, 기존 코드에 이미 적용된 패턴이 문서보다 우선한다.**
5. **보안 및 운영 안정성과 관련된 규칙은 항상 최상위 우선순위를 가진다.**
6. **규칙 간 충돌이 발생하거나 혼란을 유발하는 경우, 해당 규칙은 `AGENTS.md`로 이동하여 공통 규칙으로 정리한다.**
7. **최종 판단 기준은 Pull Request 리뷰이며, 리뷰 과정에서 모호하다고 판단된 규칙은 이후 문서로 명확히 정리한다.**

---

> 한 줄 요약:  
> **가깝고, 구체적이고, 명시된 규칙이 우선이며 보안과 운영 규칙은 항상 최우선이다.**


<!-- # Repository Guidelines

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
- Example: `ALLOWED_ORIGINS=http://localhost:5173,http://<ip>:5173` for local CORS. -->
