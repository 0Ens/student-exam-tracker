const prisma = require('../db');
const { courseAverage, letterGrade, gpa } = require('../lib/grades');
const { getCourse } = require('./courseService');

// Grade summary of one course with its exams.
function summarize(course, exams) {
  const average = courseAverage(exams);
  const grade = letterGrade(average);
  const gradedWeight = exams
    .filter((e) => e.grade !== null)
    .reduce((sum, e) => sum + e.weight, 0);
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    average,
    letter: grade ? grade.letter : null,
    points: grade ? grade.points : null,
    gradedWeight: Math.round(gradedWeight * 100) / 100,
  };
}

// Averages of all courses of the user and the estimated GPA (FR5).
async function getGrades(userId) {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: { exams: true },
    orderBy: [{ term: 'desc' }, { name: 'asc' }],
  });
  const summaries = courses.map((c) => summarize(c, c.exams));
  return { gpa: gpa(summaries), courses: summaries };
}

async function getCourseGrade(userId, rawCourseId) {
  const course = await getCourse(userId, rawCourseId);
  const exams = await prisma.exam.findMany({ where: { courseId: course.id } });
  return summarize(course, exams);
}

module.exports = { getGrades, getCourseGrade };
