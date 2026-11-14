import { describe, expect, it } from 'vitest';
import { validateCourse } from './course.js';

const valid = { name: 'Physics', code: 'PHYS101', credits: '4', term: '2026 Fall' };

describe('validateCourse', () => {
  it('accepts a valid course', () => {
    expect(validateCourse(valid)).toEqual({});
  });

  it('TC-06: requires a name', () => {
    expect(validateCourse({ ...valid, name: '  ' })).toEqual({ name: 'Name is required' });
  });

  it.each(['', '-1', '2.5', '31', 'abc'])('rejects credits value "%s"', (credits) => {
    expect(validateCourse({ ...valid, credits })).toHaveProperty('credits');
  });

  it('reports every missing field', () => {
    const errors = validateCourse({ name: '', code: '', credits: '', term: '' });
    expect(Object.keys(errors).sort()).toEqual(['code', 'credits', 'name', 'term']);
  });
});
