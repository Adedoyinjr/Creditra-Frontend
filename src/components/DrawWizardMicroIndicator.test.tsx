import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrawWizardMicroIndicator } from "./DrawWizardMicroIndicator";

describe("DrawWizardMicroIndicator", () => {
  it("renders the label with the correct tone data attribute", () => {
    render(
      <DrawWizardMicroIndicator
        stepId="amount"
        tone="success"
        label="Amount valid"
      />,
    );

    const indicator = screen.getByTestId("draw-micro-indicator-amount");
    expect(indicator).toHaveAttribute("data-tone", "success");
    expect(indicator).toHaveTextContent("Amount valid");
    expect(indicator).toHaveAttribute("id", "draw-wizard-micro-amount");
  });

  it("exposes warning and muted tones for styling hooks", () => {
    const { rerender } = render(
      <DrawWizardMicroIndicator
        stepId="confirm"
        tone="warning"
        label="Acknowledge terms"
      />,
    );

    expect(screen.getByTestId("draw-micro-indicator-confirm")).toHaveAttribute(
      "data-tone",
      "warning",
    );

    rerender(
      <DrawWizardMicroIndicator
        stepId="select"
        tone="muted"
        label="Select a line"
      />,
    );

    expect(screen.getByTestId("draw-micro-indicator-select")).toHaveAttribute(
      "data-tone",
      "muted",
    );
  });
});
