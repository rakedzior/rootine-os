# Rootine OS — Handoff / Context for a new chat (2026-06-19)

Paste this into a fresh session to continue. Read `AUDIT.md` alongside it.

## What the project is
**Rootine OS** — a personal "life operating system" (9 modules: Start, Sport, Dieta,
Finanse, Cele, Biuro, Podróże, Notatki, Praca). Polish-language UI. Targets Windows
desktop + iPhone (PWA). Holds sensitive personal/financial data, so security matters.

## Stack & repo layout
- App lives in **`apps/web`** (React 18 + TS + Vite + React Router + TanStack Query +
  Zustand + Supabase JS). **The repo root has NO package.json.**
- **Run it:** `cd apps/web && npm install && npm run dev` (Vite, http://localhost:5173).
  `apps/web/.env` already holds `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Root also has: SQL in `supabase/migrations` (0001–0013), Edge Functions in
  `supabase/functions`, old static HTML prototypes (`*.html` — reference only, not used),
  `ROADMAP.md` (out of date — overstates completion), `AUDIT.md` (accurate, read it).

## ⭐ The single most important fact (from the audit)
**The app is a fully-styled prototype running entirely on browser `localStorage`**
(`src/store/localStore.ts`, Zustand + persist). The **Supabase backend AND the client
data layer (`src/features/*/api.ts` + `hooks.ts`) are fully built but the UI does not
use them.** Only **Finanse** has begun bridging. So data is per-browser, not synced,
not RLS-protected. The Start dashboard is additionally part-mock (`MOCK_HABITS`,
`MOCK_EVENTS`). See the status matrix in `AUDIT.md`.

## Design system (this session's work)
- One token-driven stylesheet: `src/styles/styles.css` (imported in `main.tsx` with
  `auth.css`). The other `src/styles/*.css` files are DEAD (not imported).
- **10 themes** via `data-theme` on `<html>`: beige (`:root`/`light`), graphite (`dark`),
  cool (`green`), plus `coastal, aqua, lavender, coral, steel, magenta, mono`.
  Switching: `src/lib/theme.ts` + the avatar dropdown in `src/components/layout/Topbar.tsx`
  (`Theme` union type + `THEMES` array list every theme). Persists to localStorage key
  `rootine-theme`.
- **Fonts:** Space Grotesk (display) + Inter (body) + IBM Plex Mono (labels), all via
  one Google Fonts `@import`. (A Helvetica-Neue light-weight experiment was tried and
  reverted — user found it odd.)
- Accent is **per-theme** (`--acc`, `--acc-solid`, `--on-acc`, etc.); `--success` is
  decoupled so green = positive only. Components are class-based (`.card`, `.btn-*`,
  `.input`, `.badge`, `.sub-tabs`, `.modal`, `.stat-card`, `.page-header`, `.empty-state`,
  `.skeleton`, etc.) plus heavy token-driven inline styles in screens.
- Mobile nav (`MobileBottomNav.tsx`) has a working "More" bottom-sheet.

## Backend (built, mostly unwired to UI)
- Migrations 0001–0013 cover every module with RLS. Auth: email+password, OAuth
  scaffolding, email confirmation, MFA/TOTP. Edge functions: Google + Strava OAuth,
  Strava webhook, GDPR data-export, account deletion. Integrations UI is in Settings;
  it just needs external API credentials (Google Cloud, Strava).

## Next steps (agreed plan)
1. **Bridge UI → Supabase, module by module.** Hooks already exist; `localStore` types
   mirror the DB schema, so it's "swap `useLocalStore` for the feature `hooks.ts`, add
   loading/empty/error states, drop mocks." Suggested order: **Dieta** (start here, clean
   reference) → finish **Finanse** → Notatki → Cele+tasks+habits (also un-mocks Start) →
   Sport → Podróże/Praca/Biuro → Start. Decide whether to one-time import existing
   localStorage data per module (user leaning: discard prototype data is OK unless said).
2. Document **Storage** for Biuro (private `documents` bucket + upload).
3. Activate **Google Calendar + Strava** (needs user's API keys).
4. **Security hardening:** encrypt document numbers (pgsodium/Vault), step-up MFA for
   export/vault, audit-log coverage. Add Playwright e2e.
5. Dead code to delete: `features/*/{FinancePulse,HabitList,GoalProgress,TaskList}.tsx`
   (built but never rendered).

## Git / environment gotchas
- **Uncommitted right now:** the redesign (styles.css, theme.ts, Topbar, MobileBottomNav,
  auth.css) + pre-existing WIP edits across ~9 module screens + `common/index.tsx`.
  Commit on the real machine: `cd C:\dev\rootine-os && git commit -am "feat(ui): redesign + 10 themes"`.
- Build needs the platform rollup native binary; if Vite errors on it, do a clean
  `rm -rf node_modules package-lock.json && npm install`.
- If continuing inside the Cowork/Claude-Code sandbox: its filesystem **truncates large
  file-tool writes and corrupts git lock/index files** — write big files via bash
  heredoc (`cat > f <<'EOF'`), and run typecheck via `npx tsc --noEmit` (vite build can't
  run there). Commit/build on the real machine.

## Verification commands
- `cd apps/web && npx tsc --noEmit` (type safety — must stay green)
- CSS sanity: `node -e "require('postcss').parse(require('fs').readFileSync('src/styles/styles.css','utf8'))"`
