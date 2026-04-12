#!/bin/bash

# ─── SentinelAI — Start Script ────────────────────────────
# Starts both backend and frontend dev servers.
# Usage: ./start.sh

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   SentinelAI — Starting Services         ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Check if Docker containers are running ───────────────
if command -v docker &> /dev/null; then
  MONGO_RUNNING=$(docker ps --filter "name=cctv_ai_mongo" --format "{{.Names}}" 2>/dev/null)
  REDIS_RUNNING=$(docker ps --filter "name=cctv_ai_redis" --format "{{.Names}}" 2>/dev/null)

  if [ -z "$MONGO_RUNNING" ] || [ -z "$REDIS_RUNNING" ]; then
    echo -e "${YELLOW}▸ Starting Docker containers...${NC}"
    docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
    sleep 2
    echo -e "  ${GREEN}✓${NC} MongoDB & Redis started"
  else
    echo -e "  ${GREEN}✓${NC} MongoDB & Redis already running"
  fi
else
  echo -e "  ${YELLOW}⚠${NC} Docker not found — ensure MongoDB & Redis are running manually."
fi
echo ""

# ── Ensure node_modules exist ─────────────────────────────
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}▸ Installing backend dependencies...${NC}"
  (cd backend && npm install --loglevel=warn)
fi
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}▸ Installing frontend dependencies...${NC}"
  (cd frontend && npm install --loglevel=warn)
fi

# ── Function to cleanup on exit ───────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping services...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID 2>/dev/null
  wait $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}✓ All services stopped.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Start Backend ─────────────────────────────────────────
echo -e "${YELLOW}▸ Starting backend (port 5000)...${NC}"
(cd backend && npm run dev) &
BACKEND_PID=$!
sleep 2

# ── Start Frontend ────────────────────────────────────────
echo -e "${YELLOW}▸ Starting frontend (port 5173)...${NC}"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✓ SentinelAI is running!               ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}  ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend:${NC}   ${CYAN}http://localhost:5000${NC}"
echo ""
echo -e "  ${BOLD}Login:${NC}     admin@cctv.ai / admin123"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services."
echo ""

# Wait for background processes
wait
