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

## Run with Docker

The backend has a Dockerfile (`backend/Dockerfile`). The SQLite database is stored in `/data`, so use a volume to keep it:

```bash
docker build -t exam-tracker-api backend
docker run -p 4000:4000 -v exam-tracker-data:/data   -e JWT_SECRET=<at least 32 characters>   -e CORS_ORIGIN=http://localhost:5173   exam-tracker-api
```

The container runs the database migrations at startup and has a health check on `/api/health`.

### Production settings

| Variable         | Example                         | Note                                        |
| ---------------- | ------------------------------- | ------------------------------------------- |
| `NODE_ENV`       | `production`                    | Set in the image                            |
| `PORT`           | `4000`                          | Set in the image                            |
| `DATABASE_URL`   | `file:/data/app.db`             | Set in the image                            |
| `JWT_SECRET`     | random text, 32+ characters     | Required, the server stops without it       |
| `JWT_EXPIRES_IN` | `1d`                            | Optional                                    |
| `CORS_ORIGIN`    | `https://<frontend>.vercel.app` | Required in production, can be a comma list |

With `NODE_ENV=production` the server checks these values at startup and stops with a clear message when the secret is the example value or too short, or when `CORS_ORIGIN` is missing or `*`.

## Tests

```bash
cd backend && npm test -- --coverage
cd frontend && npm test
```

Backend tests use a separate SQLite database (`backend/test.db`) that is reset before each run.

## Features so far

| Feature                             | Status |
| ----------------------------------- | ------ |
| Register, login, logout (FR1)       | Done   |
| Courses: add, edit, delete (FR2)    | Done   |
| Exams, quizzes, assignments (FR3)   | Done   |
| Dashboard with deadlines (FR4)      | Done   |
| Course average and GPA (FR5)        | Done   |
| Search and filter (FR6)             | Done   |
| Users only see their own data (FR7) | Done   |

## Branches

- `main` - stable, updated at the end of each milestone
- `develop` - integration branch
- `feature/<name>` - one branch per task, merged into `develop` with `--no-ff`
