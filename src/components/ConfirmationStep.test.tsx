import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConfirmationStep } from "./ConfirmationStep";
import { useWallet } from "@/context/WalletContext";

// Mock WalletContext — ConfirmationStep reads wallet status to show a hint
vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

// Mock draw pricing — tests focus on UI structure, not pricing arithmetic
vi.mock("@/lib/draw-credit-pricing", () => ({
  getDrawPricingQuote: vi.fn(() => ({
    fee: 100,
    apr: 12.5,
    estimatedMonthlyInterest: 104.17,
    riskBand: "Standard",
    termMonths: 24,
  })),
}));

(useWallet as ReturnType<typeof vi.fn>).mockReturnValue({ status: "connected" });

const creditLine = {
  id: "cl-001",
  name: "Business Line of Credit",
  limit: 50000,
  available: 35000,
  utilization: 30,
  riskBand: "Standard" as const,
  termMonths: 24,
};

/** Returns footer action buttons, excluding icon-only buttons (e.g. tooltips). */
function getActionButtons() {
  return screen.getAllByRole("button").filter(
    (btn) =>
      !btn.getAttribute("aria-label") &&
      (btn.textContent?.trim() ?? "").length > 0,
  );
}

describe("ConfirmationStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as ReturnType<typeof vi.fn>).mockReturnValue({ status: "connected" });
  });

  it("renders the Review and confirm heading", () => {
    render(
      <ConfirmationStep
        creditLine={creditLine}
        amount={10000}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /review and confirm/i }),
    ).toBeInTheDocument();
  });

  it("shows the draw amount and estimated fee", () => {
    render(
      <ConfirmationStep
        creditLine={creditLine}
        amount={10000}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
    // Fee comes from mocked getDrawPricingQuote → $100
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });
});

// ── Button order tests (docs/BUTTON_ORDER.md) ────────────────────────────────

describe("ConfirmationStep — button order (docs/BUTTON_ORDER.md)", () => {
  beforeEach(() => {
    (useWallet as ReturnType<typeof vi.fn>).mockReturnValue({ status: "connected" });
  });

  function renderStep(overrides = {}) {
    render(
      <ConfirmationStep
        creditLine={creditLine}
        amount={10000}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
        {...overrides}
      />,
    );
  }

  it("renders Cancel before Back in the DOM", () => {
    renderStep();

    const buttons = getActionButtons();
    const cancelIdx = buttons.findIndex((b) => b.textContent?.trim() === "Cancel");
    const backIdx   = buttons.findIndex((b) => b.textContent?.trim() === "Back");

    expect(cancelIdx).toBeGreaterThanOrEqual(0);
    expect(backIdx).toBeGreaterThanOrEqual(0);
    // Cancel must precede Back (leftmost safe exit, then step navigation)
    expect(cancelIdx).toBeLessThan(backIdx);
  });

  it("renders Back before the primary Draw button in the DOM", () => {
    renderStep();

    const buttons  = getActionButtons();
    const backIdx  = buttons.findIndex((b) => b.textContent?.trim() === "Back");
    const drawIdx  = buttons.findIndex((b) => /draw/i.test(b.textContent ?? ""));

    expect(backIdx).toBeGreaterThanOrEqual(0);
    expect(drawIdx).toBeGreaterThanOrEqual(0);
    // Back must precede the primary action
    expect(backIdx).toBeLessThan(drawIdx);
  });

  it("full order: Cancel → Back → Draw", () => {
    renderStep();

    const buttons    = getActionButtons();
    const cancelIdx  = buttons.findIndex((b) => b.textContent?.trim() === "Cancel");
    const backIdx    = buttons.findIndex((b) => b.textContent?.trim() === "Back");
    const drawIdx    = buttons.findIndex((b) => /draw/i.test(b.textContent ?? ""));

    // Rule: Cancel < Back < Primary (docs/BUTTON_ORDER.md)
    expect(cancelIdx).toBeLessThan(backIdx);
    expect(backIdx).toBeLessThan(drawIdx);
  });

  it("Draw is disabled until terms are accepted", () => {
    renderStep();

    const draw = screen.getByRole("button", { name: /draw/i });
    expect(draw).toBeDisabled();
  });

  it("Draw becomes enabled after the terms checkbox is ticked", async () => {
    const user = userEvent.setup();
    renderStep();

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(screen.getByRole("button", { name: /draw/i })).not.toBeDisabled();
  });

  it("Cancel and Back are disabled while isLoading", () => {
    renderStep({ isLoading: true });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderStep({ onCancel });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderStep({ onBack });

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Draw is clicked after accepting terms", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderStep({ onConfirm });

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /draw/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
