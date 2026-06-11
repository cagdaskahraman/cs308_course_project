# CS308 Course Project — ElectroStore

Online electronics store for CS308. Customers browse a 40-item catalog, manage cart/wishlist, checkout, track orders, request returns, and leave reviews. Staff roles cover catalog management (product manager), pricing/sales/invoices/returns (sales manager).

## Team Members
- Çağdaş Kahraman
- Salih Tufanoğlu
- Alp Mert Ekşi
- Senih Kırmaç
- Emir Kaan Yılmaz
- Enes Ovalı

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Bootstrap, React Router
- **Backend:** NestJS, TypeORM, JWT auth, Swagger
- **Database:** PostgreSQL (Docker)
- **Email:** Nodemailer (SMTP) for invoices, discounts, refund approvals
- **Testing:** Jest (backend)
- **Tools:** GitHub, Docker, Postman

## Project Structure
- `frontend/` — customer + admin UI
- `backend/` — REST API
- `docs/` — Scrum notes
- `assets/` — product images

## Branch Strategy
- `main` → stable
- `dev2` / `dev3` / `dev4` → integration branches
- `feature/*` → feature work

## Setup

Windows: see `REQUIREMENTS.md` and run `start.bat`.

**Prerequisites:** Node.js 20+, npm, Docker Desktop

```bash
git clone https://github.com/cagdaskahraman/cs308_course_project.git
cd cs308_course_project
```

Copy `backend/.env.example` → `backend/.env`, then install and run:

```bash
# backend
cd backend && npm install && npm run start

# frontend (separate terminal)
cd frontend && npm install && npm run dev
```

**URLs**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API docs: `http://localhost:3000/api`

On first start the backend seeds a 40-product catalog and a demo scenario (Products A–C in catalog; D added by PM; E–H tied to sample customer orders).

## Scrum
Meeting notes and backlog: `docs/`.
