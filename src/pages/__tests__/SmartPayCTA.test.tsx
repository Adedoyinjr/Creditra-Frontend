/**
 * SmartPayCTA — responsive image (srcset) & accessibility tests (#689)
 *
 * GrantFox FWC26 campaign (Stellar Wave). Mirrors the coverage added for
 * LoginPage's campaign image (#704): verify the banner ships a real
 * srcset/sizes pair so mobile clients aren't forced to download the
 * desktop-sized asset, plus baseline accessibility and interaction checks
 * for the CTA itself.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SmartPayCTA } from '../SmartPayCTA';

function renderCTA(props: React.ComponentProps<typeof SmartPayCTA> = {}) {
  return render(
    <MemoryRouter>
      <SmartPayCTA {...props} />
    </MemoryRouter>,
  );
}

describe('SmartPayCTA — responsive campaign image (GrantFox FWC26 / #689)', () => {
  it('renders the Stellar Wave campaign banner with accessible alt text', () => {
    renderCTA();
    const image = screen.getByAltText(/GrantFox FWC26 Stellar Wave campaign banner/i);
    expect(image).toBeInTheDocument();
  });

  it('includes a responsive srcset with mobile, tablet, and desktop width candidates', () => {
    renderCTA();
    const image = screen.getByAltText(/GrantFox FWC26 Stellar Wave campaign banner/i);
    const srcset = image.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    expect(srcset).toContain('480w');
    expect(srcset).toContain('768w');
    expect(srcset).toContain('1200w');
  });

  it('configures a sizes attribute so mobile viewports request the smallest candidate', () => {
    renderCTA();
    const image = screen.getByAltText(/GrantFox FWC26 Stellar Wave campaign banner/i);
    const sizes = image.getAttribute('sizes');
    expect(sizes).toBeTruthy();
    // Below the 640px breakpoint the image should request the full viewport
    // width (which resolves to the 480w candidate), not a fixed desktop size.
    expect(sizes).toContain('(max-width: 640px) 100vw');
  });

  it('provides a fallback src for browsers without srcset support', () => {
    renderCTA();
    const image = screen.getByAltText(
      /GrantFox FWC26 Stellar Wave campaign banner/i,
    ) as HTMLImageElement;
    expect(image.getAttribute('src')).toContain('/assets/images/stellar-wave-md.jpg');
  });

  it('sets explicit width/height to prevent layout shift while the image loads', () => {
    renderCTA();
    const image = screen.getByAltText(/GrantFox FWC26 Stellar Wave campaign banner/i);
    expect(image).toHaveAttribute('width', '480');
    expect(image).toHaveAttribute('height', '192');
  });

  it('lazy-loads the banner since it is decorative/below-the-fold on most pages', () => {
    renderCTA();
    const image = screen.getByAltText(/GrantFox FWC26 Stellar Wave campaign banner/i);
    expect(image).toHaveAttribute('loading', 'lazy');
  });
});

describe('SmartPayCTA — content & accessibility', () => {
  it('renders a heading identifying the feature', () => {
    renderCTA();
    expect(screen.getByRole('heading', { name: /try smart pay/i })).toBeInTheDocument();
  });

  it('associates the section with the heading via aria-labelledby', () => {
    renderCTA();
    const heading = screen.getByRole('heading', { name: /try smart pay/i });
    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('renders the default suggestion copy when no override is provided', () => {
    renderCTA();
    expect(
      screen.getByText(/suggest a repayment amount based on your balance/i),
    ).toBeInTheDocument();
  });

  it('renders a custom suggestedAmountLabel when provided', () => {
    renderCTA({ suggestedAmountLabel: 'Suggested repayment: $3,200.00' });
    expect(screen.getByText('Suggested repayment: $3,200.00')).toBeInTheDocument();
  });

  it('exposes an accessible name on the activation button describing its effect', () => {
    renderCTA();
    expect(
      screen.getByRole('button', { name: /activate smart pay to review a suggested repayment/i }),
    ).toBeInTheDocument();
  });
});

describe('SmartPayCTA — interaction', () => {
  it('calls onActivate instead of navigating when provided', () => {
    const onActivate = vi.fn();
    renderCTA({ onActivate });
    fireEvent.click(screen.getByRole('button', { name: /smart pay/i }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('is keyboard-activatable (native button semantics)', () => {
    renderCTA();
    const button = screen.getByRole('button', { name: /smart pay/i });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });
});
