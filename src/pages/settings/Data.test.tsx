import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import DataPrivacySettings from './Data';

describe('DataPrivacySettings', () => {
  it('renders Data & Privacy heading', () => {
    render(<DataPrivacySettings />);

    expect(
      screen.getByRole('heading', { name: /data & privacy/i })
    ).toBeInTheDocument();
  });

  it('renders Export Your Data section', () => {
    render(<DataPrivacySettings />);

    expect(
      screen.getByRole('heading', { name: /export your data/i })
    ).toBeInTheDocument();
  });

  it('renders Export My Data button in idle state', () => {
    render(<DataPrivacySettings />);

    const button = screen.getByRole('button', { name: /export my data/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('button has download icon in idle state', () => {
    const { container } = render(<DataPrivacySettings />);

    const button = screen.getByRole('button', { name: /export my data/i });
    
    // Icon should be present (lucide-react renders SVG)
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('button has correct aria-label in idle state', () => {
    render(<DataPrivacySettings />);

    const button = screen.getByRole('button');
    const ariaLabel = button.getAttribute('aria-label') || '';
    expect(ariaLabel.toLowerCase()).toMatch(/export my data as json/);
  });

  it('aria-live region is present with correct attributes', () => {
    render(<DataPrivacySettings />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders Data Retention section', () => {
    render(<DataPrivacySettings />);

    expect(
      screen.getByRole('heading', { name: /data retention/i })
    ).toBeInTheDocument();
  });

  it('renders Privacy & Security section', () => {
    render(<DataPrivacySettings />);

    expect(
      screen.getByRole('heading', { name: /privacy & security/i })
    ).toBeInTheDocument();
  });

  it('has touch-target friendly button', () => {
    render(<DataPrivacySettings />);

    const button = screen.getByRole('button', { name: /export my data/i });
    
    // Verify the button has the appropriate class for styling
    expect(button).toHaveClass('data-privacy-page__export-button');
  });

  it('renders main element with aria-labelledby', () => {
    const { container } = render(<DataPrivacySettings />);
    
    const main = container.querySelector('main');
    expect(main).toHaveAttribute('aria-labelledby', 'data-privacy-title');
  });

  it('all major sections have proper structure', () => {
    render(<DataPrivacySettings />);

    const headings = screen.getAllByRole('heading');
    
    // Should have: title + 3 sections (Export, Retention, Privacy)
    expect(headings.length).toBeGreaterThanOrEqual(4);
    
    // Check main title
    expect(headings[0]).toHaveTextContent(/data & privacy/i);
  });

  it('export button is not disabled by default', () => {
    render(<DataPrivacySettings />);

    const button = screen.getByRole('button', { name: /export my data/i });
    expect(button).not.toBeDisabled();
  });

  it('renders all three informational sections', () => {
    render(<DataPrivacySettings />);

    expect(screen.getByText(/Download a copy of your Creditra data/i)).toBeInTheDocument();
    expect(screen.getByText(/Your data is retained for the duration/i)).toBeInTheDocument();
    expect(screen.getByText(/Your personal and financial information is encrypted/i)).toBeInTheDocument();
  });
});

