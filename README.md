# OCTO — 3D Repository Dashboard

A local desktop tool that visualizes your project directories as an interactive 3D scene. Scan your filesystem, spot git-dirty repos at a glance, and navigate your projects with a radial node graph.

## What it does

- Scans configured root directories and builds a live node tree
- Renders projects as 3D spheres — color-coded by git status, activity, and architecture
- Panel shows signals (dirty, unpushed, no readme, dormant), file preview, and git diff
- Actions: open in editor, reveal in file manager, open terminal, copy path
- Modes: tree, activity (commit heatmap), architecture (cluster classification)
- Fuzzy search with keyboard navigation (Ctrl+K)
- Light, dark, and deep-space themes

## Stack

- Backend: Python 3.11+, FastAPI, stdlib only for filesystem scanning
- Frontend: React 18, Three.js, Vite
- Desktop: Tauri v2 (optional — wraps the app as a native `.deb`/`.rpm`)

## Quick start

```bash
# Install dependencies
bash install.sh

# Run (dev mode)
./start.sh

# Run (production build)
./start.sh --prod
```

The backend starts on `http://localhost:7823` and the frontend opens automatically in your browser.

## Configuration

Settings are stored in `~/.config/octopus-dashboard/settings.json` and created on first run. Edit `scan_roots` to point at your project directories.

```json
{
  "scan_roots": ["/home/you/projects"],
  "editor": "code",
  "terminal": "bash",
  "file_manager": "xdg-open"
}
```

## Desktop packaging (Linux)

```bash
cd frontend
npm run tauri:build    # produces .deb and .rpm in src-tauri/target/release/bundle/
```

## License

MIT
