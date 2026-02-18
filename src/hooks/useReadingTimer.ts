import { useEffect, useRef, useCallback } from 'react';

interface ReadingTime {
  [date: string]: number; // date string -> seconds
}

export function useReadingTimer() {
  const startRef = useRef<number>(Date.now());

  // Direct localStorage read for return values
  const getReadingTime = (): ReadingTime => {
    try {
      return JSON.parse(localStorage.getItem('quran-reading-time') || '{}');
    } catch {
      return {};
    }
  };

  const saveDirectly = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    if (elapsed > 2) {
      const today = new Date().toDateString();
      const current = getReadingTime();
      current[today] = (current[today] || 0) + elapsed;
      localStorage.setItem('quran-reading-time', JSON.stringify(current));
      startRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    startRef.current = Date.now();

    const interval = setInterval(saveDirectly, 30000);
    const handleBeforeUnload = () => saveDirectly();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveDirectly();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Save directly to localStorage on unmount - no state update
      saveDirectly();
    };
  }, [saveDirectly]);

  const readingTime = getReadingTime();
  const today = new Date().toDateString();
  const todayMinutes = Math.floor((readingTime[today] || 0) / 60);

  const weekMinutes = (() => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000).toDateString();
      total += readingTime[d] || 0;
    }
    return Math.floor(total / 60);
  })();

  return { todayMinutes, weekMinutes, readingTime };
}
