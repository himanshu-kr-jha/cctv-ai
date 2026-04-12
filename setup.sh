#!/bin/bash
set -e

# ─── SentinelAI — Setup Script ────────────────────────────
# This script sets up the entire project from scratch.
# Run once on a fresh clone: ./setup.sh

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   SentinelAI — Setup                     ║${NC}"
echo -e "${CYAN}${BOLD}║   Intelligent Surveillance Platform       ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Check prerequisites ─────────────────────────────────
echo -e "${YELLOW}▸ Checking prerequisites...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+ first.${NC}"
  echo "  → https://nodejs.org/"
  exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required (found v$(node -v)).${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm is not installed.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# Docker (optional)
if command -v docker &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} Docker $(docker --version | awk '{print $3}' | tr -d ',')"
  DOCKER_AVAILABLE=true
else
  echo -e "  ${YELLOW}⚠${NC} Docker not found — you'll need to run MongoDB & Redis manually."
  DOCKER_AVAILABLE=false
fi

# FFmpeg (optional)
if command -v ffmpeg &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} FFmpeg installed"
else
  echo -e "  ${YELLOW}⚠${NC} FFmpeg not found — frame capture from video files will use placeholder images."
fi

echo ""

# ── Environment file ────────────────────────────────────
echo -e "${YELLOW}▸ Setting up environment...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
else
  echo -e "  ${GREEN}✓${NC} .env already exists"
fi
echo ""

# ── Start infrastructure (Docker) ───────────────────────
if [ "$DOCKER_AVAILABLE" = true ]; then
  echo -e "${YELLOW}▸ Starting MongoDB & Redis via Docker...${NC}"
  docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
  echo -e "  ${GREEN}✓${NC} Docker containers started"
  echo ""
fi

# ── Install backend dependencies ─────────────────────────
echo -e "${YELLOW}▸ Installing backend dependencies...${NC}"
(cd backend && npm install --loglevel=warn)
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
echo ""

# ── Install frontend dependencies ────────────────────────
echo -e "${YELLOW}▸ Installing frontend dependencies...${NC}"
(cd frontend && npm install --loglevel=warn)
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# ── Create required directories ──────────────────────────
echo -e "${YELLOW}▸ Creating directories...${NC}"
mkdir -p backend/uploads/models
mkdir -p backend/uploads/snapshots
mkdir -p backend/streams/samples
echo -e "  ${GREEN}✓${NC} Upload and stream directories ready"
echo ""

# ── Seed database ────────────────────────────────────────
echo -e "${YELLOW}▸ Seeding database with demo data...${NC}"
(cd backend && npm run seed)
echo ""

# ── Done ─────────────────────────────────────────────────
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✓ Setup Complete!                      ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Next: Run ${CYAN}./start.sh${NC} to start the application."
echo ""
echo -e "  ${BOLD}Demo Credentials:${NC}"
echo -e "    Admin:    admin@cctv.ai / admin123"
echo -e "    Operator: operator@cctv.ai / operator123"
echo ""
