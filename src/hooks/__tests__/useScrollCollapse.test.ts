import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollCollapse } from "../useScrollCollapse";

describe("useScrollCollapse", () => {
  let scrollY = 0;

  beforeEach(() => {
    scrollY = 0;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts expanded", () => {
    const { result } = renderHook(() => useScrollCollapse(true));
    expect(result.current).toBe(false);
  });

  it("collapses after scrolling down past the minimum offset", () => {
    const { result } = renderHook(() => useScrollCollapse(true));

    act(() => {
      scrollY = 120;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("expands again when scrolling up", () => {
    const { result } = renderHook(() => useScrollCollapse(true));

    act(() => {
      scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });

  it("stays expanded when disabled", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollCollapse(enabled),
      { initialProps: { enabled: true } },
    );

    act(() => {
      scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });

    rerender({ enabled: false });
    expect(result.current).toBe(false);
  });
});
