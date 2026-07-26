/**
 * CollateralSubstitutionModal — button order tests
 *
 * Verifies that every step of the 3-step collateral substitution flow
 * renders action buttons in the order mandated by docs/BUTTON_ORDER.md:
 *
 *   Cancel (exit flow) — Back (previous step) — Primary (forward / confirm)
 *
 * The DOM position of a button determines its visual position in the footer,
 * so these tests query all footer buttons by role and assert relative indices.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollateralSubstitutionModal } from './CollateralSubstitutionModal';

// Suppress hooks that interact with the DOM environment
vi.mock('../hooks/useBodyScrollLock', () => ({ useBodyScrollLock: vi.fn() }));
vi.mock('../hooks/useInertBackdrop', () => ({ useInertBackdrop: vi.fn() }));

/** Returns all visible action buttons in the modal footer, excluding the ✕ close button. */
function getFooterButtons() {
  return screen
    .getAllByRole('button')
    .filter(
      (btn) =>
        !btn.getAttribute('aria-label')?.toLowerCase().includes('close'),
    );
}

/** Returns the index of a button whose visible text matches `label`. */
function indexOfButton(buttons: HTMLElement[], label: string | RegExp): number {
  return buttons.findIndex((b) => {
    const text = b.textContent?.trim() ?? '';
    return typeof label === 'string' ? text === label : label.test(text);
  });
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  creditLineName: 'Test Credit Line',
  loanBalance: 10_000,
  currentAsset: undefined,
  _delayMs: 0, // disable artificial network delay in tests
};

describe('CollateralSubstitutionModal — button order (docs/BUTTON_ORDER.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Step 1: Select ─────────────────────────────────────────────────────────

  describe('Step 1 (Select)', () => {
    it('renders Cancel before the primary Review button', () => {
      render(<CollateralSubstitutionModal {...defaultProps} />);

      const buttons = getFooterButtons();
      const cancelIdx  = indexOfButton(buttons, 'Cancel');
      const reviewIdx  = indexOfButton(buttons, 'Review');

      expect(cancelIdx).toBeGreaterThanOrEqual(0);
      expect(reviewIdx).toBeGreaterThanOrEqual(0);
      // Cancel must precede the primary action in the DOM
      expect(cancelIdx).toBeLessThan(reviewIdx);
    });

    it('does NOT render a Back button on the first step', () => {
      render(<CollateralSubstitutionModal {...defaultProps} />);

      const buttons = getFooterButtons();
      expect(indexOfButton(buttons, 'Back')).toBe(-1);
    });
  });

  // ── Step 2: Review ─────────────────────────────────────────────────────────

  describe('Step 2 (Review)', () => {
    async function renderAtReviewStep() {
      const user = userEvent.setup();
      render(<CollateralSubstitutionModal {...defaultProps} />);

      // Select the first available asset option
      const assetOption = screen.getAllByRole('option')[0];
      await user.click(assetOption);

      // Advance to Review step
      await user.click(screen.getByRole('button', { name: 'Review' }));
    }

    it('renders Cancel → Back → Continue in that DOM order', async () => {
      await renderAtReviewStep();

      const buttons    = getFooterButtons();
      const cancelIdx  = indexOfButton(buttons, 'Cancel');
      const backIdx    = indexOfButton(buttons, 'Back');
      const continueIdx = indexOfButton(buttons, 'Continue');

      expect(cancelIdx).toBeGreaterThanOrEqual(0);
      expect(backIdx).toBeGreaterThanOrEqual(0);
      expect(continueIdx).toBeGreaterThanOrEqual(0);

      // Rule: Cancel < Back < Primary
      expect(cancelIdx).toBeLessThan(backIdx);
      expect(backIdx).toBeLessThan(continueIdx);
    });

    it('Back returns to the Select step', async () => {
      const user = userEvent.setup();
      await renderAtReviewStep();

      await user.click(screen.getByRole('button', { name: 'Back' }));

      // After going back the "Review" button (step 1 primary) is visible again
      expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    });

    it('Cancel calls onClose', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CollateralSubstitutionModal {...defaultProps} onClose={onClose} />);

      const assetOption = screen.getAllByRole('option')[0];
      await user.click(assetOption);
      await user.click(screen.getByRole('button', { name: 'Review' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Step 3: Confirm ────────────────────────────────────────────────────────

  describe('Step 3 (Confirm)', () => {
    async function renderAtConfirmStep() {
      const user = userEvent.setup();
      render(<CollateralSubstitutionModal {...defaultProps} />);

      const assetOption = screen.getAllByRole('option')[0];
      await user.click(assetOption);
      await user.click(screen.getByRole('button', { name: 'Review' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));
    }

    it('renders Cancel → Back → Confirm substitution in that DOM order', async () => {
      await renderAtConfirmStep();

      const buttons     = getFooterButtons();
      const cancelIdx   = indexOfButton(buttons, 'Cancel');
      const backIdx     = indexOfButton(buttons, 'Back');
      const confirmIdx  = indexOfButton(buttons, /confirm substitution/i);

      expect(cancelIdx).toBeGreaterThanOrEqual(0);
      expect(backIdx).toBeGreaterThanOrEqual(0);
      expect(confirmIdx).toBeGreaterThanOrEqual(0);

      // Rule: Cancel < Back < Primary
      expect(cancelIdx).toBeLessThan(backIdx);
      expect(backIdx).toBeLessThan(confirmIdx);
    });

    it('"Confirm substitution" is disabled until the asset name is typed', async () => {
      await renderAtConfirmStep();

      expect(
        screen.getByRole('button', { name: /confirm substitution/i }),
      ).toBeDisabled();
    });

    it('enables "Confirm substitution" once the asset name is typed correctly', async () => {
      const user = userEvent.setup();
      await renderAtConfirmStep();

      // The input placeholder carries the expected asset name
      const input = screen.getByRole('textbox');
      const assetName = input.getAttribute('placeholder') ?? '';

      await user.type(input, assetName);

      expect(
        screen.getByRole('button', { name: /confirm substitution/i }),
      ).not.toBeDisabled();
    });

    it('Back returns to the Review step from the Confirm step', async () => {
      const user = userEvent.setup();
      await renderAtConfirmStep();

      await user.click(screen.getByRole('button', { name: 'Back' }));

      // After going back the "Continue" button (step 2 primary) is visible again
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('does not render footer buttons when modal is closed', () => {
      render(<CollateralSubstitutionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('disables Cancel and Back while submission is pending', async () => {
      const user = userEvent.setup();
      // Use a long delay so the modal stays in pending state during assertion
      render(<CollateralSubstitutionModal {...defaultProps} _delayMs={60_000} />);

      const assetOption = screen.getAllByRole('option')[0];
      await user.click(assetOption);
      await user.click(screen.getByRole('button', { name: 'Review' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      // The input placeholder carries the expected asset name
      const input = screen.getByRole('textbox');
      const assetName = input.getAttribute('placeholder') ?? '';
      await user.type(input, assetName);
      await user.click(screen.getByRole('button', { name: /confirm substitution/i }));

      // While pending, both secondary buttons must be disabled
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    });
  });
});
