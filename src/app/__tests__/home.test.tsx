import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../../app/page';

describe('home page', () => {
  it('links users into the email templates dashboard', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /email templates dashboard/i })).toBeInTheDocument();
  });
});
