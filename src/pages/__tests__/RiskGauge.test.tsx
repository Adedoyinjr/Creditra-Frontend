/**
 * RiskGauge page tests
 *
 * Cover:
 *  1. Renders the gauge SVG when isEmpty is false (default).
 *  2. Renders EmptyState when isEmpty is true.
 *  3. EmptyState includes the NoDataGraph illustration, heading, and description.
 *  4. EmptyState shows "Check again" CTA when onRefresh is provided.
 *  5. EmptyState does NOT render the SVG or meta row.
 *  6. When isEmpty is false, the original gauge behaviour is preserved.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RiskGauge } from '../RiskGauge';

function renderRiskGauge(
  props: Partial<Parameters<typeof RiskGauge>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <RiskGauge {...props} />
    </MemoryRouter>,
  );
}

describe('RiskGauge page', () => {
  describe('normal (non-empty) state', () => {
    it('renders the gauge SVG with the score', () => {
      renderRiskGauge({
        score: 720,
        trend: 'improving',
        lastUpdated: '2025-03-01T00:00:00Z',
      });
      const svg = screen.getByTestId('risk-gauge-svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders the trend meta row', () => {
      renderRiskGauge({
        score: 720,
        trend: 'improving',
        lastUpdated: '2025-03-01T00:00:00Z',
      });
      expect(screen.getByText(/improving/i)).toBeInTheDocument();
    });

    it('makes the SVG keyboard focusable with tabIndex=0', () => {
      renderRiskGauge({
        score: 720,
        trend: 'improving',
        lastUpdated: '2025-03-01T00:00:00Z',
      });
      const svg = screen.getByTestId('risk-gauge-svg');
      expect(svg).toHaveAttribute('tabIndex', '0');
    });

    it('has appropriate ARIA attributes for accessibility', () => {
      renderRiskGauge({
        score: 720,
        trend: 'improving',
        lastUpdated: '2025-03-01T00:00:00Z',
      });
      const svg = screen.getByTestId('risk-gauge-svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label');
    });

    it('includes KbdHint component for keyboard shortcut hint', () => {
      renderRiskGauge({
        score: 720,
        trend: 'improving',
        lastUpdated: '2025-03-01T00:00:00Z',
      });
      expect(screen.getByText('Explain Risk')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders EmptyState when isEmpty is true', () => {
      renderRiskGauge({ isEmpty: true });
      // The EmptyState renders a heading with the title
      expect(
        screen.getByRole('heading', { name: /no risk data available/i }),
      ).toBeInTheDocument();
    });

    it('renders the description text', () => {
      renderRiskGauge({ isEmpty: true });
      expect(
        screen.getByText(
          /your risk score will appear here once your credit profile has been analyzed/i,
        ),
      ).toBeInTheDocument();
    });

    it('does NOT render the gauge SVG when empty', () => {
      renderRiskGauge({ isEmpty: true });
      expect(screen.queryByTestId('risk-gauge-svg')).not.toBeInTheDocument();
    });

    it('renders a "Check again" button when onRefresh is provided', () => {
      const onRefresh = vi.fn();
      renderRiskGauge({ isEmpty: true, onRefresh });
      const btn = screen.getByRole('button', { name: /check again/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('does NOT render a CTA button when onRefresh is not provided', () => {
      renderRiskGauge({ isEmpty: true });
      expect(
        screen.queryByRole('button', { name: /check again/i }),
      ).not.toBeInTheDocument();
    });

    it('renders the eyebrow text "Risk Score"', () => {
      renderRiskGauge({ isEmpty: true });
      expect(screen.getByText('Risk Score')).toBeInTheDocument();
    });
  });
});
