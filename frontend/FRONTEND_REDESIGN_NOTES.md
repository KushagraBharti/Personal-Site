## Portfolio OS Frontend Redesign Notes

### Overview
- The desktop experience lives under `src/app/desktop`. `Desktop.tsx` renders the wallpaper, icons, window layer, taskbar, and start menu.
- Application metadata is centralised in `src/app/routes/appRegistry.tsx`. Each `AppDefinition` registers the React component, default window sizing, and routable slugs.
- Window state/state transitions are managed by a Zustand store in `src/app/wm/store.ts`. The store persists open windows (except project detail views) to `localStorage`.
- API access is encapsulated in `src/lib/services/*`. React Query hooks (`src/hooks/usePortfolioQueries.ts`) wrap the service functions to provide caching and status flags.

### Window Manager Essentials
- `WindowState` tracks geometry, z-order, minimised/maximised flags, and optional payload metadata.
- The store exposes helpers (`useWindowActions`) for create/focus/minimise/maximise/close. `createWindow` accepts a deterministic `windowId` so repeated open actions target the same instance.
- `WindowLayer` renders windows in z-order. Each window delegates chrome interactions to `components/window/Window.tsx`, which handles drag, resize, and focus.
- Dragging and resizing respect viewport bounds (`src/app/wm/layout.ts`). Maximise toggles fill the available workspace.

### Routing
- `RouteBridge.tsx` listens to the React Router location and opens windows that match `/app/<appId>` routes. Deep links like `/app/projects/:id` hydrate both the explorer and detail windows with the correct payload.
- Desktop UI never unmounts on navigation; routes only influence window state.

### Applications
- **Projects** (`components/apps/Projects`): Explorer supports search, tag filtering, grid/list views, and double-click to open detail windows. Details hydrate from the same cached query via slug lookups.
- **Experience / Education / About**: Render API-backed timelines and cards with light styling.
- **Weather**: Provides search, geolocation, and refresh controls. The system tray reuses the same query for current conditions.
- **Stats**: Aggregates GitHub/LeetCode data plus live session metrics (open windows, uptime).
- **Settings**: Wires to the ThemeProvider (`src/app/providers/ThemeProvider.tsx`) to control theme mode, accent, wallpaper, icon visibility, and performance mode. Preferences persist between sessions.
- **Terminal**: Simple command interpreter with commands for listing projects, opening apps, theming, cycling wallpapers, and showing metadata. Commands leverage store actions and theme helpers.

### Extending & Customising
- **Add a new app**: Register it in `appRegistry.tsx` with a unique `AppId`, default size, and component. Implement the component under `components/apps/<Name>` and optionally add routes (`routes` array) for deep linking.
- **New commands**: Update `TerminalApp.tsx` to parse the command and call the relevant store or theme actions. Follow the existing pattern by appending output entries to the history array.
- **Keyboard shortcuts**: `Desktop.tsx` uses `useHotkeys` to register global combos (window cycling, closing, start toggle, terminal). Extend the handler list for new shortcuts.
- **Performance tweaks**: `performanceMode` toggles a `data-performance="reduced"` attribute on `<html>` that disables shadows/backdrop blur (see `styles/global.css`). Additional styling changes can key off the same data attribute.

### Preferences & Persistence
- `ThemeProvider` stores preferences (`theme`, `accent`, `wallpaper`, `showDesktopIcons`, `performanceMode`) in `localStorage` (`portfolio-os::preferences`). Resetting preferences restores default values.
- Window positions are persisted by `Zustand` middleware, excluding project detail windows to avoid stale payloads.

### Developer Workflow
- Run `yarn build` to compile TypeScript and bundle with Vite.
- All primary entry points live in `src`; no backend changes were made. APIs continue to respect `VITE_API_BASE_URL`.
