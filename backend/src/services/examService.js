const prisma = require('../db');
const { HttpError } = require('../middleware/errors');
const { getCourse, parseId } = require('./courseService');

const MAX_TOTAL_WEIGHT = 100;

// TC-08: the weights of all exams of one course may not add up to more than 100%.
async function checkTotalWeight(courseId, weight, excludeExamId) {
  const { _sum } = await prisma.exam.aggregate({
    where: { courseId, ...(excludeExamId && { id: { not: excludeExamId } }) },
    _sum: { weight: true },
  });
  const used = _sum.weight ?? 0;
  if (used + weight > MAX_TOTAL_WEIGHT + 1e-9) {
    const left = Math.max(0, MAX_TOTAL_WEIGHT - used);
    const err = new HttpError(400, 'Total weight of the course cannot be more than 100%');
    err.details = { weight: [`Only ${left}% is left for this course`] };
    throw err;
  }
}

async function listExams(userId, rawCourseId) {
  const course = await getCourse(userId, rawCourseId);
  return prisma.exam.findMany({
    where: { courseId: course.id },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });
}

// An exam is found only through a course of the logged-in user (FR7).
async function getExam(userId, rawId) {
  const id = parseId(rawId);
  const exam = id && (await prisma.exam.findFirst({ where: { id, course: { userId } } }));
  if (!exam) {
    throw new HttpError(404, 'Exam not found');
  }
  return exam;
}

async function createExam(userId, rawCourseId, data) {
  const course = await getCourse(userId, rawCourseId);
  await checkTotalWeight(course.id, data.weight);
  return prisma.exam.create({ data: { ...data, courseId: course.id } });
}

async function updateExam(userId, rawId, data) {
  const exam = await getExam(userId, rawId);
  await checkTotalWeight(exam.courseId, data.weight, exam.id);
  return prisma.exam.update({ where: { id: exam.id }, data });
}

async function deleteExam(userId, rawId) {
  const exam = await getExam(userId, rawId);
  await prisma.exam.delete({ where: { id: exam.id } });
}

module.exports = { listExams, getExam, createExam, updateExam, deleteExam };
