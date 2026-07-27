import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingHero, HERO_STATUS_CONFIGS } from "./LandingHero";
import type { CreditLineStatus } from "../types/creditLine";

describe("LandingHero - Color-Blind Safe Status Chips", () => {
  it("renders the hero title and primary actions", () => {
    render(<LandingHero variantId="control" />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Adaptive Credit Without Overcollateralization/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  it("renders status indicator region with role='status' and aria-live='polite'", () => {
    render(<LandingHero initialStatus="Active" />);

    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Credit line status: Active")
    );
  });

  it("includes visual pattern class and non-color cue glyph for color-blind accessibility", () => {
    const statuses: CreditLineStatus[] = ["Active", "Suspended", "Frozen", "Defaulted", "Closed"];

    for (const status of statuses) {
      const { container, unmount } = render(<LandingHero initialStatus={status} />);
      const config = HERO_STATUS_CONFIGS[status];

      const statusBadge = container.querySelector(`.${config.patternClass}`);
      expect(statusBadge, `Status badge for ${status} should carry ${config.patternClass}`).not.toBeNull();
      expect(statusBadge).toHaveClass(config.chipClass);

      // Cue element should render the single-character glyph and be hidden from screen readers
      const cueElement = screen.getByText(config.cue);
      expect(cueElement).toBeInTheDocument();
      expect(cueElement).toHaveAttribute("aria-hidden", "true");

      unmount();
    }
  });

  it("updates status state and triggers callback when clicking demo status chips", () => {
    const handleSelect = vi.fn();
    render(<LandingHero initialStatus="Active" onStatusSelect={handleSelect} />);

    // Active status is initially selected
    const activeChipButton = screen.getByRole("button", { name: /Select status: Active/i });
    expect(activeChipButton).toHaveAttribute("aria-pressed", "true");

    // Click Defaulted chip button
    const defaultedChipButton = screen.getByRole("button", { name: /Select status: Defaulted/i });
    expect(defaultedChipButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(defaultedChipButton);

    expect(handleSelect).toHaveBeenCalledWith("Defaulted");
    expect(defaultedChipButton).toHaveAttribute("aria-pressed", "true");

    // Status region should now announce Defaulted
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Credit line status: Defaulted")
    );
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("groups interactive status chips in an accessible role='group'", () => {
    render(<LandingHero />);

    const chipGroup = screen.getByRole("group", { name: /Select credit line status mode/i });
    expect(chipGroup).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /Select status:/i });
    expect(buttons).toHaveLength(5);
  });
});
