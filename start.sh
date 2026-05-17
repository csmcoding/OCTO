#!/usr/bin/env zsh
set -e

REPO="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=7823
FRONTEND_PORT=5173
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo "\n⏹  Shutting down..."
  [[ -n "$BACKEND_PID" ]]  && kill "$BACKEND_PID"  2>/dev/null
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "🐙 Starting octopus-dashboard..."

# Start backend
cd "$REPO"
python3 -m backend.api &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be healthy (max 15s)
echo -n "   Waiting for backend"
for i in $(seq 1 30); do
  if curl -s "http://localhost:$BACKEND_PORT/health" \
       | grep -q '"ok"'; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 0.5
  if [[ $i -eq 30 ]]; then
    echo "\n✗ Backend failed to start. Check logs."
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
  fi
done

# Start frontend
cd "$REPO/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready (max 10s)
echo -n "   Waiting for frontend"
for i in $(seq 1 20); do
  if curl -s "http://localhost:$FRONTEND_PORT" \
       | grep -q "html"; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 0.5
done

# Open browser
echo "   Opening browser..."
xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true

echo "✓ octopus-dashboard running"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Press Ctrl+C to stop\n"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
