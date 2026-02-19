export interface Surah {
  number: number;
  name: string; // Arabic
  englishName: string;
  englishNameTranslation: string;
  urduName: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  juz: number[];
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah: { number: number; name: string };
}

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  timestamp: number;
}

export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface UserNote {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  content: string;
  createdAt: number;
  updatedAt?: number;
  color?: NoteColor;
}

export interface Highlight {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  startOffset: number;
  endOffset: number;
  text: string;
  color: NoteColor;
  createdAt: number;
}

export interface KhatamSchedule {
  totalDays: number;
  startDate: string;
  completedDays: Record<number, boolean>; // day index -> completed
  pagesPerDay: number;
}

export interface ReadingProgress {
  lastReadSurah: number;
  lastReadAyah: number;
  completedParas: Record<number, boolean>;
  streak: number;
  lastReadDate: string;
  totalAyahsRead: number;
  todayAyahsRead: number;
  todayDate: string;
}

export type AppLanguage = 'ur' | 'en';
export type PageFormat = '15-line' | '16-line';
export type AudioSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5;
export type RepeatMode = 'none' | 'ayah' | 'surah' | 'range';

export type HifzMode = 'learn' | 'review' | 'test';

export interface HifzProgress {
  surahNumber: number;
  totalAyahs: number;
  memorizedAyahs: number[]; // ayah numbers that are memorized
  reviewQueue: number[]; // ayahs needing review
  lastReviewDate: Record<number, number>; // ayah -> timestamp
  masteredAyahs: number[]; // ayahs reviewed 3+ times correctly
  streak: Record<number, number>; // ayah -> consecutive correct answers
}

export interface HifzSession {
  id: string;
  surahNumber: number;
  startTime: number;
  ayahsReviewed: number;
  ayahsCorrect: number;
  mode: HifzMode;
}

export interface HifzData {
  progress: Record<number, HifzProgress>; // surahNumber -> progress
  sessions: HifzSession[];
  reviewCount: number; // total ayahs to review today
}

export type QariId = 'ar.alafasy' | 'ar.abdurrahmaansudais' | 'ar.abdulsamad' | 'ar.husary' | 'ar.minshawi';

export interface AppSettings {
  language: AppLanguage;
  pageFormat: PageFormat;
  fontSize: number;
  darkMode: boolean;
  qari: QariId;
  audioSpeed: AudioSpeed;
  repeatMode: RepeatMode;
  repeatRangeStart?: number;
  repeatRangeEnd?: number;
  sleepTimerMinutes?: number;
  hifzModeEnabled?: boolean;
}
