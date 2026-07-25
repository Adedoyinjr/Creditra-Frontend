import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY_FEEDBACK_DURATION_MS, CopyLoanButton } from "./CopyLoanButton";
import type { CreditLine } from "../types/creditLine";

// Mock data
const mockCreditLines: CreditLine[] = [
  {
    id: "CL-2024-001",
    name: "Primary Business Line",
    status: "Active",
    limit: 500000,
    utilized: 187500,
    apr: 8.5,
    riskScore: 720,
    collateral: "Commercial Real Estate",
    openedAt: "2024-03-15",
    updatedAt: "2025-02-20T14:32:00Z",
    nextPaymentDate: "2025-03-01",
    nextPaymentAmount: 3200,
    nextInterestAccrualDate: "2025-03-01",
    transactions: [],
    statusHistory: [],
  },
  {
    id: "CL-2024-002",
    name: "Expansion Capital Line",
    status: "Active",
    limit: 250000,
    utilized: 210000,
    apr: 9.25,
    riskScore: 685,
    collateral: "Accounts Receivable",
    openedAt: "2024-06-01",
    updatedAt: "2025-02-19T09:15:00Z",
    nextPaymentDate: "2025-03-05",
    nextPaymentAmount: 5100,
    nextInterestAccrualDate: "2025-03-01",
    transactions: [],
    statusHistory: [],
  },
];

describe("CopyLoanButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setup(props: { creditLines: CreditLine[] }) {
    const clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: clipboard,
    });

    const utils = render(<CopyLoanButton {...props} />);
    const button = screen.getByRole("button", {
      name: /copy loan details to clipboard/i,
    });
    return { ...utils, button, clipboard };
  }

  it("renders the idle state correctly", () => {
    const { button } = setup({ creditLines: mockCreditLines });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Copy Loan Info")).toBeInTheDocument();
    expect(screen.getByText("Copy details to clipboard")).toBeInTheDocument();
  });

  it("copies formatted loan details successfully and shows visual feedback", async () => {
    const { button, clipboard } = setup({ creditLines: mockCreditLines });

    await act(async () => {
      fireEvent.click(button);
    });

    // Check that writeText was called with expected formatted text
    expect(clipboard.writeText).toHaveBeenCalled();
    const copiedText = clipboard.writeText.mock.calls[0][0];

    expect(copiedText).toContain("Creditra Loan Information");
    expect(copiedText).toContain("Total Credit Limit: $750,000");
    expect(copiedText).toContain("Total Utilized: $397,500");
    expect(copiedText).toContain("Total Available: $352,500");
    expect(copiedText).toContain("Primary Business Line (ID: CL-2024-001)");
    expect(copiedText).toContain("Expansion Capital Line (ID: CL-2024-002)");

    // Check feedback state
    expect(screen.getByText("Copied!")).toBeInTheDocument();
    expect(screen.getByText("Loan info copied to clipboard")).toBeInTheDocument();

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    // Check reset to idle state
    expect(screen.getByText("Copy Loan Info")).toBeInTheDocument();
    expect(screen.getByText("Copy details to clipboard")).toBeInTheDocument();
  });

  it("shows error feedback when clipboard copy fails", async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error("Clipboard error")),
    };

    const { button } = setup({
      creditLines: mockCreditLines,
      // @ts-ignore
      clipboardImpl: clipboard,
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: clipboard,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText("Failed to copy")).toBeInTheDocument();
    expect(screen.getByText("Please try again")).toBeInTheDocument();

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    expect(screen.getByText("Copy Loan Info")).toBeInTheDocument();
  });

  it("handles empty credit lines properly", async () => {
    const { button, clipboard } = setup({ creditLines: [] });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(clipboard.writeText).toHaveBeenCalledWith(
      "Creditra Loan Information\n-------------------------\nNo credit lines found."
    );
  });

  it("handles credit lines without active status properly", async () => {
    const closedLines: CreditLine[] = [
      {
        ...mockCreditLines[0],
        status: "Closed",
      },
    ];

    const { button, clipboard } = setup({ creditLines: closedLines });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(clipboard.writeText).toHaveBeenCalledWith(
      "Creditra Loan Information\n-------------------------\nNo active credit lines found."
    );
  });
});
