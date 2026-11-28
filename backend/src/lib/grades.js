// Grade calculation rules (FR5). Pure functions, no database access,
// so they can be unit tested on their own (WBS 3.4, 5.2).

// Letter grades on the 4.0 scale of our university (there is no FD).
// Each row is the lowest course average for that letter.
const SCALE = [
  { min: 90, letter: 'AA', points: 4.0 },
  { min: 85, letter: 'BA', points: 3.5 },
  { min: 80, letter: 'BB', points: 3.0 },
  { min: 75, letter: 'CB', points: 2.5 },
  { min: 70, letter: 'CC', points: 2.0 },
  { min: 60, letter: 'DC', points: 1.5 },
  { min: 50, letter: 'DD', points: 1.0 },
  { min: 0, letter: 'FF', points: 0.0 },
];

// Rounds to two decimals and removes floating point noise.
function round2(value) {
  return Math.round(value * 100) / 100;
}

// Weighted average of the graded exams of one course.
// Exams without a grade are ignored, so the average reflects the
// work that has been graded so far. Returns null if nothing is graded.
function courseAverage(exams) {
  const graded = exams.filter((e) => e.grade !== null && e.grade !== undefined);
  const gradedWeight = graded.reduce((sum, e) => sum + e.weight, 0);
  if (gradedWeight === 0) {
    return null;
  }
  const total = graded.reduce((sum, e) => sum + e.grade * e.weight, 0);
  return round2(total / gradedWeight);
}

// Letter and points for a course average (0-100).
function letterGrade(average) {
  if (average === null || average === undefined) {
    return null;
  }
  return SCALE.find((row) => average >= row.min);
}

// Estimated GPA: grade points weighted by the credits of each course.
// Courses without an average (nothing graded yet) are left out.
function gpa(courses) {
  let credits = 0;
  let points = 0;
  for (const course of courses) {
    const grade = letterGrade(course.average);
    if (grade && course.credits > 0) {
      credits += course.credits;
      points += grade.points * course.credits;
    }
  }
  return credits === 0 ? null : round2(points / credits);
}

module.exports = { SCALE, round2, courseAverage, letterGrade, gpa };
