# Test Plan

## Scope

Every functional requirement (FR1-FR7) has at least one test case. Test cases come from the Implementation Plan (section 10.1).

| Level             | Tool                           | Location                     |
| ----------------- | ------------------------------ | ---------------------------- |
| Unit (backend)    | Jest                           | `backend/tests/unit`         |
| API / integration | Jest + Supertest               | `backend/tests/*.test.js`    |
| Unit (frontend)   | Vitest + React Testing Library | `frontend/src/**/*.test.jsx` |
| End-to-end        | Cypress                        | `e2e/` (S5)                  |
| Manual            | Checklist                      | 14-17 Dec                    |

API tests run against a separate SQLite database (`test.db`) that is reset before every run, so they never touch development data.

## Test cases

| ID    | Req.     | Test                                        | Expected result                                            | Level         | Status             |
| ----- | -------- | ------------------------------------------- | ---------------------------------------------------------- | ------------- | ------------------ |
| TC-01 | FR1      | Register with a valid e-mail and password   | Account is created, user goes to the dashboard             | API, UI       | Automated, passing |
| TC-02 | FR1      | Register with an e-mail that already exists | Error message, no new account                              | API, UI       | Automated, passing |
| TC-03 | FR1, FR7 | Open a protected page without logging in    | Access denied                                              | API, UI       | Automated, passing |
| TC-04 | FR1      | Log in with a wrong password, then log out  | Error message; after logout the dashboard cannot be opened | API, UI       | Automated, passing |
| TC-05 | FR2      | Add, edit and delete a course               | The course list changes correctly                          | API, UI       | Automated, passing |
| TC-06 | FR2      | Add a course without a name                 | Error message, nothing is saved                            | API, UI       | Automated, passing |
| TC-07 | FR3      | Add an exam with date and weight 30%        | The exam is shown under the course                         | API           | Automated, passing |
| TC-08 | FR3      | Total weight of a course is more than 100%  | Error message                                              | API           | Automated, passing |
| TC-09 | FR4      | Dashboard with past and future exams        | Sorted by date, past ones marked as overdue                | Unit, E2E     | Planned            |
| TC-10 | FR5      | Grades 80 (40%) and 60 (60%)                | Course average is 68                                       | Unit          | Planned            |
| TC-11 | FR5      | Two courses with different credits          | GPA is calculated using credits                            | Unit          | Planned            |
| TC-12 | FR6      | Filter by course and by type "exam"         | Only matching items are shown                              | API, UI       | Planned            |
| TC-13 | FR6      | Search for something that does not exist    | "No results" message                                       | UI            | Planned            |
| TC-14 | FR7      | User B tries to open user A's course        | Not allowed, no data is shown                              | API           | Automated, passing |
| TC-15 | NFR      | Open the app on a phone and on a laptop     | The layout works on both                                   | Manual        | Planned            |
| TC-16 | NFR      | After deployment, open the site and log in  | Site works online                                          | Manual, smoke | Planned            |

## Current status (16 Nov 2026)

| Suite             | Tests | Result | Coverage                    |
| ----------------- | ----- | ------ | --------------------------- |
| Backend (Jest)    | 38    | Pass   | 99.0% lines, 87.3% branches |
| Frontend (Vitest) | 24    | Pass   | -                           |

Test cases TC-01 to TC-08 and TC-14 are automated. TC-07 and TC-08 are tested on the API; the exams page (4.3) is still in progress. The other test cases belong to later sprints (S4-S5, release).

## Entry and exit criteria

- A pull request is merged into `develop` only when lint and all tests pass in CI.
- A release (v1.0) needs all automated test cases passing and the manual checklist done.
- Target coverage: at least 70% on backend services.
