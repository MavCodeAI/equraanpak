import { useState, useEffect, useRef, useCallback } from 'react';

const CHUNK_SIZE = 30;

export function useChunkedAyahs<T>(items: T[] | undefined) {
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when items change
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [items?.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !items?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, items.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items?.length, visibleCount]);

  const visibleItems = items?.slice(0, visibleCount);
  const hasMore = (items?.length ?? 0) > visibleCount;

  return { visibleItems, hasMore, sentinelRef };
}
