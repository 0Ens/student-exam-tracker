export const EXAM_TYPES = ['exam', 'quiz', 'assignment', 'project'];

function isPercent(value) {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) && number >= 0 && number <= 100;
}

// Mirrors the backend rules. `weightLeft` is how much of the course's 100% is
// still free for this exam (TC-08), so the user sees the problem before saving.
export function validateExam(values, weightLeft = 100) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!EXAM_TYPES.includes(values.type)) errors.type = 'Choose a type';
  if (!values.date || Number.isNaN(Date.parse(values.date))) errors.date = 'Date is required';

  if (!isPercent(values.weight)) {
    errors.weight = 'Weight must be a number between 0 and 100';
  } else if (Number(values.weight) > weightLeft + 1e-9) {
    errors.weight = `Only ${weightLeft}% is left for this course`;
  }

  if (values.grade !== '' && !isPercent(values.grade)) {
    errors.grade = 'Grade must be a number between 0 and 100';
  }
  return errors;
}
