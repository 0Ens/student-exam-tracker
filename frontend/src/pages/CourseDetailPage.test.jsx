import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockFetch, renderApp } from '../test/utils.jsx';

const user = { id: 1, email: 'ali@example.com', name: 'Ali' };

const course = {
  id: 1,
  userId: 1,
  name: 'Algorithms',
  code: 'CS201',
  credits: 4,
  term: '2026 Fall',
};

const midterm = {
  id: 10,
  courseId: 1,
  title: 'Midterm',
  type: 'exam',
  date: '2026-11-20T00:00:00.000Z',
  weight: 40,
  grade: null,
};

// Same rule as the backend: weighted average of the graded exams.
function gradeOf(exams) {
  const graded = exams.filter((e) => e.grade !== null && e.grade !== undefined);
  const gradedWeight = graded.reduce((sum, e) => sum + e.weight, 0);
  const average = gradedWeight
    ? Math.round((graded.reduce((sum, e) => sum + e.grade * e.weight, 0) / gradedWeight) * 100) /
      100
    : null;
  const letter = average === null ? null : average >= 90 ? 'AA' : average >= 65 ? 'CC' : 'FF';
  return { id: 1, average, letter, gradedWeight };
}

// Small in-memory fake of the courses, exams and grades API.
function fakeBackend(initialExams = [], { failCreate } = {}) {
  let exams = [...initialExams];
  let nextId = 100;
  return mockFetch((method, path, body) => {
    if (path === '/auth/me') return jsonResponse(200, { user });
    if (path === '/courses' && method === 'GET') return jsonResponse(200, [course]);
    if (path === '/courses/1' && method === 'GET') return jsonResponse(200, course);
    if (path === '/courses/1/exams' && method === 'GET') return jsonResponse(200, exams);
    if (path === '/courses/1/grade') return jsonResponse(200, gradeOf(exams));
    if (path === '/courses/1/exams' && method === 'POST') {
      if (failCreate) return failCreate;
      const created = {
        id: nextId++,
        courseId: 1,
        ...body,
        date: `${body.date}T00:00:00.000Z`,
      };
      exams.push(created);
      return jsonResponse(201, created);
    }
    const id = Number(path.split('/')[2]);
    if (path.startsWith('/exams/') && method === 'PUT') {
      exams = exams.map((e) =>
        e.id === id ? { ...e, ...body, date: `${body.date}T00:00:00.000Z` } : e,
      );
      return jsonResponse(
        200,
        exams.find((e) => e.id === id),
      );
    }
    if (path.startsWith('/exams/') && method === 'DELETE') {
      exams = exams.filter((e) => e.id !== id);
      return { ok: true, status: 204, json: () => Promise.resolve({}) };
    }
    return jsonResponse(404, { error: 'Course not found' });
  });
}

async function fillExam({ title, type, date, weight, grade }) {
  if (title) await userEvent.type(screen.getByLabelText('Title'), title);
  if (type) await userEvent.selectOptions(screen.getByLabelText('Type'), type);
  if (date) await userEvent.type(screen.getByLabelText('Date'), date);
  if (weight) await userEvent.type(screen.getByLabelText('Weight (%)'), weight);
  if (grade) await userEvent.type(screen.getByLabelText('Grade (optional)'), grade);
}

const posts = (fetch) =>
  fetch.mock.calls.filter(([, options]) => options && options.method === 'POST');

