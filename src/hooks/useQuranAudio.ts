import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

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
  const qari = settings.qari || 'ar.alafasy';
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'ayah' | 'surah'>('ayah');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const ayahIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animRef = useRef<number | null>(null);

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
    };
  }, []);

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
  }, [stopTimeTracking]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playAyah = useCallback(async (globalAyahNumber: number, numberInSurah: number) => {
    stop();
    setMode('ayah');
    setIsLoading(true);
    setCurrentAyah(numberInSurah);

    const url = `https://cdn.islamic.network/quran/audio/128/${qari}/${globalAyahNumber}.mp3`;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.oncanplay = () => setIsLoading(false);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAyah(null);
      setCurrentTime(0);
      setDuration(0);
      stopTimeTracking();
    };
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentAyah(null);
      stopTimeTracking();
    };

    try {
      await audio.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
      startTimeTracking();
    } catch {
      setIsLoading(false);
    }
  }, [qari, stop, startTimeTracking, stopTimeTracking]);

  const playSurah = useCallback(async () => {
    if (!ayahs?.length) return;
    stop();
    setMode('surah');
    isPlayingRef.current = true;
    ayahIndexRef.current = 0;

    const playNext = async (index: number) => {
      if (index >= ayahs.length || !isPlayingRef.current) {
        stop();
        return;
      }

      const ayah = ayahs[index];
      setCurrentAyah(ayah.numberInSurah);
      setIsLoading(true);

      const url = `https://cdn.islamic.network/quran/audio/128/${qari}/${ayah.number}.mp3`;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.oncanplay = () => setIsLoading(false);
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => {
        ayahIndexRef.current = index + 1;
        playNext(index + 1);
      };
      audio.onerror = () => {
        ayahIndexRef.current = index + 1;
        playNext(index + 1);
      };

      try {
        await audio.play();
        setIsPlaying(true);
        startTimeTracking();
      } catch {
        setIsLoading(false);
      }
    };

    await playNext(0);
  }, [ayahs, qari, stop, startTimeTracking]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
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
  }, [startTimeTracking, stopTimeTracking]);

  return {
    isPlaying,
    isLoading,
    currentAyah,
    mode,
    currentTime,
    duration,
    playAyah,
    playSurah,
    stop,
    togglePlayPause,
    seek,
    qari,
  };
}
