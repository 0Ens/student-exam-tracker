import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockFetch, renderApp } from '../test/utils.jsx';

const user = { id: 1, email: 'ali@example.com', name: 'Ali' };

const cs201 = { id: 1, code: 'CS201', name: 'Algorithms' };
const mat101 = { id: 2, code: 'MAT101', name: 'Calculus' };

function exam(id, title, type, date, course, grade = null) {
  return { id, title, type, date, weight: 20, grade, courseId: course.id, course };
}

const exams = [
  exam(1, 'Midterm', 'exam', '2026-11-20T00:00:00.000Z', cs201, 75),
  exam(2, 'Quiz 1', 'quiz', '2026-11-25T00:00:00.000Z', cs201),
  exam(3, 'Midterm', 'exam', '2026-11-27T00:00:00.000Z', mat101),
  exam(4, 'Homework 1', 'assignment', '2026-12-02T00:00:00.000Z', mat101),
];

// A small copy of the backend search: text, course and type filters.
function fakeSearch(query) {
  const q = (query.get('q') || '').toLowerCase();
  return exams.filter(
    (e) =>
      (!q || e.title.toLowerCase().includes(q) || e.course.code.toLowerCase().includes(q)) &&
      (!query.get('courseId') || e.courseId === Number(query.get('courseId'))) &&
      (!query.get('type') || e.type === query.get('type')),
  );
}

function fakeBackend({ fail } = {}) {
  return mockFetch((method, path) => {
    if (path === '/auth/me') return jsonResponse(200, { user });
    if (path === '/courses') return jsonResponse(200, [cs201, mat101]);
    if (path === '/exams' || path.startsWith('/exams?')) {
      if (fail) return fail;
      return jsonResponse(200, fakeSearch(new URLSearchParams(path.split('?')[1])));
    }
    return jsonResponse(404, { error: 'Not found' });
  });
}

const searchCalls = (fetchMock) =>
  fetchMock.mock.calls
    .map(([url]) => url.replace(/^.*\/api/, ''))
    .filter((p) => p.startsWith('/exams'));

const resultTitles = () =>
  within(screen.getByRole('list', { name: 'Results' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

beforeEach(() => {
  localStorage.setItem('token', 'tok');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('search page', () => {
  it('can be opened from the top bar', async () => {
    fakeBackend();
    renderApp('/courses');

    await userEvent.click(await screen.findByRole('link', { name: 'Search' }));

    expect(await screen.findByRole('heading', { name: 'Search' })).toBeInTheDocument();
  });

  it('lists all items sorted by date when there are no filters', async () => {
    const fetchMock = fakeBackend();
    renderApp('/search');

    expect(await screen.findByText('4 results')).toBeInTheDocument();
    expect(searchCalls(fetchMock)).toEqual(['/exams']);
    const rows = resultTitles();
    expect(rows[0]).toMatch(/Midterm.*CS201.*20 Nov 2026.*Grade 75/);
    expect(rows[3]).toMatch(/Homework 1.*MAT101.*Not graded/);
  });

  it('TC-12: filters by course and by type "exam"', async () => {
    const fetchMock = fakeBackend();
    renderApp('/search');
    await screen.findByText('4 results');

    await userEvent.selectOptions(screen.getByLabelText('Course'), 'CS201 Algorithms');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'Exam');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('1 result')).toBeInTheDocument();
    expect(resultTitles()).toHaveLength(1);
    expect(resultTitles()[0]).toMatch(/Midterm.*CS201/);
    expect(searchCalls(fetchMock).at(-1)).toBe('/exams?courseId=1&type=exam');
  });

  it('TC-13: shows "No results" for a search that matches nothing', async () => {
    fakeBackend();
    renderApp('/search');
    await screen.findByText('4 results');

    await userEvent.type(screen.getByLabelText('Search'), 'physics');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText(/No results/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Results' })).not.toBeInTheDocument();
  });

  it('searches by text and keeps the filters in the URL', async () => {
    const fetchMock = fakeBackend();
    renderApp('/search?q=mat&type=exam');

    expect(await screen.findByText('1 result')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toHaveValue('mat');
    expect(screen.getByLabelText('Type')).toHaveValue('exam');
    expect(searchCalls(fetchMock)).toEqual(['/exams?q=mat&type=exam']);
  });

  it('clears all filters', async () => {
    fakeBackend();
    renderApp('/search?type=quiz');
    expect(await screen.findByText('1 result')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(await screen.findByText('4 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toHaveValue('');
  });

  it('shows the error of the API, for example a wrong date range', async () => {
    fakeBackend({
      fail: jsonResponse(400, {
        error: 'Validation failed',
        details: { to: ['From must be before To'] },
      }),
    });
    renderApp('/search?from=2026-12-10&to=2026-12-01');

    expect(await screen.findByRole('alert')).toHaveTextContent('From must be before To');
  });
});
