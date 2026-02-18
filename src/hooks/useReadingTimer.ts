import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface ReadingTime {
  [date: string]: number; // date string -> seconds
}

export function useReadingTimer() {
  const [readingTime, setReadingTime] = useLocalStorage<ReadingTime>('quran-reading-time', {});
  const startRef = useRef<number>(Date.now());
  const savedRef = useRef(false);

  const today = new Date().toDateString();

  const save = () => {
    if (savedRef.current) return;
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    if (elapsed > 0) {
      setReadingTime(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + elapsed,
      }));
      startRef.current = Date.now();
    }
  };

  useEffect(() => {
    startRef.current = Date.now();
    savedRef.current = false;

    const interval = setInterval(save, 30000);

    const handleBeforeUnload = () => save();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      save();
    };
  }, []);

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
