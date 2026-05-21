# OCTO

OCTO is a desktop-friendly 3D file-architecture dashboard for exploring filesystem structure, activity, and code relationships. It combines a React/Vite frontend with a local Python backend and packages the app with Tauri v2 for native-style distribution.

## What it does

- Visualizes project and filesystem structure as an interactive dashboard.
- Surfaces activity, preview, and git-diff context for files and folders.
- Launches a local Python backend from the desktop app so the UI can talk to the project data directly.
- Supports packaged desktop builds for Linux through Tauri.

## Features

- 3D navigation for browsing folders and project structure.
- File and folder previews.
- Activity and diff views for understanding what changed.
- Local backend integration for fast, direct access to repository data.
- Tauri-based desktop packaging for release builds.

## Tech stack

- Frontend: React, Vite, Three.js.
- Backend: Python FastAPI.
- Desktop shell: Tauri v2.
- Package management: npm for the frontend, Cargo for the Tauri backend shell.

## Requirements

- Node.js 20+.
- npm.
- Python 3.
- Rust toolchain.
- Linux Tauri system dependencies for local desktop builds.

## Local development

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs in development mode and talks to the local backend during normal app usage.

## Production build

To build the web frontend:

```bash
cd frontend
npm run build
```

To build the frontend the way Tauri expects it:

```bash
cd frontend
npm run build:tauri
```

## Desktop build

OCTO uses Tauri v2 for desktop packaging.

```bash
cd frontend
npm run tauri:build
```

On Linux, the current packaged outputs are written under:

```text
frontend/src-tauri/target/release/bundle/
```

Current Linux release artifacts:

- `frontend/src-tauri/target/release/bundle/deb/octopus-dashboard_1.0.0_amd64.deb`
- `frontend/src-tauri/target/release/bundle/rpm/octopus-dashboard-1.0.0-1.x86_64.rpm`

## Backend launch

The Tauri shell starts the local Python backend at runtime. It looks for the project root, launches `python3 -m backend.api`, and shuts the process down when the desktop app exits.

## Releases

Use GitHub Releases for distributable installers and packaged builds.

- Linux: `.deb` and `.rpm`
- Windows: `.msi` or `.exe` installer builds from a Windows machine
- macOS: `.dmg` builds from a macOS machine

GitHub Packages is not the right distribution channel for OCTO installers.

## Platform notes

### Linux

Linux packaging is the primary release path and should be built on Linux with the required native headers installed.

### Windows

Windows builds must be produced on Windows. If you want the Tauri build script to work cleanly on Windows, use a portable environment-variable approach such as `cross-env` for the frontend build step.

### macOS

macOS builds must be produced on macOS with Xcode installed. For public distribution, Apple signing and notarization are required.

## Project structure

- `frontend/` — React/Vite application.
- `frontend/src-tauri/` — Tauri v2 desktop shell.
- `backend/` — local Python API.

## Contributing

Keep changes small, local, and packaging-safe. Avoid broad refactors unless a packaging blocker requires them.
## License

OCTO is licensed under the MIT License. See the `LICENSE` file for the full text.
