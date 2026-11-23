const { daysLeft, deadlineStatus, startOfUtcDay } = require('../../src/lib/deadlines');

// Monday 23 Nov 2026, in the afternoon
const now = new Date('2026-11-23T15:30:00.000Z');
const exam = (date, grade = null) => ({ date: new Date(date), grade });

describe('daysLeft', () => {
  it('counts whole UTC days', () => {
    expect(daysLeft(new Date('2026-11-23T00:00:00.000Z'), now)).toBe(0);
    expect(daysLeft(new Date('2026-11-24T00:00:00.000Z'), now)).toBe(1);
    expect(daysLeft(new Date('2026-11-22T23:59:00.000Z'), now)).toBe(-1);
    expect(daysLeft(new Date('2026-12-07T09:00:00.000Z'), now)).toBe(14);
  });

  it('works across a month and a year end', () => {
    expect(daysLeft(new Date('2027-01-01T00:00:00.000Z'), now)).toBe(39);
  });
});

describe('startOfUtcDay', () => {
  it('drops the time of day', () => {
    expect(startOfUtcDay(now)).toBe(Date.parse('2026-11-23T00:00:00.000Z'));
  });
});

describe('deadlineStatus', () => {
  it('an exam today is upcoming, even after its time', () => {
    expect(deadlineStatus(exam('2026-11-23T09:00:00.000Z'), now, 14)).toBe('upcoming');
  });

  it('an exam inside the window is upcoming', () => {
    expect(deadlineStatus(exam('2026-12-07T00:00:00.000Z'), now, 14)).toBe('upcoming');
  });

  it('an exam after the window is not shown', () => {
    expect(deadlineStatus(exam('2026-12-08T00:00:00.000Z'), now, 14)).toBeNull();
    expect(deadlineStatus(exam('2026-11-25T00:00:00.000Z'), now, 1)).toBeNull();
  });

  it('TC-09: a past exam without a grade is overdue', () => {
    expect(deadlineStatus(exam('2026-11-10T00:00:00.000Z'), now, 14)).toBe('overdue');
    expect(deadlineStatus({ date: new Date('2026-11-22T00:00:00.000Z') }, now, 14)).toBe('overdue');
  });

  it('a past exam with a grade is done and not shown', () => {
    expect(deadlineStatus(exam('2026-11-10T00:00:00.000Z', 75), now, 14)).toBeNull();
    expect(deadlineStatus(exam('2026-11-10T00:00:00.000Z', 0), now, 14)).toBeNull();
  });

  it('an upcoming exam stays upcoming when it already has a grade', () => {
    expect(deadlineStatus(exam('2026-11-24T00:00:00.000Z', 90), now, 14)).toBe('upcoming');
  });
});
