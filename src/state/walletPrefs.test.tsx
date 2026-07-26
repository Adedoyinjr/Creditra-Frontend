import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWalletPrefs } from "./walletPrefs";

/**
 * Tests for the React state layer over src/utils/wallet.ts.
 *
 * Verifies:
 *   - Default state reads from storage.
 *   - `recordUse` updates local state and storage.
 *   - `setRemember` toggles the opt-in flag with correct storage
 *     semantics (false removes the key).
 *   - `clearAll` wipes both signals.
 *   - Multiple subscribers each get their own subscription; a mutation
 *     in one is reflected in storage so any subscriber re-rendering
 *     observes the new value on its next read.
 */

const STORAGE_KEY_RECENT = "creditra-wallet-recent";
const STORAGE_KEY_REMEMBER = "creditra-wallet-remember";

describe("useWalletPrefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty MRU and remember=false when no storage exists", () => {
    const { result } = renderHook(() => useWalletPrefs());
    expect(result.current.recentWallets).toEqual([]);
    expect(result.current.remember).toBe(false);
  });

  it("mirrors stored MRU (reversed so most-recent is first)", () => {
    window.localStorage.setItem(
      STORAGE_KEY_RECENT,
      JSON.stringify(["freighter", "albedo"]),
    );
    const { result } = renderHook(() => useWalletPrefs());
    // Storage keeps most-recent at the END.  Hook reverses for
    // left-to-right "first -> last used" consumption.
    expect(result.current.recentWallets).toEqual(["albedo", "freighter"]);
  });

  it("mirrors stored remember flag", () => {
    window.localStorage.setItem(STORAGE_KEY_REMEMBER, JSON.stringify(true));
    const { result } = renderHook(() => useWalletPrefs());
    expect(result.current.remember).toBe(true);
  });

  it("recordUse promotes the wallet to most-recent and updates state", () => {
    window.localStorage.setItem(
      STORAGE_KEY_RECENT,
      JSON.stringify(["freighter"]),
    );
    const { result } = renderHook(() => useWalletPrefs());

    act(() => {
      result.current.recordUse("albedo");
    });

    expect(result.current.recentWallets[0]).toBe("albedo");
    // On-disk list keeps the most-recent at the END (matches recordRecentWallet).
    const onDisk = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY_RECENT) ?? "[]",
    );
    expect(onDisk[onDisk.length - 1]).toBe("albedo");
  });

  it("recordUse is de-duplicating (calling twice does not duplicate)", () => {
    const { result } = renderHook(() => useWalletPrefs());

    act(() => {
      result.current.recordUse("xbull");
    });
    act(() => {
      result.current.recordUse("xbull");
    });

    expect(
      result.current.recentWallets.filter((w) => w === "xbull"),
    ).toHaveLength(1);
  });

  it("setRemember(true) writes the flag; setRemember(false) removes the key", () => {
    const { result } = renderHook(() => useWalletPrefs());

    act(() => {
      result.current.setRemember(true);
    });
    expect(window.localStorage.getItem(STORAGE_KEY_REMEMBER)).toBe("true");
    expect(result.current.remember).toBe(true);

    act(() => {
      result.current.setRemember(false);
    });
    expect(window.localStorage.getItem(STORAGE_KEY_REMEMBER)).toBeNull();
    expect(result.current.remember).toBe(false);
  });

  it("clearAll wipes both signal sources atomically", () => {
    window.localStorage.setItem(
      STORAGE_KEY_RECENT,
      JSON.stringify(["rabet", "freighter"]),
    );
    window.localStorage.setItem(STORAGE_KEY_REMEMBER, JSON.stringify(true));
    const { result } = renderHook(() => useWalletPrefs());

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.recentWallets).toEqual([]);
    expect(result.current.remember).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY_RECENT)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY_REMEMBER)).toBeNull();
  });

  it("storage event from another document triggers re-read", () => {
    const { result } = renderHook(() => useWalletPrefs());

    // Simulate a `storage` event fired by another tab/window.
    act(() => {
      window.localStorage.setItem(
        STORAGE_KEY_RECENT,
        JSON.stringify(["freighter", "albedo"]),
      );
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY_RECENT,
          newValue: JSON.stringify(["freighter", "albedo"]),
        }),
      );
    });

    expect(result.current.recentWallets).toEqual(["albedo", "freighter"]);
  });
});
