/**
 * walletPrefs - React state layer over `src/utils/wallet.ts`.
 *
 * The storage layer in `src/utils/wallet.ts` exposes plain helpers
 * that any consumer can call.  This module re-renders React consumers
 * when the underlying storage changes.
 *
 * Public API (returned by `useWalletPrefs()`):
 *
 *   - `recentWallets`   - most-recent-first list.  Storage keeps the
 *     list newest-at-end for O(1) appends; we reverse on read.
 *   - `remember`        - opt-in flag for next-visit auto-reconnect.
 *   - `recordUse(type)` - promote `type` to the front of MRU.
 *   - `setRemember(v)`  - set or clear the opt-in flag.
 *   - `clearAll()`      - wipe both signals.
 *
 * Note on Provider
 * ────────────────
 * Earlier iterations exposed an optional `WalletPrefsProvider` +
 * `useWalletPrefs()` that fell back to a standalone hook outside the
 * tree.  That pairing could not actually share state across two
 * separate React roots (e.g. two `renderHook` calls): each Provider
 * instance runs its own `useState`, so consumers in two Provider
 * trees never see each other's updates.  The Provider boundary was
 * therefore removed; consumers use `useWalletPrefs()` directly and
 * each gets its own subscription from the storage layer.
 *
 * Cross-tree synchronisation is provided by the `storage` event
 * listener in `useWalletPrefsStandalone`, which re-reads the storage
 * layer when *another* document mutates the keys.  Trees sharing the
 * same DOM (i.e. one app) don't rely on `storage` events - the writer
 * updates its own state via the action callbacks before the next
 * subscriber re-renders.
 */

import { useCallback, useEffect, useState } from "react";

import {
  clearMRU,
  getRecentWalletOrder,
  isWalletRemembered,
  recordRecentWallet as recordRecentWalletStorage,
  setWalletRemembered as setWalletRememberedStorage,
} from "../utils/wallet";
import type { WalletType } from "../types/wallet";

// ─── Public surface ───────────────────────────────────────────────────────────

export interface WalletPrefsShape {
  /** Wallets in most-recent-first order (storage is newest-at-end). */
  recentWallets: WalletType[];
  /** Opt-in flag for next-visit auto-reconnect. */
  remember: boolean;
  /** Promote `type` to the front of MRU. */
  recordUse: (type: WalletType) => void;
  /** Set or clear the opt-in flag. */
  setRemember: (value: boolean) => void;
  /** Wipe both signals. */
  clearAll: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook returning the user's wallet preferences.
 *
 * Direct usage:
 *
 *   const { recentWallets, remember } = useWalletPrefs();
 *
 * Per the rules of hooks, callers must invoke this hook
 * unconditionally on every render.  Wrapping in `useMemo`/`useEffect`
 * with conditional branches is fine as long as the call site is
 * unconditional.
 */
export function useWalletPrefs(): WalletPrefsShape {
  const [recentWallets, setRecentWallets] = useState<WalletType[]>(() =>
    getRecentWalletOrder().slice().reverse(),
  );
  const [remember, setRememberState] = useState<boolean>(() =>
    isWalletRemembered(),
  );

  // Cross-tab consistency: re-read when another document mutates storage.
  // Within the same document the writing tab updates its own state via
  // the action callbacks below, so we don't need a `storage` listener
  // for local sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (!event.key) {
        setRecentWallets(getRecentWalletOrder().slice().reverse());
        setRememberState(isWalletRemembered());
        return;
      }
      if (event.key === "creditra-wallet-recent") {
        setRecentWallets(getRecentWalletOrder().slice().reverse());
      } else if (event.key === "creditra-wallet-remember") {
        setRememberState(isWalletRemembered());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const recordUse = useCallback((type: WalletType) => {
    recordRecentWalletStorage(type);
    setRecentWallets(getRecentWalletOrder().slice().reverse());
  }, []);

  const setRemember = useCallback((value: boolean) => {
    setWalletRememberedStorage(value);
    setRememberState(value);
  }, []);

  const clearAll = useCallback(() => {
    clearMRU();
    setWalletRememberedStorage(false);
    setRecentWallets([]);
    setRememberState(false);
  }, []);

  return { recentWallets, remember, recordUse, setRemember, clearAll };
}
