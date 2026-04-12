# SentinelAI — Intelligent Surveillance Platform

A production-ready full-stack AI surveillance web application with real-time object detection, multi-camera management, and intelligent alert dashboards.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   React + Vite  │────▶│  Express.js API   │────▶│   MongoDB   │
│   Tailwind CSS  │     │  Socket.IO        │     └─────────────┘
│   Zustand       │     │  BullMQ Workers   │────▶│    Redis     │
│   React Query   │     │  ONNX Runtime     │     └─────────────┘
└─────────────────┘     └──────────────────┘
```

## ✨ Features

- **AI Model Management** — Upload YOLO, ONNX, TensorFlow, PyTorch models
- **Multi-Camera Support** — Webcam, RTSP, file, sample feeds with live preview
- **Live Video Overlay** — Real-time bounding boxes drawn directly on camera feeds
- **Smart Alert Logic** — Configurable `alertLabels` per model (e.g., only "Drowsy" triggers alerts)
- **Automatic Detection** — Every 5 seconds with BullMQ job queues
- **Real-time Alerts** — Socket.IO push with annotated snapshots
- **Dashboard Analytics** — Recharts-powered detection statistics
- **Role-based Auth** — JWT with admin/operator roles
- **Continuous Webcam** — Background FFmpeg streams keep webcam hardware active

## 📋 Prerequisites

- **Node.js** 18+
- **Docker** & Docker Compose (for MongoDB + Redis)
- **FFmpeg** (optional, for frame capture from video files)

## 🚀 Quick Start

### Option A: Using Scripts (Recommended)

**Linux / macOS:**
```bash
chmod +x setup.sh start.sh
./setup.sh        # Install deps, start Docker, seed DB
./start.sh        # Start backend + frontend
```

**Windows (CMD or PowerShell):**
```cmd
setup.bat          REM Install deps, start Docker, seed DB
start.bat          REM Start backend + frontend
```

### Option B: Manual Setup

```bash
# 1. Setup environment
cp .env.example .env           # Linux/Mac
copy .env.example .env         # Windows

# 2. Start infrastructure
docker compose up -d

# 3. Install & seed backend
cd backend && npm install && npm run seed

# 4. Start backend
npm run dev

# 5. Install & start frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Open Browser

Navigate to `http://localhost:5173`

**Demo Credentials:**
- Admin: `admin@cctv.ai` / `admin123`
- Operator: `operator@cctv.ai` / `operator123`

## 📁 Project Structure

```
cctv_ai/
├── setup.sh / setup.bat        # One-click setup (Linux/Windows)
├── start.sh / start.bat        # Start all services (Linux/Windows)
├── docker-compose.yml          # MongoDB + Redis
├── .env.example                # Environment template
├── backend/
│   ├── server.js               # Express entry point
│   ├── config/                 # DB, Redis, Socket configs
│   ├── controllers/            # Route handlers
│   ├── routes/                 # API routes
│   ├── models/                 # Mongoose schemas
│   ├── services/               # Inference, frame capture, annotation, webcam
│   ├── workers/                # BullMQ worker + scheduler
│   ├── middlewares/            # Auth, upload, error handling
│   ├── utils/                  # Logger, NMS, helpers
│   ├── seeds/                  # Database seeder
│   ├── uploads/                # Model files + snapshots
│   └── streams/samples/        # Sample video feeds
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Socket.IO hook
│   │   ├── layouts/            # Dashboard layout
│   │   ├── pages/              # Login, Home, Models, Cameras, Alerts
│   │   ├── store/              # Zustand stores
│   │   └── utils/              # Constants, helpers
│   └── ...
```

## 🔌 API Endpoints

| Module   | Method | Endpoint                | Description            |
|----------|--------|-------------------------|------------------------|
| Auth     | POST   | /api/auth/register      | Register user          |
| Auth     | POST   | /api/auth/login         | Login                  |
| Auth     | GET    | /api/auth/me            | Current user           |
| Models   | GET    | /api/models             | List models            |
| Models   | POST   | /api/models             | Upload model           |
| Models   | PATCH  | /api/models/:id/toggle  | Toggle active          |
| Cameras  | GET    | /api/cameras            | List cameras           |
| Cameras  | POST   | /api/cameras            | Add camera             |
| Cameras  | PATCH  | /api/cameras/:id/model  | Assign model           |
| Cameras  | POST   | /api/cameras/:id/start  | Start detection        |
| Cameras  | POST   | /api/cameras/:id/stop   | Stop detection         |
| Alerts   | GET    | /api/alerts             | List alerts (filtered) |
| Alerts   | GET    | /api/alerts/stats       | Alert statistics       |
| Alerts   | GET    | /api/alerts/export/csv  | Export CSV             |
| Stats    | GET    | /api/stats/dashboard    | Dashboard summary      |
| Stats    | GET    | /api/stats/analytics    | Chart analytics        |

## 🧪 Testing

After starting the app:

1. Login with demo credentials
2. Navigate to **Cameras** → click **Start** on any camera
3. Watch the **Alerts** page for real-time detections
4. Check **Home** for live analytics charts and platform overview
5. Upload a new model on the **Models** page

## 📄 License

MIT
