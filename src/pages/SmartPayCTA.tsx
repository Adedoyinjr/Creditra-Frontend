// src/pages/SmartPayCTA.tsx
import { useNavigate } from 'react-router-dom';

/**
 * SmartPayCTA
 * ---------------------------------------------------------------------------
 * A promotional call-to-action banner that points users at the "Smart Pay"
 * suggested-repayment feature on the Repay page (see RepayPage.tsx's
 * `handleSmartPay`). Designed to be dropped into the Dashboard or any page
 * that wants to surface the feature.
 *
 * NOTE on issue #689: the issue references `src/pages/SmartPayCTA.tsx`, but
 * no such file previously existed anywhere in the repo history. The closest
 * real precedent is the "Smart Pay" button inside RepayPage.tsx. This file
 * introduces SmartPayCTA as a standalone component so the responsive-image
 * requirement in #689 has somewhere concrete to live; it's flagged in the PR
 * description in case a differently-named target was actually intended.
 *
 * GrantFox FWC26 campaign (Stellar Wave) — responsive hero image.
 * Mirrors the pattern already merged in LoginPage.tsx for #704: uses
 * `srcSet` + `sizes` so mobile devices fetch the 480w asset instead of the
 * 1200w desktop asset, and reuses the same design-token-driven surface/
 * border/text colors so it matches dark mode automatically (this app is
 * dark-mode-only today; see ThemeContext.tsx).
 */

const SRCSET =
  '/assets/images/stellar-wave-sm.jpg 480w, ' +
  '/assets/images/stellar-wave-md.jpg 768w, ' +
  '/assets/images/stellar-wave-lg.jpg 1200w';

const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 480px, 480px';

export interface SmartPayCTAProps {
  /** Optional override for the suggested-amount copy shown under the heading. */
  suggestedAmountLabel?: string;
  /** Called instead of the default navigate-to-repay behavior, if provided. */
  onActivate?: () => void;
}

export function SmartPayCTA({ suggestedAmountLabel, onActivate }: SmartPayCTAProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onActivate) {
      onActivate();
      return;
    }
    navigate('/repay');
  };

  return (
    <section
      aria-labelledby="smart-pay-cta-heading"
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/*
        Responsive campaign image. `src` is the mid-size fallback for
        browsers that don't support srcset; `srcSet`/`sizes` let capable
        browsers pick the smallest asset that satisfies the rendered width,
        so phones on the (max-width: 640px) breakpoint download the 480w
        asset (~1/3 the byte size of the 1200w desktop asset) instead of a
        desktop-sized image.
      */}
      <img
        src="/assets/images/stellar-wave-md.jpg"
        srcSet={SRCSET}
        sizes={SIZES}
        alt="GrantFox FWC26 Stellar Wave campaign banner"
        width={480}
        height={192}
        className="w-full h-32 sm:h-40 object-cover"
        loading="lazy"
        decoding="async"
      />

      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            id="smart-pay-cta-heading"
            className="font-semibold"
            style={{ color: 'var(--text)', fontSize: 'var(--text-lg)' }}
          >
            Try Smart Pay
          </h2>
          <p
            className="mt-1"
            style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}
          >
            {suggestedAmountLabel ??
              'Let us suggest a repayment amount based on your balance and due date.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClick}
          aria-label="Activate Smart Pay to review a suggested repayment"
          className="shrink-0 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#0d1117',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Smart Pay
        </button>
      </div>
    </section>
  );
}

export default SmartPayCTA;
