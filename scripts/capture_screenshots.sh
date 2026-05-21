#!/usr/bin/env bash
# Guided screenshot capture for OCTO docs.
# Run this in a terminal alongside the OCTO app.
# For each shot: follow the instructions, click the OCTO window,
# then press Enter — the screenshot fires after a 2-second delay.
set -euo pipefail

OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docs/images"
mkdir -p "$OUT"

capture() {
    local name="$1"
    local dest="$OUT/$name"
    sleep 2
    spectacle -b -a -o "$dest" 2>/dev/null
    if [ -f "$dest" ]; then
        echo "  ✓ saved → docs/images/$name"
    else
        echo "  ✗ spectacle failed — trying fullscreen fallback"
        spectacle -b -f -o "$dest" 2>/dev/null && echo "  ✓ saved (fullscreen) → docs/images/$name"
    fi
}

prompt_and_capture() {
    local name="$1"
    local instruction="$2"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Next: $name"
    echo "  → $instruction"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -n "  Press Enter when ready (then click OCTO window within 2s)..."
    read -r
    capture "$name"
}

echo ""
echo "OCTO screenshot capture"
echo "The app must be running and visible on screen."
echo ""

prompt_and_capture "hero.png" \
    "Default mode, dark theme. Let the scene settle — several repo nodes visible. No panels open."

prompt_and_capture "activity-mode.png" \
    "Press T in OCTO to activate Activity mode. Commit heatmap colors should appear on nodes."

prompt_and_capture "architecture-mode.png" \
    "Press A in OCTO to activate Architecture mode (deactivates Activity). Cluster colors visible, legend bottom-left."

prompt_and_capture "panel.png" \
    "Click any folder node to open the right panel. File info and action buttons should be visible."

prompt_and_capture "search.png" \
    "Press Ctrl+K to open the fuzzy search panel. Type a few characters so results show."

prompt_and_capture "settings.png" \
    "Press Esc to close search, then press S to open the Settings panel."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! Screenshots saved to docs/images/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh "$OUT"
