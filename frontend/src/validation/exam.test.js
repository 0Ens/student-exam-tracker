import { describe, expect, it } from 'vitest';
import { validateExam } from './exam.js';

const valid = { title: 'Midterm', type: 'exam', date: '2026-11-20', weight: '30', grade: '' };

describe('validateExam', () => {
  it('accepts a valid exam without a grade', () => {
    expect(validateExam(valid)).toEqual({});
  });

  it('accepts a grade between 0 and 100', () => {
    expect(validateExam({ ...valid, grade: '85.5' })).toEqual({});
  });

  it('reports every missing field', () => {
    const errors = validateExam({ title: ' ', type: '', date: '', weight: '', grade: '' });
    expect(Object.keys(errors).sort()).toEqual(['date', 'title', 'type', 'weight']);
  });

  it.each(['-1', '101', 'abc'])('rejects weight "%s"', (weight) => {
    expect(validateExam({ ...valid, weight })).toHaveProperty('weight');
  });

  it.each(['-5', '120', 'A'])('rejects grade "%s"', (grade) => {
    expect(validateExam({ ...valid, grade })).toHaveProperty('grade');
  });

  it('TC-08: rejects a weight that is more than what is left', () => {
    expect(validateExam({ ...valid, weight: '40' }, 30)).toEqual({
      weight: 'Only 30% is left for this course',
    });
  });

  it('TC-08: accepts a weight that fills the course exactly', () => {
    expect(validateExam({ ...valid, weight: '30' }, 30)).toEqual({});
  });
});
