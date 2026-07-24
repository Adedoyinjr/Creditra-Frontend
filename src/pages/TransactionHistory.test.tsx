import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { TransactionHistory } from "./TransactionHistory";
import { NotificationProvider } from "../context/NotificationContext";

const renderTransactionHistory = (initialEntries: string[] = ["/transactions"]) => {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <TransactionHistory />
      </MemoryRouter>
    </NotificationProvider>,
  );
};

describe("TransactionHistory", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-20T12:00:00Z"));
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("renders type, date, and amount filter chips as labeled pressed toggle groups", () => {
    renderTransactionHistory();

    const typeGroup = screen.getByRole("group", { name: /type/i });
    const dateGroup = screen.getByRole("group", { name: /date range/i });
    const amountGroup = screen.getByRole("group", { name: /amount range/i });

    expect(
      within(typeGroup).getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(typeGroup).getByRole("button", { name: "Draw" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Repay" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Fee" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Interest" }),
    ).toHaveAttribute("aria-pressed", "false");

    expect(
      within(dateGroup).getByRole("button", { name: "Today" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "7d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "30d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "90d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "Custom" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      within(amountGroup).getByRole("button", { name: "All amounts" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(amountGroup).getByRole("button", { name: "Under $5k" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$5k-$25k" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$25k+" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Custom range" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the polite result count when quick amount chips change", () => {
    renderTransactionHistory();

    expect(screen.getByText("28 transactions shown")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Under $5k" }));

    expect(
      screen
        .getByRole("button", { name: "Under $5k" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByText("8 transactions shown")).toBeTruthy();
  });

  it("shows a no-results state with a clear filters action", () => {
    const { container } = renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const noResultsHeading = screen.getByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsHeading).toBeTruthy();

    // Check NoDataGraph illustration renders in the empty state
    const illustration = container.querySelector(
      ".empty-state .empty-state-illustration",
    );
    expect(illustration).toBeInTheDocument();

    // Check "no transactions yet" message is NOT present
    const noTransactionsMsg = screen.queryByText(/no transactions yet/i);
    expect(noTransactionsMsg).toBeFalsy();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    const noResultsAfterClear = screen.queryByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsAfterClear).toBeFalsy();

    const resultCount = screen.getByText("28 transactions shown");
    expect(resultCount).toBeTruthy();

    const allButtons = screen.getAllByRole("button", { name: "All" });
    expect(allButtons[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("renders amount range filter chips with correct aria-pressed states", () => {
    renderTransactionHistory();

    const amountGroup = screen.getByRole("group", { name: /amount/i });

    expect(
      within(amountGroup).getByRole("button", { name: "All Amounts" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(amountGroup).getByRole("button", { name: "<$100" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$100–$1,000" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: ">$1,000" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("amount filter stacks with existing type and date filters (AND)", () => {
    renderTransactionHistory();

    // Start: 28 transactions
    expect(screen.getByText("28 transactions shown")).toBeTruthy();

    // Apply >$1,000 amount filter → 22 transactions (all >1000)
    fireEvent.click(screen.getByRole("button", { name: ">$1,000" }));
    expect(screen.getByText("22 transactions shown")).toBeTruthy();

    // Stack with Fee type filter → 0 transactions (no Fees >1000)
    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    expect(screen.getByText("0 transactions shown")).toBeTruthy();

    // Clear filters restores count
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(screen.getByText("28 transactions shown")).toBeTruthy();
  });

  it("opens custom date inputs when Custom is selected", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  // ── A11Y-004: table caption tests ──────────────────────────────────────────

  it("renders a visually-hidden caption on the transaction table", () => {
    renderTransactionHistory();
    // The table is identified by its caption text via getByRole
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toBeInTheDocument();
  });

  it("default caption describes unfiltered scope and result count", () => {
    renderTransactionHistory();
    const table = screen.getByRole("table", { name: /transaction history/i });
    // No filter qualifiers in default state
    expect(table).toHaveAccessibleName(/transaction history — \d+ results?/i);
    // Confirm no filter fragment is included
    expect(table.querySelector("caption")?.textContent).not.toMatch(/filtered by/i);
  });

  it("caption updates when a type filter is applied", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Draw" }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toHaveAccessibleName(/filtered by draw/i);
  });

  it("caption updates when a date preset is applied", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toHaveAccessibleName(/last 7 days/i);
  });

  it("caption includes multiple active filter qualifiers simultaneously", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Repay" }));
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    const caption = screen
      .getByRole("table", { name: /transaction history/i })
      .querySelector("caption");
    expect(caption?.textContent).toMatch(/filtered by repayment/i);
    expect(caption?.textContent).toMatch(/last 30 days/i);
  });

  it("caption reverts to unfiltered description after clearing filters", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table.querySelector("caption")?.textContent).not.toMatch(
      /filtered by/i,
    );
  });

  // ── Search combobox (A11Y + filtering) ─────────────────────────────────────

  describe("Search combobox", () => {
    it("renders an input with combobox role and correct ARIA attributes when empty", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      expect(input).toBeInTheDocument();
      // aria-expanded must be false when no query has been typed
      expect(input).toHaveAttribute("aria-expanded", "false");
      // aria-autocomplete="list" signals suggestions appear in a separate popup
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      // aria-controls must reference the listbox element
      const listboxId = input.getAttribute("aria-controls");
      expect(listboxId).toBeTruthy();
      const listbox = document.getElementById(listboxId!);
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute("role", "listbox");
    });

    it("filters transactions by credit-line name", async () => {
      renderTransactionHistory();
      // Full dataset: 28 transactions
      expect(screen.getByText("28 transactions shown")).toBeTruthy();

      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "Primary Business" } });

      // Debounce delay is 250ms; advance timers to apply filter
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Only transactions belonging to "Primary Business Line" should show
      expect(screen.getByText("6 transactions shown")).toBeTruthy();
    });

    it("shows suggestion options when typing a partial credit-line name", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "primary" } });

      // The listbox should now be open (aria-expanded="true")
      expect(input).toHaveAttribute("aria-expanded", "true");

      // At least one option in the listbox for the matching line
      const listbox = screen.getByRole("listbox", { name: /search suggestions/i });
      expect(within(listbox).getAllByRole("option").length).toBeGreaterThan(0);
      // The "Primary Business Line" suggestion should be present
      expect(within(listbox).getByText(/primary business line/i)).toBeInTheDocument();
    });

    it("closes the listbox after selecting a suggestion with mouse", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "primary" } });

      const listbox = screen.getByRole("listbox");
      // Target the <li role="option"> that contains the text, not the text node itself.
      // The onMouseDown handler lives on the <li>, so firing on a child span has no effect.
      const options = within(listbox).getAllByRole("option");
      const matchingOption = options.find((o) =>
        o.textContent?.toLowerCase().includes("primary business line"),
      );
      expect(matchingOption).toBeDefined();

      await act(async () => {
        fireEvent.mouseDown(matchingOption!);
      });

      // Listbox should be dismissed (aria-expanded="false")
      expect(input).toHaveAttribute("aria-expanded", "false");
      // Input value should be committed to the selected suggestion
      expect(input).toHaveValue("Primary Business Line");
    });

    it("navigates suggestions with ArrowDown and commits with Enter", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "primary" } });

      // Listbox should be open
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();

      // Move to first suggestion then commit — one act so state flushes between the two keys
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      const options = within(listbox).getAllByRole("option");
      // After ArrowDown the first option should be marked active
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      // Capture the expected committed value before dismissing
      const expectedValue = options[0].textContent?.replace(/🔍\s*/g, "").trim() ?? "";

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveValue(expectedValue);
    });

    it("dismisses the listbox on Escape without changing the input value", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "primary" } });
      expect(input).toHaveAttribute("aria-expanded", "true");

      fireEvent.keyDown(input, { key: "Escape" });
      // Listbox must be closed
      expect(input).toHaveAttribute("aria-expanded", "false");
      // But the typed value must be preserved
      expect(input).toHaveValue("primary");
    });

    it("shows a clear button when text is present and removes it on click", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });

      // No clear button when input is empty
      expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: "equipment" } });
      const clearBtn = screen.getByRole("button", { name: /clear search/i });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      // Input should be cleared
      expect(input).toHaveValue("");
      // No clear button visible after clearing
      expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
      // Filter should also reset — advance timers and check count restores
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("28 transactions shown")).toBeTruthy();
    });

    it("filters by transaction note text", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      // "Equipment purchase" is the note on TX-001
      fireEvent.change(input, { target: { value: "equipment purchase" } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      // Only TX-001 should match
      expect(screen.getByText("1 transaction shown")).toBeTruthy();
    });

    it("shows 0 results for a query that matches nothing", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "zzznotfound" } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("0 transactions shown")).toBeTruthy();
    });

    it("listbox is empty (no options) when query yields no suggestions", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      // A query that won't match any candidate string
      fireEvent.change(input, { target: { value: "zzznotfound" } });
      // aria-expanded should be false because suggestions list is empty
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("caps suggestion list at 8 items", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      // A very broad query likely to hit many candidates
      fireEvent.change(input, { target: { value: "a" } });
      if (input.getAttribute("aria-expanded") === "true") {
        const listbox = screen.getByRole("listbox");
        expect(within(listbox).getAllByRole("option").length).toBeLessThanOrEqual(8);
      }
    });

    it("clears search combobox value when Clear filters button is used", async () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "equipment" } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      // Trigger no-results state by stacking type filter
      fireEvent.click(screen.getByRole("button", { name: "Fee" }));
      fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

      expect(input).toHaveValue("");
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText("28 transactions shown")).toBeTruthy();
    });

    it("search stacks with type filter (AND semantics)", async () => {
      renderTransactionHistory();
      // Filter to only Draw transactions first
      fireEvent.click(screen.getByRole("button", { name: "Draw" }));

      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "Primary Business" } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should be only Draw transactions in "Primary Business Line"
      // (3 draws: TX-001, TX-003, TX-005)
      expect(screen.getByText("3 transactions shown")).toBeTruthy();
    });

    it("announces live result count updates as the query changes", async () => {
      renderTransactionHistory();
      // The transaction history's own status region (not the notification provider's)
      // It's identifiable by its aria-live="polite" and aria-atomic="true"
      const statusRegions = screen.getAllByRole("status");
      const txStatusRegion = statusRegions.find(
        (el) => el.getAttribute("aria-live") === "polite" && el.getAttribute("aria-atomic") === "true",
      );
      expect(txStatusRegion).toBeDefined();
      expect(txStatusRegion).toHaveAttribute("aria-live", "polite");
      expect(txStatusRegion).toHaveAttribute("aria-atomic", "true");

      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.change(input, { target: { value: "Primary Business Line" } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(txStatusRegion!.textContent).toMatch(/6 transactions shown/);
    });

    it("does not open the listbox when input is focused but empty", () => {
      renderTransactionHistory();
      const input = screen.getByRole("combobox", { name: /search transactions/i });
      fireEvent.focus(input);
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
  });
});
