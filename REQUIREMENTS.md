# Requirements and Quick Setup

## System Requirements
- Windows 10/11
- Node.js 20+
- npm 10+
- Docker Desktop (for PostgreSQL)

## Repository Setup
1. Clone the repository.
2. Open project root folder.
3. Ensure Docker Desktop is installed and signed in.

## Environment Files
- Do not commit `.env` files.
- Use template files:
  - `backend/.env.example` -> `backend/.env`

## One-Click Run
- Start everything:
  - `start.bat`
- Stop running ports and containers:
  - `kill.bat`

## Manual Commands (Optional)
- Backend:
  - `cd backend`
  - `npm install`
  - `npm run start:dev`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Default URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API Docs: `http://localhost:3000/api`
