import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawWizardMicroProgress } from "../useDrawWizardMicroProgress";
import type { CreditLine } from "@/types/draw-credit.types";

const line: CreditLine = {
  id: "cl-001",
  name: "Business Line of Credit",
  limit: 50000,
  available: 35000,
  utilization: 30,
  riskBand: "Standard",
  termMonths: 24,
};

describe("useDrawWizardMicroProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns four step states", () => {
    const { result } = renderHook(() =>
      useDrawWizardMicroProgress({
        selectedCreditLine: null,
        amount: 0,
        confirmationAcknowledged: false,
        isOnConfirmStep: false,
      }),
    );

    expect(result.current.steps).toHaveLength(4);
    expect(result.current.debouncedAnnouncement).toBe("");
  });

  it("debounces live-region announcements when validity changes", () => {
    const { result, rerender } = renderHook(
      (props) => useDrawWizardMicroProgress(props),
      {
        initialProps: {
          selectedCreditLine: null as CreditLine | null,
          amount: 0,
          confirmationAcknowledged: false,
          isOnConfirmStep: false,
        },
      },
    );

    rerender({
      selectedCreditLine: line,
      amount: 0,
      confirmationAcknowledged: false,
      isOnConfirmStep: false,
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedAnnouncement).toBe("");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.debouncedAnnouncement).toMatch(/Select line:/);
  });
});
