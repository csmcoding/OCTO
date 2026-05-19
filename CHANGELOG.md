# Changelog

## [v0.3.0] — 2026-05-19
### Added
- Desktop utility actions: Open in Cursor, Reveal in files (dolphin --select),
  Open parent folder, Copy absolute path, Copy relative path
- Actions available in panel (top of scrollable area), context menu, and search
- Search quick-open button on active result row
- Context menu: colorTheme support, Reveal in parent for folders, Copy relative path
- Activity mode: git commit heatmap overlays, panel activity section, search badges
- Minimap activity halos for hot/warm/cool nodes
- Focus mode: dim unrelated nodes when one is selected
- Light theme (Future Glass): pearl scene, dark-anchor tentacles, themed chrome
- Activity legend colorTheme support
- `requirements.txt` — exact Python dependency versions
- `install.sh` — prereq checker, dependency installer, desktop entry creator
- `ALPHA-SHIP.md` — alpha ship checklist and run/install documentation
- `start.sh --prod` — production mode (builds frontend, serves via vite preview)
- `vite.config.js` preview proxy — same proxy config for dev and prod modes
### Fixed
- Panel action strip moved to top (immediately visible without scrolling)
- reveal action uses `dolphin --select` for both files and folders
- Context menu colors adapt to dark/light theme

## [v0.2.0] — 2026-05-17
### Added
- `start.sh` — one-command launcher, opens browser automatically
- Backend health check on frontend startup with auto-retry
- Auto-scan on API server startup (tree ready before first request)
- HiDPI pixel ratio fix for 2880x1800 display
- Window title: "octopus — <username>"

## [v0.1.0] — 2026-05-17
### Added
- Python backend: filesystem scanner, git signals, FastAPI API
- GET /tree, /subtree, /scan (SSE), /health, /settings, /open
- React + Three.js 3D radial scene with "you" root node
- Attention signals: gitDirty, gitUnpushed, noReadme,
  recentlyModified, dormant
- Stackable signal badges with priority color system
- Lazy subtree loading on folder click
- Scan button with live SSE progress
- Last-scanned timestamp
- Breadcrumb navigation with clickable crumbs
- Dimmed parent node visible behind current ring
- Hover tooltips on all nodes
- Single click = select, double click = drill / open
- Panel: Open in Cursor, Open in Dolphin, Open in Konsole
- Ctrl+K fuzzy search with keyboard navigation
- settings.json at ~/.config/octopus-dashboard/settings.json
