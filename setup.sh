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

# ── Detect OS ────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)   PLATFORM=linux ;;
  Darwin*)  PLATFORM=mac ;;
  *)        PLATFORM=other ;;
esac

# ── Helper: install a package ────────────────────────────
install_pkg() {
  local pkg=$1
  if [ "$PLATFORM" = "linux" ]; then
    if command -v apt-get &> /dev/null; then
      echo -e "  ${YELLOW}→ Installing $pkg via apt...${NC}"
      sudo apt-get update -qq && sudo apt-get install -y -qq "$pkg"
    elif command -v dnf &> /dev/null; then
      echo -e "  ${YELLOW}→ Installing $pkg via dnf...${NC}"
      sudo dnf install -y -q "$pkg"
    elif command -v pacman &> /dev/null; then
      echo -e "  ${YELLOW}→ Installing $pkg via pacman...${NC}"
      sudo pacman -S --noconfirm "$pkg"
    else
      echo -e "  ${RED}✗ Cannot auto-install $pkg. Please install it manually.${NC}"
      return 1
    fi
  elif [ "$PLATFORM" = "mac" ]; then
    if command -v brew &> /dev/null; then
      echo -e "  ${YELLOW}→ Installing $pkg via brew...${NC}"
      brew install "$pkg"
    else
      echo -e "  ${RED}✗ Homebrew not found. Install $pkg manually: https://brew.sh${NC}"
      return 1
    fi
  fi
}

# ══════════════════════════════════════════════════════════
#  1. CHECK & INSTALL PREREQUISITES
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Checking prerequisites...${NC}"

# ── Node.js ──────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "  ${YELLOW}⚠ Node.js not found. Attempting to install...${NC}"
  if [ "$PLATFORM" = "linux" ]; then
    # Install via NodeSource for latest LTS
    echo -e "  ${YELLOW}→ Installing Node.js 20 LTS via NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
    sudo apt-get install -y -qq nodejs 2>/dev/null
  elif [ "$PLATFORM" = "mac" ]; then
    install_pkg node
  fi
  if ! command -v node &> /dev/null; then
    echo -e "  ${RED}✗ Failed to install Node.js. Please install Node.js 18+ manually:${NC}"
    echo -e "    https://nodejs.org/"
    exit 1
  fi
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required (found v$(node -v)). Please upgrade.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# ── npm ──────────────────────────────────────────────────
if ! command -v npm &> /dev/null; then
  echo -e "  ${RED}✗ npm is not installed (should come with Node.js).${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# ── Docker ───────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo -e "  ${YELLOW}⚠ Docker not found. Attempting to install...${NC}"
  if [ "$PLATFORM" = "linux" ]; then
    echo -e "  ${YELLOW}→ Installing Docker via official script...${NC}"
    curl -fsSL https://get.docker.com | sudo sh 2>/dev/null
    # Add current user to docker group so sudo isn't needed later
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    echo -e "  ${YELLOW}  Note: You may need to log out and back in for docker group to take effect.${NC}"
    echo -e "  ${YELLOW}  If 'docker compose' fails below, run: newgrp docker${NC}"
  elif [ "$PLATFORM" = "mac" ]; then
    echo -e "  ${RED}✗ Please install Docker Desktop for Mac:${NC}"
    echo -e "    https://docs.docker.com/desktop/install/mac-install/"
    exit 1
  fi
  if ! command -v docker &> /dev/null; then
    echo -e "  ${RED}✗ Failed to install Docker. Please install manually:${NC}"
    echo -e "    https://docs.docker.com/engine/install/"
    exit 1
  fi
fi
echo -e "  ${GREEN}✓${NC} Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── Docker Compose (check plugin or standalone) ──────────
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
  echo -e "  ${GREEN}✓${NC} Docker Compose (plugin)"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
  echo -e "  ${GREEN}✓${NC} docker-compose (standalone)"
else
  echo -e "  ${YELLOW}⚠ Docker Compose not found. Attempting to install plugin...${NC}"
  if [ "$PLATFORM" = "linux" ]; then
    sudo apt-get install -y -qq docker-compose-plugin 2>/dev/null || \
    sudo dnf install -y -q docker-compose-plugin 2>/dev/null || true
  fi
  if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo -e "  ${GREEN}✓${NC} Docker Compose installed"
  else
    echo -e "  ${RED}✗ Could not install Docker Compose. Please install it manually.${NC}"
    exit 1
  fi
fi

# ── FFmpeg (optional) ────────────────────────────────────
if ! command -v ffmpeg &> /dev/null; then
  echo -e "  ${YELLOW}⚠ FFmpeg not found. Attempting to install...${NC}"
  install_pkg ffmpeg 2>/dev/null || true
  if command -v ffmpeg &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} FFmpeg installed"
  else
    echo -e "  ${YELLOW}⚠ FFmpeg not installed — video frame capture will use placeholder images.${NC}"
  fi
else
  echo -e "  ${GREEN}✓${NC} FFmpeg installed"
fi

echo ""

# ══════════════════════════════════════════════════════════
#  2. ENVIRONMENT FILE
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Setting up environment...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
else
  echo -e "  ${GREEN}✓${NC} .env already exists"
fi
echo ""

# ══════════════════════════════════════════════════════════
#  3. START MONGODB & REDIS VIA DOCKER
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Starting MongoDB & Redis via Docker...${NC}"

# Ensure Docker daemon is running
if ! docker info &> /dev/null; then
  echo -e "  ${YELLOW}→ Starting Docker daemon...${NC}"
  sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || true
  sleep 3
fi

$COMPOSE_CMD up -d
echo -e "  ${GREEN}✓${NC} MongoDB (port 27017) and Redis (port 6379) are running"
echo ""

# ══════════════════════════════════════════════════════════
#  4. INSTALL DEPENDENCIES
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Installing backend dependencies...${NC}"
(cd backend && npm install --loglevel=warn)
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
echo ""

echo -e "${YELLOW}▸ Installing frontend dependencies...${NC}"
(cd frontend && npm install --loglevel=warn)
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# ══════════════════════════════════════════════════════════
#  5. CREATE DIRECTORIES
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Creating directories...${NC}"
mkdir -p backend/uploads/models
mkdir -p backend/uploads/snapshots
mkdir -p backend/streams/samples
echo -e "  ${GREEN}✓${NC} Upload and stream directories ready"
echo ""

# ══════════════════════════════════════════════════════════
#  6. SEED DATABASE
# ══════════════════════════════════════════════════════════
echo -e "${YELLOW}▸ Seeding database with demo data...${NC}"
(cd backend && npm run seed)
echo ""

# ══════════════════════════════════════════════════════════
#  DONE
# ══════════════════════════════════════════════════════════
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✓ Setup Complete!                      ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Services running via Docker:${NC}"
echo -e "    MongoDB  → localhost:27017"
echo -e "    Redis    → localhost:6379"
echo ""
echo -e "  Next: Run ${CYAN}./start.sh${NC} to start the application."
echo ""
echo -e "  ${BOLD}Demo Credentials:${NC}"
echo -e "    Admin:    admin@cctv.ai / admin123"
echo -e "    Operator: operator@cctv.ai / operator123"
echo ""
