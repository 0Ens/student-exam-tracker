const { courseAverage, letterGrade, gpa, round2 } = require('../../src/lib/grades');

const exam = (weight, grade) => ({ weight, grade });

describe('courseAverage', () => {
  it('TC-10: grades 80 (40%) and 60 (60%) give 68', () => {
    expect(courseAverage([exam(40, 80), exam(60, 60)])).toBe(68);
  });

  it('uses only the graded exams', () => {
    // 90 x 30 / 30 = 90, the ungraded final does not count yet
    expect(courseAverage([exam(30, 90), exam(70, null)])).toBe(90);
  });

  it('returns null when nothing is graded', () => {
    expect(courseAverage([exam(40, null), exam(60, null)])).toBeNull();
    expect(courseAverage([])).toBeNull();
  });

  it('ignores missing grades as well as null grades', () => {
    expect(courseAverage([{ weight: 50 }, exam(50, 70)])).toBe(70);
  });

  it('counts a grade of 0', () => {
    expect(courseAverage([exam(50, 0), exam(50, 100)])).toBe(50);
  });

  it('rounds to two decimals', () => {
    // (70 x 10 + 85 x 20) / 30 = 80
    expect(courseAverage([exam(10, 70), exam(20, 85)])).toBe(80);
    // (100 x 1 + 0 x 2) / 3 = 33.333...
    expect(courseAverage([exam(1, 100), exam(2, 0)])).toBe(33.33);
  });

  it('works with decimal weights', () => {
    expect(courseAverage([exam(12.5, 80), exam(37.5, 40)])).toBe(50);
  });
});

describe('letterGrade', () => {
  it.each([
    [100, 'AA', 4],
    [90, 'AA', 4],
    [89.99, 'BA', 3.5],
    [85, 'BA', 3.5],
    [80, 'BB', 3],
    [75, 'CB', 2.5],
    [70, 'CC', 2],
    [65, 'DC', 1.5],
    [60, 'DD', 1],
    [50, 'FD', 0.5],
    [49.99, 'FF', 0],
    [0, 'FF', 0],
  ])('%p is %s (%p points)', (average, letter, points) => {
    expect(letterGrade(average)).toMatchObject({ letter, points });
  });

  it('returns null without an average', () => {
    expect(letterGrade(null)).toBeNull();
    expect(letterGrade(undefined)).toBeNull();
  });
});

describe('gpa', () => {
  it('TC-11: weights grade points by credits', () => {
    // AA (4.0) x 3 + CC (2.0) x 1 = 14 / 4 credits = 3.5
    expect(
      gpa([
        { credits: 3, average: 92 },
        { credits: 1, average: 71 },
      ]),
    ).toBe(3.5);
  });

  it('TC-11: a course with more credits counts more', () => {
    const light = gpa([
      { credits: 1, average: 95 },
      { credits: 4, average: 62 },
    ]);
    const heavy = gpa([
      { credits: 4, average: 95 },
      { credits: 1, average: 62 },
    ]);
    // (4 x 1 + 1 x 4) / 5 = 1.6 and (4 x 4 + 1 x 1) / 5 = 3.4
    expect(light).toBe(1.6);
    expect(heavy).toBe(3.4);
  });

  it('leaves out courses without grades', () => {
    expect(
      gpa([
        { credits: 3, average: 82 },
        { credits: 6, average: null },
      ]),
    ).toBe(3);
  });

  it('leaves out courses with 0 credits', () => {
    expect(
      gpa([
        { credits: 0, average: 40 },
        { credits: 2, average: 86 },
      ]),
    ).toBe(3.5);
  });

  it('returns null when no course has a grade', () => {
    expect(gpa([{ credits: 3, average: null }])).toBeNull();
    expect(gpa([])).toBeNull();
  });

  it('rounds to two decimals', () => {
    // (4 x 2 + 3.5 x 1) / 3 = 3.8333...
    expect(
      gpa([
        { credits: 2, average: 90 },
        { credits: 1, average: 85 },
      ]),
    ).toBe(3.83);
  });
});

describe('round2', () => {
  it('removes floating point noise', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
