import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CreditLines from '../CreditLines';

function renderPage() {
  return render(
    <BrowserRouter>
      <CreditLines />
    </BrowserRouter>
  );
}

describe('CreditLines page', () => {
  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('Credit Lines')).toBeInTheDocument();
    expect(screen.getByText('Manage your credit facilities')).toBeInTheDocument();
  });

  it('renders credit line cards from mock data', () => {
    renderPage();
    // Use getAllByText since the RepaymentSchedule section also repeats line names
    expect(screen.getAllByText('Primary Business Line').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Expansion Capital Line').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Working Capital Facility').length).toBeGreaterThanOrEqual(1);
  });

  it('renders filter controls', () => {
    renderPage();
    expect(screen.getAllByText(/Status/).length).toBeGreaterThan(0);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('shows "Last activity:" label on each credit line card', () => {
    renderPage();
    // LastActivityStamp renders "Last activity: <relative>" in every card
    const lastActivityLabels = screen.getAllByText(/Last activity:/i);
    expect(lastActivityLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('renders a <time> element with a dateTime attribute on each card', () => {
    renderPage();
    const timeElements = document.querySelectorAll('time[datetime]');
    expect(timeElements.length).toBeGreaterThanOrEqual(3);
    timeElements.forEach(el => {
      const dt = el.getAttribute('datetime');
      // Must be a parseable ISO 8601 string
      expect(new Date(dt!).getTime()).not.toBeNaN();
    });
  });

  it('renders an info tooltip trigger for each last-activity stamp', () => {
    renderPage();
    // Each card has an "i" trigger for the absolute datetime tooltip
    const triggers = document.querySelectorAll('.last-activity-stamp__trigger');
    expect(triggers.length).toBeGreaterThanOrEqual(3);
  });

  it('renders tooltip with role="tooltip" containing the absolute datetime', () => {
    renderPage();
    const tooltips = document.querySelectorAll('[role="tooltip"]');
    expect(tooltips.length).toBeGreaterThanOrEqual(3);
    // Every tooltip should include a year (absolute datetime)
    tooltips.forEach(el => {
      expect(el.textContent).toMatch(/\d{4}/);
    });
  });

  it('displays APR, Risk Score, and Opened date for each card', () => {
    renderPage();
    // Scope to the card heading (h3) to avoid ambiguity with the RepaymentSchedule section
    const cardHeading = screen.getAllByRole('heading', { name: 'Primary Business Line' })[0];
    const card = cardHeading.closest('.cl-card');
    expect(card).toBeInTheDocument();
    expect(card?.textContent).toMatch(/APR/);
    expect(card?.textContent).toMatch(/Risk Score/);
    expect(card?.textContent).toMatch(/Opened/);
  });
});
