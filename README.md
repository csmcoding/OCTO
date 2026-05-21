# OCTO

A local Linux desktop app that visualizes your project directories as an interactive 3D scene. Scan your filesystem, spot git-dirty repos at a glance, and navigate your projects with a radial node graph.

## Install from GitHub Releases

The latest packaged release is **[v1.1.0](https://github.com/csmcoding/OCTO/releases/tag/v1.1.0)**.
Download the installer for your distro from the release page.

**Ubuntu / Debian**
```bash
sudo dpkg -i octopus-dashboard_1.0.0_amd64.deb
```

**Fedora / RHEL**
```bash
sudo rpm -i octopus-dashboard-1.0.0-1.x86_64.rpm
```

**Requirement:** Python 3 with `fastapi` and `uvicorn` must be available on your system.

```bash
pip install fastapi uvicorn
# or: pip install -r requirements.txt  (from a repo clone)
```

**If the app can't find the backend** after install, set `OCTO_ROOT` to the repo directory:
```bash
OCTO_ROOT=/path/to/octopus-dashboard octo
```

The packaged app opens as a native window — no browser required. It auto-starts the Python backend on launch and shuts it down on close.

---

## Run from source

```bash
git clone https://github.com/csmcoding/OCTO.git
cd OCTO
bash install.sh      # checks prerequisites, installs Python + Node deps
./start.sh           # dev mode (Vite dev server + backend)
./start.sh --prod    # production mode (built frontend + backend)
```

---

## Features

- 3D radial scene — folders and files as nodes, color-coded by git status
- Signals: dirty, unpushed, no readme, dormant — visible at a glance
- Activity mode — git commit heatmap overlaid on the scene
- Architecture mode — 9 semantic cluster categories with distinct colors
- File preview and git diff panel on node select
- Actions: open in editor, reveal in file manager, open terminal, copy path
- Fuzzy search with keyboard navigation (`Ctrl+K`)
- Pin tray for bookmarking frequently visited nodes
- Light, dark, and deep-space themes
- Touch orbit, pinch zoom, single-finger tilt

---

## Configuration

Settings are created on first run at `~/.config/octopus-dashboard/settings.json`.
Edit `scan_roots` to point at the directories you want scanned.

```json
{
  "scan_roots": ["/home/you/projects"],
  "editor": "code",
  "terminal": "bash",
  "file_manager": "xdg-open"
}
```

---

## Known limitations

- **Linux only.** No Windows or macOS packages are currently built.
- **AppImage not included.** Excluded due to a linuxdeploy incompatibility on some hosts; `.deb` and `.rpm` are the supported formats.
- **Python not bundled.** The packaged app shells out to `python3` — FastAPI and uvicorn must be installed separately.

---

## Building the desktop package from source

```bash
# Linux system deps (one-time)
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev

# Rust toolchain (one-time)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

cd frontend
npm install
npm run tauri:build
# Output: src-tauri/target/release/bundle/deb/  and  bundle/rpm/
```

---

## License

MIT — see [LICENSE](LICENSE).
