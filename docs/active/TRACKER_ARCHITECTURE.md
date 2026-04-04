# Tracker Architecture

## Scope

The tracker is the private application surface. This refactor keeps tracker behavior stable while reorganizing the codebase into clearer boundaries.

Frontend tracker layout:

- `frontend/src/tracker/pages`
- `frontend/src/tracker/shell`
- `frontend/src/tracker/modules`
- `frontend/src/tracker/shared`
- `frontend/src/tracker/styles`

Backend tracker layout:

- `backend/src/tracker/finance`
- `backend/src/tracker/calendar`
- `backend/src/tracker/cron`
- `backend/src/tracker/shared`

## Frontend Modules

Current tracker modules:

- `tasks`
- `tasks-hub`
- `pipeline`
- `finance`

Tracker shell registration lives in:

- `frontend/src/tracker/shell/registry.ts`

## Backend Mounting

Tracker routes mount under:

- `/api/private`

Current subtrees:

- `/api/private/finance`
- `/api/private/calendar`
- `/api/private/cron`

## Refactor Rule

Tracker changes in this pass are structural only. If you need to change behavior, treat that as a separate task after the architecture is stable and verified.
