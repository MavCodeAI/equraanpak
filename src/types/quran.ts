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

export type QariId = 'ar.alafasy' | 'ar.abdurrahmaansudais' | 'ar.abdulsamad' | 'ar.husary' | 'ar.minshawi';

export interface AppSettings {
  language: AppLanguage;
  pageFormat: PageFormat;
  fontSize: number;
  darkMode: boolean;
  qari: QariId;
}
