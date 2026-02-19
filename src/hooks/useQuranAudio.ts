import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { RepeatMode } from '@/types/quran';

export type QariId = 'ar.alafasy' | 'ar.abdurrahmaansudais' | 'ar.abdulsamad' | 'ar.husary' | 'ar.minshawi';

export interface QariInfo {
  id: QariId;
  nameAr: string;
  nameEn: string;
  nameUr: string;
}

export const QARI_LIST: QariInfo[] = [
  { id: 'ar.alafasy', nameAr: 'مشاري العفاسي', nameEn: 'Mishary Alafasy', nameUr: 'مشاری العفاسی' },
  { id: 'ar.abdurrahmaansudais', nameAr: 'عبدالرحمن السديس', nameEn: 'Abdurrahman As-Sudais', nameUr: 'عبدالرحمٰن السدیس' },
  { id: 'ar.abdulsamad', nameAr: 'عبدالباسط عبدالصمد', nameEn: 'Abdul Basit', nameUr: 'عبدالباسط عبدالصمد' },
  { id: 'ar.husary', nameAr: 'محمود خليل الحصري', nameEn: 'Al-Husary', nameUr: 'محمود خلیل الحصری' },
  { id: 'ar.minshawi', nameAr: 'محمد صديق المنشاوي', nameEn: 'Al-Minshawi', nameUr: 'محمد صدیق المنشاوی' },
];

interface UseQuranAudioOptions {
  surahNumber: number;
  ayahs?: { number: number; numberInSurah: number }[];
}

