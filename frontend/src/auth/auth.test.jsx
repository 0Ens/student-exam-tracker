import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockFetch, renderApp } from '../test/utils.jsx';

// Answers of the dashboard API for a new user without courses.
function emptyDashboard(path) {
  if (path === '/grades') return jsonResponse(200, { gpa: null, courses: [] });
  if (path.startsWith('/deadlines'))
    return jsonResponse(200, { days: 14, overdue: [], upcoming: [] });
  return jsonResponse(404, { error: 'Not found' });
}

const user = { id: 1, email: 'ali@example.com', name: 'Ali' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('protected routes', () => {
  it('TC-03: redirects to the login page when not logged in', async () => {
    const fetch = mockFetch(() => jsonResponse(401, { error: 'Authentication required' }));
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('restores the session from a stored token', async () => {
    localStorage.setItem('token', 'abc');
    const fetch = mockFetch((method, path) =>
      path === '/auth/me' ? jsonResponse(200, { user }) : jsonResponse(404, {}),
    );
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Hello, Ali' })).toBeInTheDocument();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');
  });

  it('drops an invalid stored token and shows the login page', async () => {
    localStorage.setItem('token', 'expired');
    mockFetch(() => jsonResponse(401, { error: 'Invalid or expired token' }));
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('login page', () => {
  it('logs in and opens the dashboard', async () => {
    mockFetch((method, path, body) =>
      path === '/auth/login' && body.password === 'password123'
        ? jsonResponse(200, { token: 'tok', user })
        : jsonResponse(401, { error: 'Invalid e-mail or password' }),
    );
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ali@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Hello, Ali' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('TC-04: shows an error for a wrong password and stays on login', async () => {
    mockFetch(() => jsonResponse(401, { error: 'Invalid e-mail or password' }));
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ali@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid e-mail or password');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('TC-04: logout clears the token and returns to login', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch((method, path) =>
      path === '/auth/me' ? jsonResponse(200, { user }) : emptyDashboard(path),
    );
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('register page', () => {
  async function fillRegister() {
    await userEvent.type(screen.getByLabelText('Name'), 'Ali');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ali@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
  }

  it('TC-01: registers and opens the dashboard', async () => {
    const fetch = mockFetch((method, path) =>
      path === '/auth/register' ? jsonResponse(201, { token: 'new', user }) : emptyDashboard(path),
    );
    renderApp('/register');
    await fillRegister();

    expect(await screen.findByRole('heading', { name: 'Hello, Ali' })).toBeInTheDocument();
    expect(fetch.mock.calls[0][1].method).toBe('POST');
    expect(localStorage.getItem('token')).toBe('new');
  });

  it('TC-02: shows an error when the e-mail is already registered', async () => {
    mockFetch(() => jsonResponse(409, { error: 'E-mail is already registered' }));
    renderApp('/register');
    await fillRegister();

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail is already registered');
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });
});
