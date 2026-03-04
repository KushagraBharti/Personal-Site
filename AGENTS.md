# AGENTS.md

## Package Manager Policy

This repository is **Bun-only**.

- Use `bun install` to install dependencies.
- Use `bun run <script>` for all scripts.
- Do not use `npm`, `npx`, `yarn`, or `pnpm` commands in this repo.
- Do not add `package-lock.json` or `yarn.lock`.

## Common Commands

### Frontend
```bash
cd frontend
bun install
bun run dev
bun run build
bun run lint
```

### Backend
```bash
cd backend
bun install
bun run dev
bun run build
bun run start
```
