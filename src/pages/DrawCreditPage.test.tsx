/// <reference types="vitest" />
/**
 * DrawCreditPage.test.tsx
 *
 * Focused test suite for the draw-credit flow (issue #586 — v7 token audit).
 * Covers:
 *   1.  Default render shows the "Select Credit Line" step
 *   2.  Selecting a credit line navigates to the "Enter Amount" step
 *   3.  Entering an amount above the limit shows an error banner
 *   4.  Entering a valid amount enables the Continue button
 *   5.  Quick-preset (50 %) populates the amount input correctly
 *   6.  Back from the amount step returns to the select step
 *   7.  Confirm step renders with a disabled Confirm button until terms accepted
 *   8.  Accepting terms enables the Confirm button
 *   9.  Submitting shows the accessible loading spinner (WCAG)
 *   10. Successful transaction renders "Draw Successful" heading
 *   11. "Make Another Draw" resets to the select step
 *
 * Setup notes:
 *   - `jsdom` environment (configured in vitest.config.ts)
 *   - Timer-based async is handled with `vi.useFakeTimers()` so tests run fast
 *   - No real network calls; the confirm handler uses `setTimeout` internally
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import DrawCreditPage from "./DrawCreditPage";
import * as ReducedMotionContext from "@/context/ReducedMotionContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render the page with real (non-mocked) timers by default */
function setup() {
  const user = userEvent.setup({ delay: null });
  render(<DrawCreditPage />);
  return { user };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DrawCreditPage — step navigation & token audit", () => {
  // ── 1. Default render ────────────────────────────────────────────────────
  it("1. renders the 'Select Credit Line' step by default", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: /select credit line/i }),
    ).toBeInTheDocument();

    // Mock data has 3 credit lines; each is a button with an aria-label
    expect(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    ).toBeInTheDocument();
  });

  // ── 2. Select a credit line ──────────────────────────────────────────────
  it("2. clicking a credit line navigates to the amount step", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );

    expect(
      screen.getByRole("heading", { name: /enter amount/i }),
    ).toBeInTheDocument();
  });

  // ── 3. Amount validation — over limit shows error ────────────────────────
  it("3. entering an amount above the limit shows an error banner", async () => {
    const { user } = setup();

    // Navigate to amount step
    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "99999"); // exceeds $35,000 available

    // Error message with role="alert" should appear
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/maximum available/i);
  });

  // ── 4. Valid amount enables Continue ─────────────────────────────────────
  it("4. entering a valid amount enables the Continue button", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "1000");

    expect(continueBtn).not.toBeDisabled();
  });

  // ── 5. Quick-preset populates the input ──────────────────────────────────
  it("5. clicking the 50% preset populates the input with half the available balance", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );

    // Business Line of Credit: available = $35,000 → 50% = $17,500
    await user.click(
      screen.getByRole("button", {
        name: /set amount to 50 percent/i,
      }),
    );

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("17500");
  });

  // ── 6. Back from amount step ─────────────────────────────────────────────
  it("6. clicking Back from the amount step returns to the select step", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );

    expect(
      screen.getByRole("heading", { name: /enter amount/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      screen.getByRole("heading", { name: /select credit line/i }),
    ).toBeInTheDocument();
  });

  // ── 7. Confirm step — Confirm button disabled before terms acceptance ─────
  it("7. confirm step shows a disabled Confirm button until terms are accepted", async () => {
    const { user } = setup();

    // Select → Amount → Confirm
    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );
    await user.type(screen.getByRole("spinbutton"), "1000");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      screen.getByRole("heading", { name: /review & confirm/i }),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm draw/i });
    expect(confirmBtn).toBeDisabled();
  });

  // ── 8. Accepting terms enables Confirm ───────────────────────────────────
  it("8. accepting terms enables the Confirm button", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );
    await user.type(screen.getByRole("spinbutton"), "1000");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(screen.getByRole("button", { name: /confirm draw/i })).not.toBeDisabled();
  });

  // ── 9. WCAG: loading spinner has accessible attributes ───────────────────
  it("9. loading state renders a region with role='status' and aria-live='polite'", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );
    await user.type(screen.getByRole("spinbutton"), "500");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: /confirm draw/i }));

    // The spinner region must have role="status" and aria-live="polite"
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveAttribute(
      "aria-label",
      "Processing your draw request",
    );
  });

  // ── 10. Successful transaction renders the result heading ─────────────────
  it("10. after the API resolves, the transaction status heading is visible", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.9);
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );
    await user.type(screen.getByRole("spinbutton"), "500");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("checkbox"));

    const confirmBtn = screen.getByRole("button", { name: /confirm draw/i });

    vi.useFakeTimers();
    fireEvent.click(confirmBtn);

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(
      screen.getByRole("heading", { name: /draw successful/i }),
    ).toBeInTheDocument();

    vi.useRealTimers();
    randomSpy.mockRestore();
  });

  // ── 11. "Make Another Draw" resets to select step ────────────────────────
  it("11. 'Make Another Draw' resets the flow to the select step", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.9);
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /select business line of credit/i,
      }),
    );
    await user.type(screen.getByRole("spinbutton"), "500");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("checkbox"));

    const confirmBtn = screen.getByRole("button", { name: /confirm draw/i });

    vi.useFakeTimers();
    fireEvent.click(confirmBtn);

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(
      screen.getByRole("heading", { name: /draw successful/i }),
    ).toBeInTheDocument();

    vi.useRealTimers();

    await user.click(screen.getByRole("button", { name: /make another draw/i }));

    expect(
      screen.getByRole("heading", { name: /select credit line/i }),
    ).toBeInTheDocument();

    randomSpy.mockRestore();
  });
});

// ─── Reduced-motion fallback tests ────────────────────────────────────

describe("DrawCreditPage — reduced-motion fallback", () => {
  it("does NOT set data-reduced-motion when motion is enabled (default)", () => {
    vi.spyOn(ReducedMotionContext, "useReducedMotion").mockReturnValue({
      motionOverride: "system",
      toggleMotionOverride: vi.fn(),
      setMotionOverride: vi.fn(),
      isReducedMotionActive: false,
    });

    render(<DrawCreditPage />);
    const main = document.querySelector("main.dc-page");
    expect(main).not.toHaveAttribute("data-reduced-motion");
  });

  it("sets data-reduced-motion='true' when in-app reduced-motion override is active", () => {
    vi.spyOn(ReducedMotionContext, "useReducedMotion").mockReturnValue({
      motionOverride: "reduced",
      toggleMotionOverride: vi.fn(),
      setMotionOverride: vi.fn(),
      isReducedMotionActive: true,
    });

    render(<DrawCreditPage />);
    const main = document.querySelector("main.dc-page");
    expect(main).toHaveAttribute("data-reduced-motion", "true");
  });
});
