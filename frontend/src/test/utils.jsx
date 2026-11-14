import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App.jsx';
import { AuthProvider } from '../auth/AuthContext.jsx';

export function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

export function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

// Replaces global fetch with a handler: (method, path, body) => response.
export function mockFetch(handler) {
  const fn = vi.fn((url, options = {}) => {
    const path = url.replace(/^.*\/api/, '');
    const body = options.body ? JSON.parse(options.body) : undefined;
    return Promise.resolve(handler(options.method || 'GET', path, body, options));
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
