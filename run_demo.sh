#!/usr/bin/env bash
set -e

echo "========================================================"
echo "       esteRoute Prototype Local Launcher"
echo "             Local Fallback Environment"
echo "========================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Verify Backend Environment File
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo "[ERROR] backend/.env not found!"
    echo "Please make sure backend/.env is configured with your Supabase credentials."
    exit 1
fi

# 2. Check for Python
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] python3 is not installed or not in PATH!"
    exit 1
fi

# 3. Check for Node.js
if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH!"
    exit 1
fi

# 4. Activate Virtual Environment if available
PYTHON_CMD="python3"
if [ -f "$SCRIPT_DIR/backend/venv/bin/python" ]; then
    PYTHON_CMD="$SCRIPT_DIR/backend/venv/bin/python"
    echo "[INFO] Using backend virtual environment."
else
    echo "[INFO] Using system Python."
fi

# Cleanup on exit
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

echo ""
echo "[1/2] Starting FastAPI Backend on http://localhost:8000 ..."
(cd "$SCRIPT_DIR/backend" && $PYTHON_CMD -m uvicorn main:app --reload --port 8000) &

echo "[2/2] Starting React Frontend on http://localhost:5173 ..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &

sleep 3

# Try opening default browser
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:5173" &>/dev/null || true
elif command -v open &>/dev/null; then
    open "http://localhost:5173" &>/dev/null || true
fi

echo ""
echo "========================================================"
echo "esteRoute local services are running!"
echo ""
echo "  - Local Web UI:          http://localhost:5173"
echo "  - Interactive API Docs:  http://localhost:8000/docs"
echo "  - Health Check:          http://localhost:8000/api/health"
echo "========================================================"
echo ""
echo "Press Ctrl+C to stop all local services."

wait

