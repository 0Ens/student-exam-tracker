// Mirrors the backend rules so most mistakes are caught before a request.
export function validateCourse(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.code.trim()) errors.code = 'Code is required';
  if (!values.term.trim()) errors.term = 'Term is required';
  const credits = Number(values.credits);
  if (values.credits === '' || !Number.isInteger(credits) || credits < 0 || credits > 30) {
    errors.credits = 'Credits must be a whole number between 0 and 30';
  }
  return errors;
}
