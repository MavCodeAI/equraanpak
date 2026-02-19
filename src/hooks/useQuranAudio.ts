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
  const ayahIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Cleanup
  useEffect(() => {
    return () => {
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAyah(null);
    setIsLoading(false);
    isPlayingRef.current = false;
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
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAyah(null);
    };
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentAyah(null);
    };

    try {
      await audio.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    } catch {
      setIsLoading(false);
    }
  }, [qari, stop]);

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
      } catch {
        setIsLoading(false);
      }
    };

    await playNext(0);
  }, [ayahs, qari, stop]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    currentAyah,
    mode,
    playAyah,
    playSurah,
    stop,
    togglePlayPause,
    qari,
  };
}
