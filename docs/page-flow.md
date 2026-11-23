# UI Wireframes and Page Flow

## Pages

| Route          | Page          | Access    | Requirement | Sprint |
| -------------- | ------------- | --------- | ----------- | ------ |
| `/login`       | Login         | Public    | FR1         | S1     |
| `/register`    | Register      | Public    | FR1         | S1     |
| `/courses`     | Courses       | Logged in | FR2, FR7    | S2     |
| `/courses/:id` | Course detail | Logged in | FR3, FR5    | S3     |
| `/`            | Dashboard     | Logged in | FR4, FR5    | S4     |

## Page flow

```
            +-----------+   no account    +------------+
  start --> |   Login   | --------------> |  Register  |
            +-----------+ <-------------- +------------+
                  |        has account          |
                  | success                     | success
                  v                             v
            +-----------------------------------------+
            |  Dashboard (/)                          |
            |  top bar: Dashboard | Courses | Logout  |
            +-----------------------------------------+
                  |                         ^
                  v                         |
            +-------------+  open course  +---------------+
            |   Courses   | ------------> | Course detail |
            +-------------+ <------------ | (exams list)  |
                                  back    +---------------+

  Logout from any page -> Login
  Opening a protected page without a token -> Login (TC-03)
```

## Wireframes

### Login

```
+--------------------------------------------+
| Exam Tracker                               |
+--------------------------------------------+
|  Log in                                    |
|  E-mail    [______________________]        |
|  Password  [______________________]        |
|  ! Invalid e-mail or password              |
|  [ Log in ]                                |
|  No account? Register                      |
+--------------------------------------------+
```

### Register

```
+--------------------------------------------+
| Exam Tracker                               |
+--------------------------------------------+
|  Create account                            |
|  Name      [______________________]        |
|  E-mail    [______________________]        |
|  Password  [______________________]        |
|            (at least 8 characters)         |
|  [ Register ]                              |
|  Already registered? Log in                |
+--------------------------------------------+
```

### Courses

```
+------------------------------------------------------------+
| Exam Tracker          Dashboard  Courses  Ayse  [Log out]  |
+------------------------------------------------------------+
|  My courses                                                |
|  +------------------------------------------------------+  |
|  | Name [__________] Code [____] Credits [_] Term [____]|  |
|  | [ Add course ]                                       |  |
|  +------------------------------------------------------+  |
|  Code    Name                 Credits  Term               |
|  SWE488  Software Testing     6        Fall 2026 [Edit][x]|
|  MAT101  Calculus             5        Fall 2026 [Edit][x]|
|  (empty state: "No courses yet. Add your first course.")  |
+------------------------------------------------------------+
```

### Course detail (S3)

```
+------------------------------------------------------------+
|  <- My courses                                             |
|  SWE488 Software Project Management   3 credits, 2026 Fall |
|  Add an exam or assignment                                 |
|  Title [______] Type [Exam v] Date [__] Weight [__] %      |
|  Grade [______] (optional)          [ Add exam ]           |
|  ! Only 60% is left for this course                        |
|  Weight used: 40% of 100%                                  |
|  Midterm  [Exam]   20 Nov 2026 · 40% · Grade 80 [Edit][Del]|
|  Project  [Project] 18 Dec 2026 · 60% · Not graded yet     |
+------------------------------------------------------------+
```

Since S4 the page also shows the course average under the list, for example `Course average: 68 (CC, based on 100% graded)`.

### Dashboard (S4)

```
+------------------------------------------------------------+
|  Hello, Ayse                                               |
|  [Estimated GPA 3.71] [Upcoming (14 days) 2] [Overdue 1]   |
|                                                            |
|  Overdue                                                   |
|  ! Homework 2  [Assignment]  MAT101 · 10 Nov   13 days ago |
|                                                            |
|  Upcoming                                                  |
|    Quiz 3      [Quiz]        CS201 · 23 Nov          today |
|    Lab report  [Assignment]  MAT101 · 26 Nov     in 3 days |
|                                                            |
|  Course averages                                           |
|  Course            Credits  Average           Letter       |
|  CS201 Algorithms  4        80 (40% graded)   BA           |
|  MAT101 Calculus   3        91 (30% graded)   AA           |
+------------------------------------------------------------+
```

- The overdue card is only shown when something is overdue (date passed, no grade).
- A new user without courses sees "You have no courses yet." and a link to the courses page.
- Course codes link to the course page. Search and filters get their own page in 4.5.

## Layout rules

- One column on phones, content limited to 880px on desktop.
- Forms stack labels above inputs; buttons are full size touch targets.
- Errors are shown under the form in red text.
