import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/utils.jsx';

describe('App', () => {
  it('renders the layout with the brand link', () => {
    renderApp('/login');
    expect(screen.getByRole('link', { name: 'Exam Tracker' })).toBeInTheDocument();
  });
});
