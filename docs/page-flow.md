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

The course average (3.4) is added to this page in S4.

### Dashboard (S4)

```
+------------------------------------------------------------+
|  Upcoming                          Estimated GPA: 3.10     |
|  ! Overdue  Homework 2   MAT101   10 Nov                   |
|    18 Nov   Quiz 1       SWE488                            |
|    20 Nov   Midterm      SWE488                            |
|  Filter: [course v] [type v] [from] [to]                   |
+------------------------------------------------------------+
```

## Layout rules

- One column on phones, content limited to 880px on desktop.
- Forms stack labels above inputs; buttons are full size touch targets.
- Errors are shown under the form in red text.
