import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AprHistoryChart } from "./AprHistoryChart";
import type { AprHistoryEntry } from "../types/creditLine";

const history: AprHistoryEntry[] = [
  { date: "2025-01-01", apr: 8.1 },
  { date: "2025-02-01", apr: 8.3 },
  { date: "2025-03-01", apr: 8.25 },
  { date: "2025-04-01", apr: 8.15 },
  { date: "2025-05-01", apr: 8.05 },
  { date: "2025-06-01", apr: 7.95 },
  { date: "2025-06-15", apr: 7.9 },
];

describe("AprHistoryChart", () => {
  it("renders the default 90D window as selected", () => {
    render(<AprHistoryChart history={history} lineId="CL-1" />);

    expect(screen.getByRole("button", { name: "90D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "30D" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "365D" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches windows and updates the screen-reader data table", () => {
    render(<AprHistoryChart history={history} lineId="CL-1" />);

    const dataTable = screen.getByRole("table", {
      name: /apr history data table/i,
    });
    expect(within(dataTable).getAllByRole("row")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "30D" }));
    expect(screen.getByRole("button", { name: "30D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dataTable).getAllByRole("row")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "365D" }));
    expect(screen.getByRole("button", { name: "365D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dataTable).getAllByRole("row")).toHaveLength(8);
  });

  it("renders an accessible empty state when no history is available", () => {
    render(<AprHistoryChart history={[]} lineId="CL-empty" />);

    expect(
      screen.getByText("No APR history available yet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName("No APR History data");
    expect(
      screen.getByRole("table", { name: /apr history data table/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the available entries when a selected window has fewer than two points", () => {
    render(
      <AprHistoryChart
        history={[
          { date: "2025-05-30", apr: 8.2 },
          { date: "2025-06-15", apr: 8.1 },
        ]}
        lineId="CL-short"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "30D" }));

    const dataTable = screen.getByRole("table", {
      name: /apr history data table/i,
    });
    expect(within(dataTable).getAllByRole("row")).toHaveLength(3);
    expect(
      screen.queryByText("No APR history available yet."),
    ).not.toBeInTheDocument();
  });
});
