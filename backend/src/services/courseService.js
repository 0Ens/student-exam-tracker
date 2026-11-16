const prisma = require('../db');
const { HttpError } = require('../middleware/errors');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function listCourses(userId) {
  return prisma.course.findMany({
    where: { userId },
    orderBy: [{ term: 'desc' }, { name: 'asc' }],
  });
}

// Courses are always looked up together with the owner, so a course that
// belongs to another user is reported as "not found" (no data leak).
async function getCourse(userId, rawId) {
  const id = parseId(rawId);
  const course = id && (await prisma.course.findFirst({ where: { id, userId } }));
  if (!course) {
    throw new HttpError(404, 'Course not found');
  }
  return course;
}

function createCourse(userId, data) {
  return prisma.course.create({ data: { ...data, userId } });
}

async function updateCourse(userId, rawId, data) {
  const course = await getCourse(userId, rawId);
  return prisma.course.update({ where: { id: course.id }, data });
}

async function deleteCourse(userId, rawId) {
  const course = await getCourse(userId, rawId);
  await prisma.course.delete({ where: { id: course.id } });
}

module.exports = { parseId, listCourses, getCourse, createCourse, updateCourse, deleteCourse };
