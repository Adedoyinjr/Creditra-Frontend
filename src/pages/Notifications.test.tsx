import React from 'react';
import { render, screen } from '@testing-library/react';
import { Notifications } from './Notifications';

describe('Notifications Page', () => {
  it('renders the themed empty state correctly', () => {
    render(<Notifications />);
    
    // Verify the empty state renders with the correct accessibility roles
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
    
    // Verify the title is present
    const title = screen.getByRole('heading', { level: 2, name: /no notifications yet/i });
    expect(title).toBeInTheDocument();
    
    // Verify the description text
    expect(screen.getByText(/when you have new alerts/i)).toBeInTheDocument();
  });
});
