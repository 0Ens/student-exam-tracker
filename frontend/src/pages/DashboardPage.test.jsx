import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockFetch, renderApp } from '../test/utils.jsx';

const user = { id: 1, email: 'ali@example.com', name: 'Ali' };

const cs201 = { id: 1, code: 'CS201', name: 'Algorithms' };
const mat101 = { id: 2, code: 'MAT101', name: 'Calculus' };

const grades = {
  gpa: 3.1,
  courses: [
    { ...cs201, credits: 4, average: 82.5, letter: 'BA', points: 3.5, gradedWeight: 40 },
    { ...mat101, credits: 3, average: null, letter: null, points: null, gradedWeight: 0 },
  ],
};

function item(id, title, type, date, daysLeft, course = cs201) {
  return { id, title, type, date, daysLeft, weight: 10, grade: null, courseId: course.id, course };
}

const deadlines = {
  days: 14,
  overdue: [item(1, 'Homework 2', 'assignment', '2026-11-10T00:00:00.000Z', -13, mat101)],
  upcoming: [
    item(2, 'Quiz 3', 'quiz', '2026-11-23T00:00:00.000Z', 0),
    item(3, 'Lab report', 'assignment', '2026-11-24T00:00:00.000Z', 1, mat101),
    item(4, 'Midterm', 'exam', '2026-11-30T00:00:00.000Z', 7),
  ],
};

function fakeBackend({ g = grades, d = deadlines, fail } = {}) {
  return mockFetch((method, path) => {
    if (path === '/auth/me') return jsonResponse(200, { user });
    if (fail && path === fail.path) return fail.response;
    if (path === '/grades') return jsonResponse(200, g);
    if (path.startsWith('/deadlines')) return jsonResponse(200, d);
    if (path === '/courses') return jsonResponse(200, []);
    if (path === '/courses/1') {
      return jsonResponse(200, { ...cs201, userId: 1, credits: 4, term: '2026 Fall' });
    }
    if (path === '/courses/1/exams') return jsonResponse(200, []);
    if (path === '/courses/1/grade') return jsonResponse(200, grades.courses[0]);
    return jsonResponse(404, { error: 'Not found' });
  });
}

beforeEach(() => {
  localStorage.setItem('token', 'tok');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dashboard', () => {
  it('shows the estimated GPA and the counts', async () => {
    fakeBackend();
    renderApp('/');
    expect(await screen.findByLabelText('Estimated GPA')).toHaveTextContent('3.10');
    expect(screen.getByLabelText('Upcoming items')).toHaveTextContent('3');
    expect(screen.getByLabelText('Overdue items')).toHaveTextContent('1');
  });

  it('asks for the next 14 days', async () => {
    const fetch = fakeBackend();
    renderApp('/');
    await screen.findByLabelText('Estimated GPA');
    expect(fetch.mock.calls.some(([url]) => url.endsWith('/deadlines?days=14'))).toBe(true);
  });

  it('TC-09: marks past items without a grade as overdue', async () => {
    fakeBackend();
    renderApp('/');
    const overdue = await screen.findByRole('list', { name: 'Overdue' });
    const [row] = within(overdue).getAllByRole('listitem');
    expect(row).toHaveTextContent('! Homework 2');
    expect(row).toHaveTextContent('MAT101 · 10 Nov · 10%');
    expect(row).toHaveTextContent('13 days ago');
    expect(row).toHaveClass('overdue');
  });

  it('TC-09: lists upcoming items sorted by date with the days left', async () => {
    fakeBackend();
    renderApp('/');
    const upcoming = await screen.findByRole('list', { name: 'Upcoming' });
    const rows = within(upcoming).getAllByRole('listitem');
    expect(rows.map((r) => within(r).getByRole('strong').textContent)).toEqual([
      'Quiz 3',
      'Lab report',
      'Midterm',
    ]);
    expect(rows[0]).toHaveTextContent('today');
    expect(rows[1]).toHaveTextContent('tomorrow');
    expect(rows[2]).toHaveTextContent('in 7 days');
    expect(within(rows[2]).getByText('Exam')).toBeInTheDocument();
  });

  it('shows the average of every course', async () => {
    fakeBackend();
    renderApp('/');
    const table = await screen.findByRole('table');
    const [, first, second] = within(table).getAllByRole('row');
    expect(first).toHaveTextContent('CS201 Algorithms');
    expect(first).toHaveTextContent('82.5 (40% graded)');
    expect(first).toHaveTextContent('BA');
    expect(second).toHaveTextContent('No grades');
  });

  it('opens a course from the dashboard', async () => {
    fakeBackend();
    renderApp('/');
    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getByRole('link', { name: 'CS201' }));
    expect(await screen.findByRole('heading', { name: 'CS201 Algorithms' })).toBeInTheDocument();
  });

  it('hides the overdue section and shows a message when nothing is due', async () => {
    fakeBackend({ d: { days: 14, overdue: [], upcoming: [] } });
    renderApp('/');
    expect(await screen.findByText('Nothing in the next 14 days.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Overdue' })).not.toBeInTheDocument();
  });

  it('shows "No grades yet" when there is no GPA', async () => {
    fakeBackend({ g: { ...grades, gpa: null } });
    renderApp('/');
    expect(await screen.findByLabelText('Estimated GPA')).toHaveTextContent('-');
    expect(screen.getByText('No grades yet')).toBeInTheDocument();
  });

  it('asks a new user to add a course', async () => {
    fakeBackend({ g: { gpa: null, courses: [] }, d: { days: 14, overdue: [], upcoming: [] } });
    renderApp('/');
    expect(await screen.findByText('You have no courses yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Add your first course' }));
    expect(await screen.findByRole('heading', { name: 'My courses' })).toBeInTheDocument();
  });

  it('shows an error when the data can not be loaded', async () => {
    fakeBackend({
      fail: { path: '/grades', response: jsonResponse(500, { error: 'Something went wrong' }) },
    });
    renderApp('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load the dashboard: Something went wrong',
    );
    expect(screen.getByRole('heading', { name: 'Hello, Ali' })).toBeInTheDocument();
  });
});
