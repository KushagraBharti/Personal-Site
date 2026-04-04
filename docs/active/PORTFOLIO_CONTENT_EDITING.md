# Portfolio Content Editing

## Canonical Editing Rule

Portfolio content is edited in backend content modules, not in frontend section components.

Primary authored files:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

If you need to change public copy, links, featured items, AI provider metadata, school/work history, or project metadata, start there.

## What Lives Where

`profile.ts`

- name
- headline
- summary
- email
- social links
- external links

`about.ts`

- About page heading/body content
- current projects
- current learning
- non-technical interests

`intro.ts`

- latest update
- fun fact
- featured read
- travel plans
- personal photo path

`media.ts`

- creative/film media cards
- embed URLs
- subtitles

`ai.ts`

- AI provider list
- provider icons and labels
- prompt templates
- provider actions

`education.ts`, `experiences.ts`, `projects.ts`

- ordered public collection data

## Record Rules

Public collection records must include:

- `slug`
- `order`

These are required for:

- stable detail routes
- deterministic rendering order
- asset naming consistency

## Links And Paths

When editing content:

- remove placeholder links like `#`
- omit invalid optional links instead of leaving empty strings
- use public asset paths rooted at `/portfolio/...`
- keep thumbnails and images aligned with files in `frontend/public/portfolio/...`

Examples:

- profile image -> `/portfolio/profile/...`
- project thumbnail -> `/portfolio/projects/...`
- media asset -> `/portfolio/media/...`

## Frontend Constraints

The frontend may format portfolio data, but it should not become an alternate content source.

Current intent:

- `frontend/src/portfolio/sections/about` controls About layout
- `frontend/src/portfolio/sections/intro` controls hero layout, floating cards, motion, and interactions
- authored text and metadata should continue to come from backend content files

The frontend currently keeps local API type definitions in:

- `frontend/src/portfolio/api/contracts.ts`

Those types should be updated if the API response shape changes, but they are not the content source.

## Build And Verification After Editing

After portfolio content changes, run:

```bash
cd backend
bun run build
```

Then run:

```bash
cd frontend
bun run build
```

Frontend build will also refresh:

- `frontend/public/llms.txt`

via:

- `frontend/scripts/sync-portfolio-exports.ts`

## Content Changes That Also Need Code Changes

If you change portfolio data shape, you may also need to update:

- `backend/src/portfolio/contracts/portfolio.ts`
- `backend/src/portfolio/services/portfolioSnapshotService.ts`
- `frontend/src/portfolio/api/contracts.ts`
- the affected frontend section or widget

Do not change only one side of the API shape.

## Live Widgets Are Separate

These are not authored in the content modules:

- GitHub stats
- weather
- LeetCode stats

They are runtime integrations handled through:

- `backend/src/portfolio/services/githubStatsService.ts`
- `backend/src/portfolio/services/weatherService.ts`
- `backend/src/portfolio/services/leetcodeService.ts`

and consumed through:

- `frontend/src/portfolio/api/liveWidgetsApi.ts`

Do not try to hardcode live widget values into portfolio content files.
