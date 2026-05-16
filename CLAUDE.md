# octopus-dashboard — CLAUDE.md

## Project overview
A 3D "octopus" file-architecture dashboard.
- Backend: Python script that scans ~/projects and writes tree.json
- Frontend: React + Three.js radial tree visualization

## Stack
- Backend: Python 3.11+, stdlib only (os, pathlib, subprocess, json)
- Frontend: React 18, Three.js, Vite
- Data contract: tree.json (nested node tree)

## Node schema (DO NOT change without updating both sides)
{
  "id": "string",
  "path": "string",
  "type": "file" | "folder",
  "gitDirty": boolean,
  "children": [node]
}

## Rules
- Never change the node schema without approval
- Backend writes to backend/tree.json only
- Frontend reads from frontend/public/tree.json only
- Tests must pass before any task is marked done
- Prefer small, reversible edits
- One task per agent session

## Test commands
- Backend: python -m pytest backend/tests/
- Frontend: npm test (from frontend/)

## Done condition
A task is done when tests pass and the handoff note is written.
