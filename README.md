# CS308 Course Project — ElectroStore

Online electronics store for CS308. Customers browse the catalog, manage cart/wishlist, checkout, track orders, request returns, and leave reviews. Staff roles cover catalog management (product manager), pricing/sales/invoices/returns (sales manager).

## Key Features
- **Customer:** catalog search/sort, product detail, cart (guest + logged-in), checkout, order tracking, wishlist, returns within 30 days, reviews
- **Product manager:** product CRUD, stock, categories, image upload
- **Sales manager:** pricing/discounts, invoice PDF + email, revenue reports, delivery status, return approve/reject (refund email on approval)
- **Security:** JWT auth, role-based guards, AES-256 encryption for sensitive profile/invoice fields
- **Data:** PostgreSQL + TypeORM migrations

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

## Unit Tests

Backend unit tests use **Jest**. Spec files live next to their services under `backend/src/**/*.spec.ts` (e.g. `auth/`, `cart/`, `orders/`, `returns/`, `invoices/`).

**Total:** 95 tests across 16 suites (run from `backend/`):

```bash
cd backend
npm test
```

## Scrum
Meeting notes and backlog: `docs/`.
