import { render, screen } from "@testing-library/react";
import { DrawingLimit } from "../DrawingLimit";

/** Match text split across nested elements (label + amount). */
function textContent(matcher: string | RegExp) {
  return (_: string, node: Element | null) => {
    if (!node) return false;
    const t = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (typeof matcher === "string") {
      if (t !== matcher) return false;
    } else if (!matcher.test(t)) {
      return false;
    }
    // Prefer the deepest element that still matches the full string
    return !Array.from(node.children).some((child) => {
      const ct = child.textContent?.replace(/\s+/g, " ").trim() ?? "";
      return typeof matcher === "string" ? ct === matcher : matcher.test(ct);
    });
  };
}

describe("DrawingLimit", () => {
  it("renders the drawn and available amounts correctly", () => {
    render(<DrawingLimit drawnAmount={3000} totalLimit={10000} />);

    expect(screen.getByText(textContent("Drawn: $3,000.00"))).toBeInTheDocument();
    expect(screen.getByText(textContent("Available: $7,000.00"))).toBeInTheDocument();
  });

  it("shows the correct percentage when under 50%", () => {
    render(<DrawingLimit drawnAmount={4000} totalLimit={10000} />);

    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("shows amber color for medium utilization (50-80%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={7000} totalLimit={10000} />
    );

    const bar = container.querySelector(".bg-amber-500");
    expect(bar).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("shows red color for high utilization (>80%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={9000} totalLimit={10000} />
    );

    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("shows exceeded state when drawn exceeds limit", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={12000} totalLimit={10000} />
    );

    expect(screen.getByText("Exceeded")).toBeInTheDocument();
    expect(screen.getByText(textContent(/Overdrawn by \$2,000\.00/))).toBeInTheDocument();
  });

  it("shows green color for low utilization (<50%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={3000} totalLimit={10000} />
    );

    const bar = container.querySelector(".bg-green-500");
    expect(bar).toBeInTheDocument();
  });

  it("handles zero limit gracefully", () => {
    render(<DrawingLimit drawnAmount={0} totalLimit={0} />);

    expect(screen.getByText(textContent("Drawn: $0.00"))).toBeInTheDocument();
    expect(screen.getByText(textContent("Available: $0.00"))).toBeInTheDocument();
  });

  it("uses custom labels when provided", () => {
    render(
      <DrawingLimit
        drawnAmount={5000}
        totalLimit={10000}
        drawnLabel="Used"
        availableLabel="Left"
      />
    );

    expect(screen.getByText(textContent("Used: $5,000.00"))).toBeInTheDocument();
    expect(screen.getByText(textContent("Left: $5,000.00"))).toBeInTheDocument();
  });
});
