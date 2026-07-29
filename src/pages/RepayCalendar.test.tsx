import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RepayCalendar } from './RepayCalendar';

describe('RepayCalendar', () => {
  const sampleEvents = [
    { date: '2026-08-01', amount: 1500, label: 'Monthly payment' },
    { date: '2026-09-01', amount: 1500, label: 'Monthly payment' },
  ];

  it('renders events with dates and amounts', () => {
    render(<RepayCalendar events={sampleEvents} />);
    expect(screen.getByText('Upcoming Payments')).toBeInTheDocument();
    expect(screen.getAllByText('Monthly payment').length).toBe(2);
  });

  it('renders empty state when no events', () => {
    render(<RepayCalendar events={[]} />);
    expect(screen.getByText('No upcoming payments.')).toBeInTheDocument();
  });

  it('uses aria-live="polite" region', () => {
    render(<RepayCalendar events={sampleEvents} />);
    const section = screen.getByLabelText('Repayment calendar');
    expect(section).toHaveAttribute('aria-live', 'polite');
  });

  it('renders children below the calendar', () => {
    render(
      <RepayCalendar events={sampleEvents}>
        <button>Set up autopay</button>
      </RepayCalendar>,
    );
    expect(
      screen.getByRole('button', { name: 'Set up autopay' }),
    ).toBeInTheDocument();
  });

  it('renders time elements with dateTime attributes', () => {
    render(<RepayCalendar events={sampleEvents} />);
    const times = document.querySelectorAll('time');
    expect(times.length).toBe(2);
    expect(times[0]).toHaveAttribute('dateTime', '2026-08-01');
  });
});
