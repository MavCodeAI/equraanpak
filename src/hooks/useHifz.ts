import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { surahList } from '@/data/surahs';
import type { HifzProgress, HifzSession, HifzMode } from '@/types/quran';

// Spaced repetition intervals in days
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

interface HifzData {
  progress: Record<number, HifzProgress>;
  sessions: HifzSession[];
}

const defaultHifzData: HifzData = {
  progress: {},
  sessions: [],
};

export function useHifz() {
  const [hifzData, setHifzData] = useLocalStorage<HifzData>('quran-hifz', defaultHifzData);
  const [currentSession, setCurrentSession] = useState<HifzSession | null>(null);

  // Initialize progress for a surah if not exists
  const ensureSurahProgress = useCallback((surahNumber: number) => {
    const surah = surahList.find(s => s.number === surahNumber);
    if (!surah) return;

    setHifzData(prev => {
      if (prev.progress[surahNumber]) return prev;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [surahNumber]: {
            surahNumber,
            totalAyahs: surah.numberOfAyahs,
            memorizedAyahs: [],
            reviewQueue: [],
            lastReviewDate: {},
            masteredAyahs: [],
            streak: {},
          },
        },
      };
    });
  }, [setHifzData]);

  // Mark an ayah as memorized
  const markAyahAsMemorized = useCallback((surahNumber: number, ayahNumber: number) => {
    ensureSurahProgress(surahNumber);
    
    setHifzData(prev => {
      const progress = prev.progress[surahNumber];
      if (!progress) return prev;
      
      if (progress.memorizedAyahs.includes(ayahNumber)) return prev;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [surahNumber]: {
            ...progress,
            memorizedAyahs: [...progress.memorizedAyahs, ayahNumber],
            reviewQueue: [...progress.reviewQueue.filter(a => a !== ayahNumber), ayahNumber],
            lastReviewDate: {
              ...progress.lastReviewDate,
              [ayahNumber]: Date.now(),
            },
            streak: {
              ...progress.streak,
              [ayahNumber]: (progress.streak[ayahNumber] || 0) + 1,
            },
          },
        },
      };
    });
  }, [ensureSurahProgress, setHifzData]);

  // Mark an ayah for review
  const markAyahForReview = useCallback((surahNumber: number, ayahNumber: number) => {
    ensureSurahProgress(surahNumber);
    
    setHifzData(prev => {
      const progress = prev.progress[surahNumber];
      if (!progress) return prev;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [surahNumber]: {
            ...progress,
            reviewQueue: progress.reviewQueue.includes(ayahNumber) 
              ? progress.reviewQueue 
              : [...progress.reviewQueue, ayahNumber],
          },
        },
      };
    });
  }, [ensureSurahProgress, setHifzData]);

  // Get review queue - ayahs that need review today based on spaced repetition
  const getReviewQueue = useCallback((surahNumber?: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const queues: { surahNumber: number; ayahNumber: number }[] = [];

    const surahsToCheck = surahNumber 
      ? [surahNumber] 
      : surahList.map(s => s.number);

    surahsToCheck.forEach(num => {
      const progress = hifzData.progress[num];
      if (!progress) return;

      // Check all ayahs that have been reviewed before
      Object.keys(progress.lastReviewDate).forEach(ayahNum => {
        const ayah = parseInt(ayahNum);
        const lastReview = progress.lastReviewDate[ayah];
        const streak = progress.streak[ayah] || 0;
        
        if (streak >= 3 && progress.masteredAyahs.includes(ayah)) {
          // Already mastered - optional review weekly
          const daysSinceReview = Math.floor((todayMs - lastReview) / oneDay);
          if (daysSinceReview >= 7) {
            queues.push({ surahNumber: num, ayahNumber: ayah });
          }
          return;
        }

        // Get interval based on streak
        const intervalIndex = Math.min(streak, REVIEW_INTERVALS.length - 1);
        const interval = REVIEW_INTERVALS[intervalIndex] * oneDay;
        const nextReviewDate = lastReview + interval;

        if (todayMs >= nextReviewDate) {
          queues.push({ surahNumber: num, ayahNumber: ayah });
        }
      });

      // Add newly memorized ayahs for first review
      progress.memorizedAyahs.forEach(ayah => {
        if (!progress.lastReviewDate[ayah]) {
          queues.push({ surahNumber: num, ayahNumber: ayah });
        }
      });
    });

    return queues;
  }, [hifzData.progress]);

  // Get total review count for today
  const getTodayReviewCount = useCallback(() => {
    return getReviewQueue().length;
  }, [getReviewQueue]);

  // Get mastered count for a surah
  const getMasteredCount = useCallback((surahNumber: number) => {
    const progress = hifzData.progress[surahNumber];
    return progress?.masteredAyahs.length || 0;
  }, [hifzData.progress]);

  // Get memorized count for a surah
  const getMemorizedCount = useCallback((surahNumber: number) => {
    const progress = hifzData.progress[surahNumber];
    return progress?.memorizedAyahs.length || 0;
  }, [hifzData.progress]);

  // Record a review result
  const recordReview = useCallback((surahNumber: number, ayahNumber: number, wasCorrect: boolean) => {
    ensureSurahProgress(surahNumber);
    
    setHifzData(prev => {
      const progress = prev.progress[surahNumber];
      if (!progress) return prev;

      const currentStreak = progress.streak[ayahNumber] || 0;
      const newStreak = wasCorrect ? currentStreak + 1 : 0;
      const isNowMastered = newStreak >= 3;

      // Update mastered ayahs
      let newMasteredAyahs = progress.masteredAyahs;
      if (isNowMastered && !progress.masteredAyahs.includes(ayahNumber)) {
        newMasteredAyahs = [...progress.masteredAyahs, ayahNumber];
      } else if (!isNowMastered && progress.masteredAyahs.includes(ayahNumber)) {
        newMasteredAyahs = progress.masteredAyahs.filter(a => a !== ayahNumber);
      }

      return {
        ...prev,
        progress: {
          ...prev.progress,
          [surahNumber]: {
            ...progress,
            lastReviewDate: {
              ...progress.lastReviewDate,
              [ayahNumber]: Date.now(),
            },
            streak: {
              ...progress.streak,
              [ayahNumber]: newStreak,
            },
            masteredAyahs: newMasteredAyahs,
            reviewQueue: wasCorrect 
              ? progress.reviewQueue.filter(a => a !== ayahNumber)
              : [...progress.reviewQueue.filter(a => a !== ayahNumber), ayahNumber],
          },
        },
      };
    });
  }, [ensureSurahProgress, setHifzData]);

  // Start a new hifz session
  const startSession = useCallback((surahNumber: number, mode: HifzMode) => {
    const session: HifzSession = {
      id: `session-${Date.now()}`,
      surahNumber,
      startTime: Date.now(),
      ayahsReviewed: 0,
      ayahsCorrect: 0,
      mode,
    };
    setCurrentSession(session);
    return session;
  }, []);

  // Update session stats
  const updateSession = useCallback((ayahsReviewed: number, ayahsCorrect: number) => {
    setCurrentSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ayahsReviewed,
        ayahsCorrect,
      };
    });
  }, []);

  // End session and save to history
  const endSession = useCallback(() => {
    if (currentSession) {
      setHifzData(prev => ({
        ...prev,
        sessions: [...prev.sessions.slice(-49), currentSession], // Keep last 50 sessions
      }));
      setCurrentSession(null);
    }
  }, [currentSession, setHifzData]);

  // Get overall stats
  const overallStats = useMemo(() => {
    const allProgress = Object.values(hifzData.progress);
    const totalMemorized = allProgress.reduce((sum, p) => sum + p.memorizedAyahs.length, 0);
    const totalMastered = allProgress.reduce((sum, p) => sum + p.masteredAyahs.length, 0);
    const totalSessions = hifzData.sessions.length;
    
    const totalReviewedToday = hifzData.sessions
      .filter(s => {
        const today = new Date().toDateString();
        return new Date(s.startTime).toDateString() === today;
      })
      .reduce((sum, s) => sum + s.ayahsReviewed, 0);

    return {
      totalMemorized,
      totalMastered,
      totalSessions,
      totalReviewedToday,
      reviewCount: getTodayReviewCount(),
    };
  }, [hifzData.progress, hifzData.sessions, getTodayReviewCount]);

  // Get progress for a specific surah
  const getSurahProgress = useCallback((surahNumber: number) => {
    return hifzData.progress[surahNumber] || null;
  }, [hifzData.progress]);

  // Get recent sessions
  const recentSessions = useMemo(() => {
    return hifzData.sessions.slice(-10).reverse();
  }, [hifzData.sessions]);

  return {
    // State
    hifzData,
    currentSession,
    overallStats,
    recentSessions,
    
    // Actions
    ensureSurahProgress,
    markAyahAsMemorized,
    markAyahForReview,
    getReviewQueue,
    getTodayReviewCount,
    getMasteredCount,
    getMemorizedCount,
    getSurahProgress,
    recordReview,
    startSession,
    updateSession,
    endSession,
  };
}
