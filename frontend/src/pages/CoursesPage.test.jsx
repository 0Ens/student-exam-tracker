import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockFetch, renderApp } from '../test/utils.jsx';

const user = { id: 1, email: 'ali@example.com', name: 'Ali' };

// Small in-memory fake of the courses API.
function fakeBackend(initial = []) {
  let courses = [...initial];
  let nextId = 100;
  return mockFetch((method, path, body) => {
    if (path === '/auth/me') return jsonResponse(200, { user });
    if (path === '/courses' && method === 'GET') return jsonResponse(200, courses);
    if (path === '/courses' && method === 'POST') {
      const created = { id: nextId++, userId: 1, ...body };
      courses.push(created);
      return jsonResponse(201, created);
    }
    const id = Number(path.split('/')[2]);
    if (method === 'PUT') {
      courses = courses.map((c) => (c.id === id ? { ...c, ...body } : c));
      return jsonResponse(
        200,
        courses.find((c) => c.id === id),
      );
    }
    if (method === 'DELETE') {
      courses = courses.filter((c) => c.id !== id);
      return { ok: true, status: 204, json: () => Promise.resolve({}) };
    }
    return jsonResponse(404, { error: 'Not found' });
  });
}

const existing = {
  id: 1,
  userId: 1,
  name: 'Algorithms',
  code: 'CS201',
  credits: 4,
  term: '2026 Fall',
};

async function fillCourse({ name, code, credits, term }) {
  if (name) await userEvent.type(screen.getByLabelText('Course name'), name);
  if (code) await userEvent.type(screen.getByLabelText('Code'), code);
  if (credits) await userEvent.type(screen.getByLabelText('Credits'), credits);
  if (term) await userEvent.type(screen.getByLabelText('Term'), term);
}

beforeEach(() => {
  localStorage.setItem('token', 'tok');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('courses page', () => {
  it('shows an empty state when there are no courses', async () => {
    fakeBackend();
    renderApp('/courses');
    expect(await screen.findByText(/No courses yet/)).toBeInTheDocument();
  });

  it('TC-05: adds a course and shows it in the list', async () => {
    const fetch = fakeBackend();
    renderApp('/courses');
    await screen.findByText(/No courses yet/);

    await fillCourse({
      name: 'Software Project Management',
      code: 'SWE488',
      credits: '3',
      term: '2026 Fall',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }));

    expect(await screen.findByText('SWE488')).toBeInTheDocument();
    const post = fetch.mock.calls.find(([, opts]) => opts.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({
      name: 'Software Project Management',
      code: 'SWE488',
      credits: 3,
      term: '2026 Fall',
    });
  });

  it('TC-05: edits a course', async () => {
    fakeBackend([existing]);
    renderApp('/courses');
    await userEvent.click(await screen.findByRole('button', { name: 'Edit CS201' }));

    const item = screen.getByRole('button', { name: 'Save' }).closest('li');
    const name = within(item).getByLabelText('Course name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Data Structures');
    await userEvent.click(within(item).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Data Structures')).toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });

  it('TC-05: deletes a course after confirmation', async () => {
    fakeBackend([existing]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp('/courses');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete CS201' }));

    expect(await screen.findByText(/No courses yet/)).toBeInTheDocument();
  });

  it('keeps the course when deletion is cancelled', async () => {
    const fetch = fakeBackend([existing]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderApp('/courses');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete CS201' }));

    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, opts]) => opts.method === 'DELETE')).toBe(false);
  });

  it('TC-06: does not save a course without a name', async () => {
    const fetch = fakeBackend();
    renderApp('/courses');
    await screen.findByText(/No courses yet/);

    await fillCourse({ code: 'SWE488', credits: '3', term: '2026 Fall' });
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Course name')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch.mock.calls.some(([, opts]) => opts.method === 'POST')).toBe(false);
  });

  it('TC-06: shows validation errors returned by the server', async () => {
    mockFetch((method, path) => {
      if (path === '/auth/me') return jsonResponse(200, { user });
      if (method === 'GET') return jsonResponse(200, []);
      return jsonResponse(400, {
        error: 'Validation failed',
        details: { code: ['Code is too long'] },
      });
    });
    renderApp('/courses');
    await screen.findByText(/No courses yet/);

    await fillCourse({ name: 'Physics', code: 'PHYS', credits: '2', term: '2026 Fall' });
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
    expect(screen.getByText('Code is too long')).toBeInTheDocument();
  });
});
