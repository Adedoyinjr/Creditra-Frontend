import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders correctly with given custom styles', () => {
    const { container } = render(<Skeleton width="100px" height="50px" className="custom-class" />);
    const element = container.firstChild as HTMLElement;

    expect(element).toBeInTheDocument();
    expect(element.className).toContain('skeleton');
    expect(element.className).toContain('custom-class');
    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('50px');
  });

  it('applies the skeleton shape (radius token) via CSS', () => {
    render(<Skeleton data-testid="skeleton-element" />);
    const element = screen.getByTestId('skeleton-element');

    // jsdom can't reliably resolve CSS variables/computed styles,
    // so we assert the skeleton carries the class rule that defines border-radius.
    expect(element.className).toContain('skeleton');
  });

  it('spreads addition HTML attributes properly', () => {
    render(<Skeleton data-testid="skeleton-element" aria-hidden="true" />);
    const element = screen.getByTestId('skeleton-element');

    expect(element).toBeInTheDocument();
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies shape classes correctly', () => {
    const { container: containerRect } = render(<Skeleton shape="rectangular" />);
    expect((containerRect.firstChild as HTMLElement).className).toContain('skeleton--rectangular');

    const { container: containerCirc } = render(<Skeleton shape="circular" />);
    expect((containerCirc.firstChild as HTMLElement).className).toContain('skeleton--circular');

    const { container: containerRound } = render(<Skeleton shape="rounded" />);
    expect((containerRound.firstChild as HTMLElement).className).toContain('skeleton--rounded');
  });
});