beforeEach(() => {
  localStorage.setItem('token', 'tok');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('course detail page', () => {
  it('shows the course and an empty state', async () => {
    fakeBackend();
    renderApp('/courses/1');
    expect(await screen.findByRole('heading', { name: 'CS201 Algorithms' })).toBeInTheDocument();
    expect(screen.getByText(/No exams yet/)).toBeInTheDocument();
    expect(screen.getByText(/Weight used/)).toHaveTextContent('Weight used: 0% of 100%');
  });

  it('TC-07: adds an exam and shows it in the list', async () => {
    fakeBackend();
    renderApp('/courses/1');
    await screen.findByText(/No exams yet/);

    await fillExam({ title: 'Final', type: 'project', date: '2027-01-10', weight: '60' });
    await userEvent.click(screen.getByRole('button', { name: 'Add exam' }));

    const item = (await screen.findByText('Final')).closest('li');
    expect(within(item).getByText('Project')).toBeInTheDocument();
    expect(within(item).getByText(/10 Jan 2027 · 60% · Not graded yet/)).toBeInTheDocument();
    expect(screen.getByText(/Weight used/)).toHaveTextContent('60% of 100%');
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('TC-07: lists exams by date with their grade', async () => {
    fakeBackend([
      { ...midterm, id: 11, title: 'Quiz 2', date: '2026-12-01T00:00:00.000Z', grade: 75 },
      midterm,
    ]);
    renderApp('/courses/1');
    const items = await screen.findAllByRole('listitem');
    expect(items.map((li) => within(li).getByRole('strong').textContent)).toEqual([
      'Midterm',
      'Quiz 2',
    ]);
    expect(within(items[1]).getByText(/Grade 75/)).toBeInTheDocument();
  });

  it('TC-08: blocks a weight over what is left without calling the API', async () => {
    const fetch = fakeBackend([midterm]);
    renderApp('/courses/1');
    await screen.findByText('Midterm');

    await fillExam({ title: 'Final', date: '2027-01-10', weight: '70' });
    await userEvent.click(screen.getByRole('button', { name: 'Add exam' }));

    expect(screen.getByText('Only 60% is left for this course')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(posts(fetch)).toHaveLength(0);
  });

  it('TC-08: shows the server error when the weight rule fails there', async () => {
    fakeBackend([], {
      failCreate: jsonResponse(400, {
        error: 'Validation failed',
        details: { weight: ['Only 20% is left for this course'] },
      }),
    });
    renderApp('/courses/1');
    await screen.findByText(/No exams yet/);

    await fillExam({ title: 'Final', date: '2027-01-10', weight: '50' });
    await userEvent.click(screen.getByRole('button', { name: 'Add exam' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
    expect(screen.getByText('Only 20% is left for this course')).toBeInTheDocument();
  });

  it('shows that there is no average before the first grade', async () => {
    fakeBackend([midterm]);
    renderApp('/courses/1');
    expect(await screen.findByText('Course average: no grades yet')).toBeInTheDocument();
  });

  it('TC-10: shows the course average from the grades API', async () => {
    fakeBackend([
      { ...midterm, grade: 80 },
      {
        ...midterm,
        id: 11,
        title: 'Final',
        date: '2027-01-10T00:00:00.000Z',
        weight: 60,
        grade: 60,
      },
    ]);
    renderApp('/courses/1');
    expect(await screen.findByText(/Course average/)).toHaveTextContent(
      'Course average: 68 (CC, based on 100% graded)',
    );
  });

  it('updates the average after a grade is added', async () => {
    // Weight 100, so the add form is hidden and only the edit form is shown.
    fakeBackend([{ ...midterm, weight: 100 }]);
    renderApp('/courses/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Midterm' }));
    await userEvent.type(screen.getByLabelText('Grade (optional)'), '90');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/AA, based on/)).toHaveTextContent(
      'Course average: 90 (AA, based on 100% graded)',
    );
  });

  it('hides the add form when the weights reach 100%', async () => {
    fakeBackend([{ ...midterm, weight: 100 }]);
    renderApp('/courses/1');
    expect(await screen.findByText(/already add up to 100%/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add exam' })).not.toBeInTheDocument();
  });

  it('edits an exam and keeps its own weight free', async () => {
    fakeBackend([midterm, { ...midterm, id: 11, title: 'Final', weight: 60 }]);
    renderApp('/courses/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Midterm' }));

    const weight = screen.getByLabelText('Weight (%)');
    expect(weight).toHaveValue(40);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-20');
    await userEvent.type(screen.getByLabelText('Grade (optional)'), '88');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/40% · Grade 88/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('deletes an exam after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fakeBackend([midterm]);
    renderApp('/courses/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Midterm' }));
    expect(await screen.findByText(/No exams yet/)).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalledWith('Delete Midterm?');
  });

  it('keeps the exam when deletion is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetch = fakeBackend([midterm]);
    renderApp('/courses/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Midterm' }));
    expect(screen.getByText('Midterm')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, o]) => o && o.method === 'DELETE')).toBe(false);
  });

  it('shows a message for a course that does not exist', async () => {
    fakeBackend();
    renderApp('/courses/999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Course not found');
    expect(screen.getByRole('link', { name: 'Back to my courses' })).toBeInTheDocument();
  });

  it('opens the exams page from the courses list', async () => {
    fakeBackend([midterm]);
    renderApp('/courses');
    await userEvent.click(await screen.findByRole('link', { name: 'Exams for CS201' }));
    expect(await screen.findByRole('heading', { name: 'CS201 Algorithms' })).toBeInTheDocument();
    expect(screen.getByText('Midterm')).toBeInTheDocument();
  });
});
