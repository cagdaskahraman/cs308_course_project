# CS308 Course Project - Electronics Store

## Team Members
- Çağdaş Kahraman
- Salih Tufanoğlu
- Alp Mert Ekşi
- Senih Kırmaç
- Emir Kaan Yılmaz
- Enes Ovalı

## Project Description
This project is an e-commerce platform for an electronics store. It includes customer and admin interfaces with role-based access.

## Tech Stack
- Frontend: ReactJS + Bootstrap
- Backend: Jest + Supertest
- Database: PostgreSQL
- Other Fundemental Tools: GitHub, GitHub Projects/Jira, Postman, Figma, JUnit + Mockito, React Testing Library, Docker

## Project Structure
- frontend/
- backend/
- docs/
- assets/

## Branch Strategy
- main → stable
- dev → development
- feature/* → feature branches

## Setup Instructions

### Prerequisites
- Node.js (v20+ recommended)
- npm

### 1) Clone and install

```bash
git clone https://github.com/cagdaskahraman/cs308_course_project.git
cd cs308_course_project
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 2) Run the app on localhost

Open two terminals from project root.

Terminal 1 (backend):

```bash
cd backend
npm run start
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

### 3) Access URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Products API: `http://localhost:3000/products`
- Health endpoint: `http://localhost:3000/hello`

### Current App Usage
- Frontend has a single product listing page.
- It fetches products from the backend `/products` endpoint.
- Product images are served from `assets/products` through backend static hosting.

## Scrum
Meeting notes and backlog are stored under `docs/`.

## Contributors
All team members contribute via pull requests.

