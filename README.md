# vertivo-qc-api

Backend for the Vertivo Delivery QC app (Node 20+, Express 5, TypeScript, Supabase). Independent project —
it shares no code with the frontend (`vertivo-qc-web`); they only talk over HTTPS.

## 1. Supabase setup
1. Create a Supabase project.
2. In the SQL editor run, in order: `supabase/migrations/001_schema.sql` → `002_rls_lockdown.sql` → `003_storage.sql` → `004_seed_checklist.sql` (147 items).
3. Authentication → Users → **Add user** (email + password) for each inspector. **Disable public sign-ups** (Authentication → Providers → Email → "Allow new users to sign up" off).
4. Promote an admin (SQL editor): `update public.profiles set role = 'admin' where id = '<user uuid>';`

## 2. Run
```bash
cp .env.example .env     # fill in the three Supabase values + FRONTEND_ORIGIN
npm install
npm run dev              # http://localhost:4000
npm test                 # unit tests (no Supabase needed)
```
Production: `npm run build && npm start` behind HTTPS (set `NODE_ENV=production`, `TRUST_PROXY=1` behind one proxy).

## 3. Deploy to Render
This repository includes a Render Blueprint in `render.yaml`.

1. Push the project to GitHub, then in Render choose **New → Blueprint** and select this repository. Render will create the `vertivo-qc-api` web service.
2. In the service's **Environment** settings, add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `FRONTEND_ORIGIN`. Get the Supabase values from your project's API settings. Set `FRONTEND_ORIGIN` to the exact HTTPS origin of the deployed frontend, with no trailing slash (for example, `https://app.example.com`).
3. Keep the service-role key only in Render's environment settings. Do not put it in frontend configuration or commit it.
4. After deployment, verify the service's `/healthz` endpoint returns `{"ok":true}`.

The Blueprint uses `npm ci --include=dev && npm run build`, `npm start`, and `/healthz` as the health check. Render supplies `PORT`; the server listens on it automatically. `NODE_ENV=production` and `TRUST_PROXY=1` are configured by the Blueprint. Production auth cookies use `SameSite=None; Secure` so the frontend can call the API across origins; the API still requires credentialed requests, a matching CSRF cookie/header, and the configured frontend origin. If the browser blocks third-party cookies, use a custom domain and host both services on the same site (for example, `app.example.com` and `api.example.com`).

## 4. API (all routes except /auth/* and /healthz need a session)
| Method | Path | Notes |
|---|---|---|
| GET | /auth/csrf | returns CSRF token (also sets cookie) |
| POST | /auth/login · /auth/refresh · /auth/logout | login rate-limited |
| GET | /auth/me | |
| GET | /checklist | sections + items |
| GET/POST | /deliveries | list (own, or all for admin) / create |
| GET/PATCH | /deliveries/:id | PATCH needs `version` |
| DELETE | /deliveries/:id | admin only, soft delete |
| GET | /deliveries/:id/records | with short-lived photo URLs |
| PUT | /deliveries/:id/records/:itemId | autosave target; `version` for existing rows |
| POST/DELETE | /deliveries/:id/records/:itemId/photo | multipart field `photo` |
| GET | /deliveries/:id/stats | total / checked / issues / per section |
| GET | /deliveries/:id/export.csv · /backup.json | |

## 5. Security notes
- **Secrets**: `SUPABASE_SERVICE_ROLE_KEY` exists only here. `.env` is git-ignored; env is validated at boot and values are never logged.
- **DB lockdown**: RLS enabled with no policies + revoked grants → the anon key reads nothing. Storage bucket is private.
- **Sessions**: Supabase tokens live in `HttpOnly; Secure` cookies — never in JS or localStorage. Production uses `SameSite=None` for cross-origin frontend/API requests; development uses `SameSite=Strict`. Refresh cookie is scoped to `/auth`.
- **CSRF**: double-submit token + strict `Origin` check on every non-GET request. Frontend API calls must include credentials. If the browser blocks third-party cookies, deploy frontend and API on the same site (e.g. `app.example.com` + `api.example.com`).
- **AuthZ**: every delivery query is scoped to the caller (inspector → own; admin → all). Foreign IDs return 404. Admin-only delete.
- **Validation**: zod on all params/bodies, `.strict()` (no mass assignment), DB CHECK constraints as a second layer.
- **Uploads**: ownership checked before buffering, size cap, real-format check, EXIF/GPS stripped, re-encoded, server-generated paths, signed URLs (5 min).
- **Exports**: CSV cells beginning with `= + - @` are neutralised.
- **Concurrency**: optimistic `version` checks return 409 instead of silently overwriting.
- **Errors/logs**: generic client errors; pino redacts cookies, tokens, passwords; audit log for login, create/delete, exports, photo changes.
- **Hardening**: helmet, HSTS, single-origin CORS, rate limits, 50 KB JSON limit, `no-store` caching. Run `npm run audit` regularly and rotate keys if ever exposed.
