# OCTO — Alpha Ship Document

**Version:** 0.3.0  
**Status:** Alpha — single-user, Linux-first  
**Date:** 2026-05-19

---

## What is OCTO?

OCTO is a local 3D repository visualization and navigation tool. It scans your filesystem, builds a live 3D radial tree of your projects, and lets you explore, search, and act on nodes directly.

**Not a web app. Not a cloud tool.** Runs entirely on your machine — frontend + backend are local processes communicating over localhost.

---

## What is in the alpha?

| Feature | Status |
|---|---|
| 3D radial scene — files, folders, signal badges | ✅ |
| Attention signals — gitDirty, gitUnpushed, noReadme, recentlyModified | ✅ |
| Keyboard search (Ctrl+K) with fuzzy ranking | ✅ |
| Panel — node details, signals, preview, git diff | ✅ |
| Desktop actions — Open in Cursor, Reveal, Open parent, Copy path | ✅ |
| Activity mode — git commit heatmap overlays | ✅ |
| Minimap — 2D constellation overview | ✅ |
| Themes — dark, deepspace, light | ✅ |
| Onboarding — configure scan roots on first run | ✅ |
| Settings — depth, rotation, labels, sway, theme, activity | ✅ |
| Pin tray — pin important nodes | ✅ |

---

## Prerequisites

| Requirement | Min version | Notes |
|---|---|---|
| Linux (Ubuntu 22.04+) | — | Primary development platform; macOS may work but is untested |
| Python | 3.11+ | `python3 --version` |
| pip | any | `pip3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Cursor | any | Optional — for "Open in Cursor" actions |
| Dolphin | any | Optional — for "Reveal in files" actions |
| Konsole | any | Optional — for "Open in Konsole" actions |

**Install optional tools:**
```bash
sudo apt install dolphin konsole        # file manager + terminal
# Cursor: https://cursor.so
```

> **Note on Python packages (Ubuntu 23+):** Ubuntu uses PEP 668 which restricts pip
> system-wide installs. `install.sh` detects if packages are already present and skips
> pip if so. If packages are missing on a fresh machine, it will suggest either
> `--break-system-packages` or a venv. A venv is recommended for clean installs:
> ```bash
> python3 -m venv .venv && source .venv/bin/activate
> pip install -r requirements.txt
> source .venv/bin/activate && ./start.sh
> ```

---

## Install

```bash
git clone <repo-url> ~/octopus-dashboard
cd ~/octopus-dashboard
bash install.sh
```

`install.sh` will:
1. Verify prerequisites
2. Install Python deps (`pip3 install -r requirements.txt`)
3. Install Node deps (`npm install` in `frontend/`)
4. Write a `.desktop` entry to `~/.local/share/applications/octo.desktop`
5. Make `start.sh` executable

**Re-running `install.sh` is safe** — it is idempotent.

---

## Run

### Dev mode (default — Vite HMR, faster iteration)
```bash
cd ~/octopus-dashboard
./start.sh
```
Opens `http://localhost:5173` in your browser automatically.

### Production mode (pre-built frontend, slightly faster load)
```bash
cd ~/octopus-dashboard
./start.sh --prod
```
Runs `npm run build` first, then serves the pre-built frontend via `vite preview` on the same port.

### Manual (if you prefer two terminals)
```bash
# Terminal 1 — backend
cd ~/octopus-dashboard
python3 -m backend.api

# Terminal 2 — frontend
cd ~/octopus-dashboard/frontend
npm run dev        # dev mode
# or
npm run preview    # prod mode (requires prior npm run build)
```

---

## Configuration

Settings file: `~/.config/octopus-dashboard/settings.json`

Created automatically on first run. Edit to customize:

```json
{
  "scan_roots": ["/home/you/projects", "/home/you/work"],
  "editor": "cursor",
  "file_manager": "dolphin",
  "terminal": "konsole",
  "shallow_depth": 2
}
```

---

## Build / Test commands

```bash
# Frontend tests
cd ~/octopus-dashboard/frontend
npm test -- --run

# Backend tests
cd ~/octopus-dashboard
python3 -m pytest backend/tests/ -q

# Frontend build
cd ~/octopus-dashboard/frontend
npm run build

# Full check (from repo root)
cd ~/octopus-dashboard/frontend && npm test -- --run && \
  cd .. && python3 -m pytest backend/tests/ -q && \
  cd frontend && npm run build
```

---

## Known limitations

| Limitation | Notes |
|---|---|
| Linux-first | Tested on Ubuntu. macOS/Windows untested. |
| Cursor-specific | "Open in Cursor" hardcoded; VS Code/other editors need config change in settings.json. |
| Dolphin-specific | File manager actions assume Dolphin; other file managers need settings.json change. |
| Single user | No auth, no multi-user, no remote. Localhost only. |
| Git activity requires git | Activity mode only works in repos with git history. |
| Large repos | Caps at 120 children per node; very deep repos require manual depth drill-in. |
| Title hardcoded | `OCTO — uptonogood` — change `machine_id` in settings.json to rename. |

---

## Smoke test checklist

Run after every install or major change:

- [ ] `./start.sh` — both processes start, browser opens
- [ ] Onboarding shows if no scan roots exist
- [ ] 3D scene loads with your project nodes
- [ ] Hover a node — tooltip appears
- [ ] Click a node — panel opens with name, path, signals
- [ ] Double-click a folder — drills in
- [ ] Ctrl+K — search opens, results appear, Enter selects
- [ ] Panel "Open in Cursor" — file/folder opens in Cursor
- [ ] Panel "Reveal in files" (file) — parent folder opens in Dolphin with file selected
- [ ] Panel "Open parent" (folder) — parent folder opens in Dolphin
- [ ] Panel "Copy path" — clipboard contains absolute path
- [ ] Panel "Copy rel path" — clipboard contains relative path
- [ ] Settings ⚙ — opens, toggles work, theme changes apply
- [ ] Activity mode — toggle on, nodes show commit heatmap colors
- [ ] Light theme — scene and panels are readable in light mode
- [ ] Ctrl+C in terminal — both processes shut down cleanly

---

## Release checklist

Before handing to an alpha user:

- [ ] `bash install.sh` from a clean clone — no errors
- [ ] `./start.sh` opens browser and loads scene
- [ ] `./start.sh --prod` builds and runs successfully
- [ ] `npm test -- --run` — all tests pass
- [ ] `python3 -m pytest backend/tests/ -q` — all tests pass
- [ ] `npm run build` — no errors (chunk size warning is pre-existing, non-blocking)
- [ ] Smoke test checklist complete
- [ ] `CHANGELOG.md` up to date
- [ ] Scan roots in settings.json point to real paths on target machine

---

## Rollback / fix-fast notes

**Backend won't start:**
```bash
# Check if port is already in use
lsof -i :7823
# Kill it
kill $(lsof -ti :7823)
# Try again
python3 -m backend.api
```

**Frontend build fails:**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Settings reset:**
```bash
rm ~/.config/octopus-dashboard/settings.json
# Restart — onboarding will re-run
```

**Desktop entry removed:**
```bash
bash install.sh   # re-runs the desktop entry step
```

---

## Architecture (for alpha users who ask)

```
browser (localhost:5173)
    ↕ HTTP / proxy
frontend (React + Three.js, Vite)
    ↕ REST API (localhost:7823)
backend (FastAPI, Python)
    ↕ filesystem + git
your local repos
```

No cloud. No telemetry. No external network calls at runtime.
