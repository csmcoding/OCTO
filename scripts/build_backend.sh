#!/usr/bin/env bash
# Build the Python backend as a self-contained sidecar binary using PyInstaller.
# Uses an isolated venv — never touches the system Python (PEP 668 safe).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$REPO_ROOT/build/.pyinstaller_venv"
OUTPUT_DIR="$REPO_ROOT/frontend/src-tauri/binaries"
TARGET_TRIPLE="x86_64-unknown-linux-gnu"
BINARY_NAME="octo-backend-$TARGET_TRIPLE"

echo "[build_backend] Building Python sidecar → $OUTPUT_DIR/$BINARY_NAME"

python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet \
    fastapi==0.136.1 uvicorn==0.47.0 pydantic==2.13.4 \
    pyinstaller

mkdir -p "$OUTPUT_DIR"

cd "$REPO_ROOT"

"$VENV_DIR/bin/pyinstaller" \
    --onefile \
    --name "$BINARY_NAME" \
    --distpath "$OUTPUT_DIR" \
    --workpath "$REPO_ROOT/build/pyinstaller_work" \
    --specpath "$REPO_ROOT/build" \
    --collect-all backend \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.loops.asyncio \
    --hidden-import uvicorn.protocols \
    --hidden-import uvicorn.protocols.http \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.http.h11_impl \
    --hidden-import uvicorn.protocols.websockets \
    --hidden-import uvicorn.lifespan \
    --hidden-import uvicorn.lifespan.on \
    --hidden-import uvicorn.lifespan.off \
    --hidden-import h11 \
    --hidden-import anyio \
    --hidden-import anyio._backends._asyncio \
    --hidden-import starlette \
    octo_backend_main.py

chmod +x "$OUTPUT_DIR/$BINARY_NAME"
echo "[build_backend] Done: $OUTPUT_DIR/$BINARY_NAME"
