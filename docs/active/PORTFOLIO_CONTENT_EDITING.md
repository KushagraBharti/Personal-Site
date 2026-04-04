# Portfolio Content Editing

## Canonical Files

Portfolio content is authored in backend TypeScript modules:

- `profile.ts`: identity, socials, external links
- `about.ts`: formatted About page content source
- `intro.ts`: hero copy, latest update, featured read, travel plans
- `media.ts`: film and creative media metadata
- `ai.ts`: AI provider metadata and prompt templates
- `education.ts`
- `experiences.ts`
- `projects.ts`

## Required Data Rules

Public collection records must include:

- `slug`
- `order`

These are required for:

- stable URLs
- deterministic ordering
- clean asset naming

## Links And Assets

- Remove placeholder links like `#`
- Omit invalid optional links instead of leaving empty strings
- Use absolute public paths rooted at `/portfolio/...`
- Keep project thumbnails in `frontend/public/portfolio/projects`
- Keep profile images in `frontend/public/portfolio/profile`

## After Editing Content

Run:

```bash
cd frontend
bun run build
```

This rebuilds the frontend and refreshes `frontend/public/llms.txt` from the backend canonical export flow.

Also run:

```bash
cd backend
bun run build
```

## Frontend Constraints

Frontend portfolio sections should fetch or render backend-owned data. Do not add new hardcoded portfolio content into the frontend unless the content is purely presentational and not authored data.
