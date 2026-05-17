# Changelog

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
