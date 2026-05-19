#!/usr/bin/env bash
# OCTO install script — checks prerequisites and sets up the environment.
# Run once on a fresh clone: bash install.sh
# Safe to re-run; no destructive actions.
set -e

REPO="$(cd "$(dirname "$0")" && pwd)"
OK=1

echo "🐙 OCTO install check"
echo "   Repo: $REPO"
echo ""

# ── Prerequisites ────────────────────────────────────────────────────────────

check_cmd() {
  local cmd="$1" label="$2" hint="$3"
  if command -v "$cmd" &>/dev/null; then
    echo "  ✓  $label ($(command -v "$cmd"))"
  else
    echo "  ✗  $label — not found"
    echo "     → $hint"
    OK=0
  fi
}

echo "Checking prerequisites..."
check_cmd python3   "Python 3"  "Install via: sudo apt install python3"
check_cmd pip3      "pip3"      "Install via: sudo apt install python3-pip"
check_cmd node      "Node.js"   "Install via: https://nodejs.org or nvm"
check_cmd npm       "npm"       "Included with Node.js"
check_cmd cursor    "Cursor"    "Download from https://cursor.so — optional, needed for 'Open in Cursor'"
check_cmd dolphin   "Dolphin"   "Install via: sudo apt install dolphin — optional, needed for 'Reveal in files'"
check_cmd konsole   "Konsole"   "Install via: sudo apt install konsole — optional, needed for 'Open in Konsole'"

echo ""

# ── Python version ───────────────────────────────────────────────────────────

PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
if [[ $PY_MAJOR -ge 3 && $PY_MINOR -ge 11 ]]; then
  echo "  ✓  Python $PY_VER (>= 3.11 required)"
else
  echo "  ✗  Python $PY_VER — requires 3.11+"
  OK=0
fi

# ── Node version ─────────────────────────────────────────────────────────────

NODE_VER=$(node --version 2>/dev/null | tr -d 'v' || echo "0")
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [[ $NODE_MAJOR -ge 18 ]]; then
  echo "  ✓  Node.js v$NODE_VER (>= 18 required)"
else
  echo "  ✗  Node.js v$NODE_VER — requires 18+"
  OK=0
fi

echo ""

if [[ $OK -eq 0 ]]; then
  echo "✗ Prerequisites missing — fix the above and re-run install.sh"
  exit 1
fi
echo ""

# ── Install Python dependencies ───────────────────────────────────────────────

echo "Checking Python dependencies..."
if python3 -c "import fastapi, uvicorn, pydantic" &>/dev/null; then
  echo "  ✓  Python dependencies already installed (fastapi, uvicorn, pydantic)"
else
  # Try normal install first; fall back with guidance if externally-managed
  if pip3 install -r "$REPO/requirements.txt" --quiet 2>/dev/null; then
    echo "  ✓  Python dependencies installed"
  elif pip3 install -r "$REPO/requirements.txt" --quiet --break-system-packages 2>/dev/null; then
    echo "  ✓  Python dependencies installed (--break-system-packages)"
  else
    echo "  ⚠  Could not install Python deps automatically."
    echo "     Option A (venv — recommended):"
    echo "       python3 -m venv $REPO/.venv"
    echo "       source $REPO/.venv/bin/activate"
    echo "       pip install -r requirements.txt"
    echo "       # Then run: source .venv/bin/activate && ./start.sh"
    echo "     Option B (system-wide, if you accept the risk):"
    echo "       pip3 install -r requirements.txt --break-system-packages"
    OK=0
  fi
fi
echo ""

# ── Install Node dependencies ─────────────────────────────────────────────────

echo "Installing Node dependencies..."
cd "$REPO/frontend" && npm install --silent
echo "  ✓  Node dependencies installed"
echo ""

# ── Desktop entry ─────────────────────────────────────────────────────────────

DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/octo.desktop"
ICON="$REPO/frontend/public/favicon.svg"

mkdir -p "$DESKTOP_DIR"
cat > "$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=OCTO
GenericName=Repository Explorer
Comment=3D repository visualization and navigation tool
Exec=zsh -c "cd $REPO && ./start.sh"
Icon=$ICON
Terminal=false
Categories=Development;
Keywords=git;code;repository;visualization;
StartupWMClass=octopus-dashboard
DESKTOP

if command -v update-desktop-database &>/dev/null; then
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi
echo "  ✓  Desktop entry written to $DESKTOP_FILE"
echo ""

# ── Make start.sh executable ──────────────────────────────────────────────────

chmod +x "$REPO/start.sh"
echo "  ✓  start.sh is executable"
echo ""

# ── Done ──────────────────────────────────────────────────────────────────────

echo "✓ OCTO is ready."
echo ""
echo "  Run:  cd $REPO && ./start.sh"
echo "  Prod: cd $REPO && ./start.sh --prod"
echo ""
