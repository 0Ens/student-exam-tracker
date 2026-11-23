# Student Exam & Course Tracker

Web application for tracking courses, exams, deadlines and grades (SWE488 implementation project).

## Structure

- `backend/` - Node.js + Express REST API (Prisma + SQLite, JWT auth, Zod validation)
- `frontend/` - React (Vite) single page app
- `docs/` - API contract (`openapi.yaml`), page flow and wireframes, test plan
- `.github/workflows/ci.yml` - lint, tests and build on every push and pull request

## Requirements

- Node.js 22
- npm 10

## Running locally

Backend (http://localhost:4000):

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Frontend (http://localhost:5173):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
cd backend && npm test -- --coverage
cd frontend && npm test
```

Backend tests use a separate SQLite database (`backend/test.db`) that is reset before each run.

## Features so far

| Feature                             | Status                   |
| ----------------------------------- | ------------------------ |
| Register, login, logout (FR1)       | Done                     |
| Courses: add, edit, delete (FR2)    | Done                     |
| Exams, quizzes, assignments (FR3)   | Done                     |
| Dashboard with deadlines (FR4)      | Done                     |
| Course average and GPA (FR5)        | Done                     |
| Search and filter (FR6)             | API done, page on 24 Nov |
| Users only see their own data (FR7) | Done                     |

## Branches

- `main` - stable, updated at the end of each milestone
- `develop` - integration branch
- `feature/<name>` - one branch per task, merged into `develop` with `--no-ff`
