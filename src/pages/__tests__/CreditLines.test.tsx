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
    expect(screen.getByText('Primary Business Line')).toBeInTheDocument();
    expect(screen.getByText('Expansion Capital Line')).toBeInTheDocument();
    expect(screen.getByText('Working Capital Facility')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    renderPage();
    expect(screen.getAllByText(/Status/).length).toBeGreaterThan(0);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('shows Last Activity timestamp on each credit line card', () => {
    renderPage();
    const lastActivityLabels = screen.getAllByText('Last Activity');
    expect(lastActivityLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('shows relative time for updatedAt on each card', () => {
    renderPage();
    const timeElements = document.querySelectorAll('.cl-last-activity__time');
    expect(timeElements.length).toBeGreaterThanOrEqual(3);
    timeElements.forEach(el => {
      expect(el.textContent).toMatch(/(m|h|d ago|[A-Z][a-z]{2} \d{1,2}, \d{4})/);
    });
  });

  it('renders AccessibleTooltip with absolute timestamp for each card', () => {
    renderPage();
    const tooltips = document.querySelectorAll('.accessible-tooltip');
    expect(tooltips.length).toBeGreaterThanOrEqual(3);
  });

  it('renders tooltip content with "Last updated:" prefix', () => {
    renderPage();
    const tooltipContents = document.querySelectorAll('.accessible-tooltip__content');
    expect(tooltipContents.length).toBeGreaterThanOrEqual(3);
    tooltipContents.forEach(el => {
      expect(el.textContent).toMatch(/^Last updated: /);
    });
  });

  it('displays APR, Risk Score, and Opened date for each card', () => {
    renderPage();
    const card = screen.getByText('Primary Business Line').closest('.cl-card');
    expect(card).toBeInTheDocument();
    expect(card?.textContent).toMatch(/APR/);
    expect(card?.textContent).toMatch(/Risk Score/);
    expect(card?.textContent).toMatch(/Opened/);
  });

  describe("skeleton loading state", () => {
    it("renders credit lines skeletons during the loading phase", () => {
      const { container } = renderPage();
      
      // Initially, it should be in loading state
      const skeletonGrid = screen.getByTestId("creditlines-skeleton-grid");
      expect(skeletonGrid).toBeInTheDocument();
      expect(skeletonGrid.getAttribute("aria-busy")).toBe("true");

      const skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("removes skeletons after loading completes", async () => {
      vi.useFakeTimers();
      const { container } = renderPage();

      // Check skeletons exist initially
      expect(screen.getByTestId("creditlines-skeleton-grid")).toBeInTheDocument();

      // Fast-forward simulated loading time (500ms)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Skeletons should be replaced by real credit lines content
      expect(screen.queryByTestId("creditlines-skeleton-grid")).not.toBeInTheDocument();
      expect(screen.getByText("Primary Business Line")).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});

import { act } from "react";
