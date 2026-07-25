import { useState, useCallback, useRef } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  pullThreshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  pullThreshold = 80,
  maxPullDistance = 150,
  disabled = false,
}: UsePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (disabled || isRefreshing) return;
      
      // Ensure we are at the top of the container/window before allowing pull
      const scrollTop =
        (e.currentTarget as HTMLElement).scrollTop ||
        document.documentElement.scrollTop;
        
      if (scrollTop > 0) return;

      startYRef.current = e.touches[0].clientY;
      currentYRef.current = startYRef.current;
      isPullingRef.current = true;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!isPullingRef.current || disabled || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      currentYRef.current = currentY;
      const diff = currentY - startYRef.current;

      // Only allow pulling down
      if (diff > 0) {
        // Prevent default to avoid browser's native pull-to-refresh
        if (e.cancelable) {
          e.preventDefault();
        }
        // Add some resistance
        const resistance = diff * 0.5;
        const newDistance = Math.min(resistance, maxPullDistance);
        setPullDistance(newDistance);
      } else {
        setPullDistance(0);
      }
    },
    [disabled, isRefreshing, maxPullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold); // keep it at threshold during refresh

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, pullThreshold]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
