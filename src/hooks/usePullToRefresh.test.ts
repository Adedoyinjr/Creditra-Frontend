import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from './usePullToRefresh';
import { describe, it, expect, vi } from 'vitest';

describe('usePullToRefresh', () => {
  it('should initialize with default values', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
    expect(typeof result.current.handlers.onTouchStart).toBe('function');
    expect(typeof result.current.handlers.onTouchMove).toBe('function');
    expect(typeof result.current.handlers.onTouchEnd).toBe('function');
  });

  it('should not allow pulling if disabled is true', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, disabled: true })
    );

    const mockEventStart = {
      touches: [{ clientY: 100 }],
      currentTarget: { scrollTop: 0 }
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchStart(mockEventStart);
    });

    const mockEventMove = {
      touches: [{ clientY: 200 }],
      cancelable: true,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchMove(mockEventMove);
    });

    expect(result.current.pullDistance).toBe(0);
  });

  it('should calculate pull distance correctly', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    const mockEventStart = {
      touches: [{ clientY: 100 }],
      currentTarget: { scrollTop: 0 }
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchStart(mockEventStart);
    });

    const preventDefault = vi.fn();
    const mockEventMove = {
      touches: [{ clientY: 200 }], // 100px pull
      cancelable: true,
      preventDefault,
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchMove(mockEventMove);
    });

    // Distance is diff * 0.5 = 100 * 0.5 = 50
    expect(result.current.pullDistance).toBe(50);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should trigger refresh if pulled past threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, pullThreshold: 50 })
    );

    const mockEventStart = {
      touches: [{ clientY: 100 }],
      currentTarget: { scrollTop: 0 }
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchStart(mockEventStart);
    });

    const mockEventMove = {
      touches: [{ clientY: 300 }], // 200px pull -> 100 resistance
      cancelable: true,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchMove(mockEventMove);
    });

    expect(result.current.pullDistance).toBe(100);

    await act(async () => {
      await result.current.handlers.onTouchEnd();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it('should not trigger refresh if not pulled past threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, pullThreshold: 80 })
    );

    const mockEventStart = {
      touches: [{ clientY: 100 }],
      currentTarget: { scrollTop: 0 }
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchStart(mockEventStart);
    });

    const mockEventMove = {
      touches: [{ clientY: 150 }], // 50px pull -> 25 resistance
      cancelable: true,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handlers.onTouchMove(mockEventMove);
    });

    expect(result.current.pullDistance).toBe(25);

    await act(async () => {
      await result.current.handlers.onTouchEnd();
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });
});