export function useQuranAudio({ surahNumber, ayahs }: UseQuranAudioOptions) {
  const { settings } = useSettings();
  const { lang } = useLanguage();
  const qari = settings.qari || 'ar.alafasy';
  const audioSpeed = settings.audioSpeed || 1;
  const repeatMode = settings.repeatMode || 'none';
  const repeatRangeStart = settings.repeatRangeStart;
  const repeatRangeEnd = settings.repeatRangeEnd;
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'ayah' | 'surah'>('ayah');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const ayahIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animRef = useRef<number | null>(null);
  const playNextRef = useRef<((index: number) => Promise<void>) | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const originalAyahIndexRef = useRef<number>(0); // For repeat range functionality

  // Time update loop
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
    animRef.current = requestAnimationFrame(updateTime);
  }, []);

  const startTimeTracking = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(updateTime);
  }, [updateTime]);

  const stopTimeTracking = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimeTracking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [stopTimeTracking]);

  // Stop when qari changes
  useEffect(() => {
    stop();
  }, [qari]);

  const stop = useCallback(() => {
    stopTimeTracking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAyah(null);
    setIsLoading(false);
    setCurrentTime(0);
    setDuration(0);
    isPlayingRef.current = false;
    playNextRef.current = null;
    // Clear sleep timer
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerRemaining(null);
  }, [stopTimeTracking]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Set audio playback speed
  const setAudioSpeed = useCallback((speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // Sleep timer functions
  const setSleepTimer = useCallback((minutes: number) => {
    // Clear existing timer
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
    }
    
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerRemaining(minutes * 60);
    
    sleepTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSleepTimerRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(sleepTimerRef.current!);
        sleepTimerRef.current = null;
        stop(); // Stop audio when timer expires
        toast({
          title: lang === 'ur' ? 'سویٹائمر ختم ہو گیا' : 'Sleep timer ended',
          duration: 2000
        });
      }
    }, 1000);
  }, [stop, lang]);

  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerRemaining(null);
  }, []);

  // Internal: play a sequence of ayahs starting from an index
  const startSequentialPlay = useCallback(async (startIndex: number) => {
    if (!ayahs?.length) return;
    stop();
    setMode('surah');
    isPlayingRef.current = true;
    ayahIndexRef.current = startIndex;
    originalAyahIndexRef.current = startIndex;

    const playNext = async (index: number) => {
      if (!isPlayingRef.current) {
        stop();
        return;
      }

      // Handle repeat modes
      if (index >= ayahs.length) {
        if (repeatMode === 'surah') {
          // Repeat entire surah
          index = 0;
        } else if (repeatMode === 'range' && repeatRangeStart !== undefined && repeatRangeEnd !== undefined) {
          // Repeat range
          const rangeStartIdx = ayahs.findIndex(a => a.numberInSurah === repeatRangeStart);
          const rangeEndIdx = ayahs.findIndex(a => a.numberInSurah === repeatRangeEnd);
          if (rangeStartIdx !== -1 && rangeEndIdx !== -1) {
            index = rangeStartIdx;
          } else {
            stop();
            return;
          }
        } else if (repeatMode === 'ayah') {
          // Repeat single ayah
          index = originalAyahIndexRef.current;
        } else {
          stop();
          return;
        }
      }

      const ayah = ayahs[index];
      setCurrentAyah(ayah.numberInSurah);
      setIsLoading(true);

      const url = `https://cdn.islamic.network/quran/audio/128/${qari}/${ayah.number}.mp3`;
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Set playback speed
      audio.playbackRate = audioSpeed;

      audio.oncanplay = () => setIsLoading(false);
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => {
        ayahIndexRef.current = index + 1;
        playNext(index + 1);
      };
      audio.onerror = () => {
        // Skip to next ayah on error, but show warning after 3 consecutive failures
        const errorCount = (audioRef.current as unknown as { __errorCount?: number }).__errorCount || 0;
        (audioRef.current as unknown as { __errorCount?: number }).__errorCount = errorCount + 1;
        
        if (errorCount >= 2) {
          const errorMsg = lang === 'ur' 
            ? 'آڈیو لوڈ نہیں ہو سکا۔ دوسرا قاری آزمائیں' 
            : 'Audio failed to load. Try a different reciter';
          toast({ 
            title: errorMsg, 
            variant: 'destructive',
            duration: 3000 
          });
          (audioRef.current as unknown as { __errorCount?: number }).__errorCount = 0;
          stop();
        } else {
          ayahIndexRef.current = index + 1;
          playNext(index + 1);
        }
      };

      try {
        await audio.play();
        setIsPlaying(true);
        startTimeTracking();
      } catch {
        setIsLoading(false);
      }
    };

    playNextRef.current = playNext;
    await playNext(startIndex);
  }, [ayahs, qari, audioSpeed, repeatMode, repeatRangeStart, repeatRangeEnd, stop, startTimeTracking, lang]);

  // Play from a specific ayah and continue to the end
  const playAyah = useCallback(async (globalAyahNumber: number, numberInSurah: number) => {
    if (!ayahs?.length) return;
    // Find the index of this ayah in the array
    const index = ayahs.findIndex(a => a.numberInSurah === numberInSurah);
    if (index === -1) return;
    await startSequentialPlay(index);
  }, [ayahs, startSequentialPlay]);

  // Play from the beginning
  const playSurah = useCallback(async () => {
    await startSequentialPlay(0);
  }, [startSequentialPlay]);

  // Skip to next ayah
  const skipNext = useCallback(() => {
    if (!ayahs?.length || !isPlayingRef.current) return;
    const nextIndex = ayahIndexRef.current + 1;
    if (nextIndex < ayahs.length) {
      // Stop current audio and play next
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopTimeTracking();
      playNextRef.current?.(nextIndex);
    }
  }, [ayahs, stopTimeTracking]);

  // Skip to previous ayah
  const skipPrev = useCallback(() => {
    if (!ayahs?.length || !isPlayingRef.current) return;
    const prevIndex = Math.max(0, ayahIndexRef.current - 1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopTimeTracking();
    playNextRef.current?.(prevIndex);
  }, [ayahs, stopTimeTracking]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.playbackRate = audioSpeed;
      audioRef.current.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
      startTimeTracking();
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopTimeTracking();
    }
  }, [startTimeTracking, stopTimeTracking, audioSpeed]);

  return {
    isPlaying,
    isLoading,
    currentAyah,
    mode,
    currentTime,
    duration,
    sleepTimerRemaining,
    playAyah,
    playSurah,
    stop,
    togglePlayPause,
    seek,
    skipNext,
    skipPrev,
    qari,
    audioSpeed,
    setAudioSpeed,
    setSleepTimer,
    clearSleepTimer,
  };
}
