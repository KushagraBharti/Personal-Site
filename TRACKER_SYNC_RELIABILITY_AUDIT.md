# Tracker Sync Reliability Audit

## 1) Date-only vs timed task behavior is inconsistent and can break timezone correctness
- `hooks.ts` and `TasksHubTracker.tsx` implement different `toIsoOrNull` logic.
- Risk: date-only tasks can be converted into timed tasks unintentionally, causing drift when traveling/timezone changes.

## 2) Timezone auto-seeding may incorrectly assign timezone to date-only tasks
- In `hooks.ts`, startup seeding fills `due_timezone` for tasks missing it, based on current timezone.
- If date-only tasks are included, they should not be treated as zoned timed events.

## 3) `sync-now` still does queue + immediate processing in one request (timeout risk under load)
- `calendarRoutes.ts` ran queueing plus immediate `processCalendarSyncJobs` inline.
- Better than before, but still vulnerable to slow Google API calls and serverless duration limits.

Use this pattern:
- `POST /sync-now` only enqueues and returns immediately with a `runId`.
- Worker processes jobs in background and writes per-run stats (`processed`, `failed`, failure reasons).
- UI polls `GET /api/private/calendar/sync-run/:runId` until run is done.
- UI shows final result exactly like now, including failed job IDs/messages.
- So you still see pass/fail, but you avoid 504 timeouts and flaky "did it finish before function timeout" behavior.

## 4) Reconnect frequency may still be caused by Google OAuth app mode/config, not only code
- Code uses offline tokens, but if OAuth consent is in Testing mode, Google may expire refresh tokens in ~7 days.
- This matches your "keeps reconnecting" symptom.
- Every 7 days is acceptable for now, but production mode guidance is documented below.

### Google OAuth Production Mode Guidance (official docs)
- OAuth token expiration / testing-mode behavior:
  - https://developers.google.com/identity/protocols/oauth2#expiration
- OAuth web-server flow (offline access + refresh token behavior):
  - https://developers.google.com/identity/protocols/oauth2/web-server
- OAuth consent screen setup:
  - https://developers.google.com/workspace/guides/configure-oauth-consent

High-level production-mode steps:
1. Open Google Cloud Console -> APIs & Services -> OAuth consent screen.
2. Ensure app information, authorized domains, and support email are complete.
3. Move publishing status from Testing to In production.
4. Reconnect Google once in Tracker to mint a stable refresh token.
5. Keep scopes minimal and only request what Tracker needs.

## 5) Backend linting guardrail is missing
- `backend/package.json` has no lint script.
- Static checks are weaker in critical sync/auth code.

## 6) Frontend lint debt in tasks/tracker code
- `bun run lint` in frontend reports `any` and hook dependency warnings.
- Not immediate runtime breakage, but increases regression risk.

## 7) Build warnings for cursor assets
- Frontend build warns unresolved `custom-cursor*.svg` at build-time (runtime fallback).
- Can become brittle across deployments.
- Resolution direction: remove all custom-cursor behavior and keep default cursor.
