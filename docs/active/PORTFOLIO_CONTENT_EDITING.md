# Portfolio Content Editing

## Rule

Portfolio content is edited in backend content modules, not in frontend components.

Primary authored files:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

If public copy, links, project metadata, work history, AI metadata, or featured content changes, start there.

## What Lives Where

`profile.ts`

- name
- headline
- summary
- email
- social links
- external links

`about.ts`

- about-page heading and body
- current work
- current learning
- interests

`intro.ts`

- latest update
- fun fact
- featured read
- travel plans
- hero image path

`media.ts`

- creative/media cards
- embed URLs
- subtitles

`ai.ts`

- AI provider list
- provider labels/icons
- prompts/actions

`education.ts`, `experiences.ts`, `projects.ts`

- ordered public collection data

## Record Rules

Public collection items must include:

- `slug`
- `order`

That keeps routes stable and rendering deterministic.

## Links And Asset Paths

When editing:

- remove placeholder links like `#`
- omit invalid optional links instead of leaving empty strings
- use public asset paths rooted at `/portfolio/...`

Examples:

- profile image -> `/portfolio/profile/...`
- project thumbnail -> `/portfolio/projects/...`
- icon -> `/portfolio/icons/...`

## Frontend Constraints

Frontend sections can format the data, but they should not redefine the data.

Important frontend areas:

- `frontend/src/portfolio/sections/about`
- `frontend/src/portfolio/sections/intro`
- `frontend/src/portfolio/api/contracts.ts`

If the API shape changes, update frontend contracts and the affected section together.

## Build After Changes

Run:

```bash
cd backend
bun run build
```

Then:

```bash
cd frontend
bun run build
```

Frontend build will also refresh:

- `frontend/public/llms.txt`

## Live Widgets

These are not authored in the content modules:

- GitHub stats
- weather

They live behind runtime services and APIs instead:

- `backend/src/portfolio/services/githubStatsService.ts`
- `backend/src/portfolio/services/weatherService.ts`
- `frontend/src/portfolio/api/liveWidgetsApi.ts`

Do not hardcode live widget values into content files.
