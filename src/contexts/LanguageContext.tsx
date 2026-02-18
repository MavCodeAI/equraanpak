import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage } from '@/types/quran';

type Translations = Record<string, Record<AppLanguage, string>>;

const translations: Translations = {
  appName: { ur: 'قرآن پاک', en: 'Holy Quran' },
  welcome: { ur: 'السلام علیکم', en: 'Assalamu Alaikum' },
  welcomeMsg: { ur: 'آج قرآن پاک کی تلاوت کا بہترین دن ہے', en: "Today is a blessed day for Quran recitation" },
  search: { ur: 'سورت / پارہ تلاش کریں...', en: 'Search surah / juz...' },
  continueReading: { ur: 'جہاں چھوڑا وہاں سے شروع کریں', en: 'Continue Reading' },
  surahs: { ur: 'سورتیں', en: 'Surahs' },
  juzIndex: { ur: 'پارے', en: 'Juz' },
  ayahs: { ur: 'آیات', en: 'Ayahs' },
  meccan: { ur: 'مکی', en: 'Meccan' },
  medinan: { ur: 'مدنی', en: 'Medinan' },
  bookmarks: { ur: 'بک مارکس', en: 'Bookmarks' },
  schedule: { ur: 'ختم شیڈول', en: 'Khatam Schedule' },
  progress: { ur: 'پیش رفت', en: 'Progress' },
  settings: { ur: 'ترتیبات', en: 'Settings' },
  home: { ur: 'ہوم', en: 'Home' },
  todayGoal: { ur: 'آج کا ہدف', en: "Today's Goal" },
  para: { ur: 'پارہ', en: 'Juz' },
  readToday: { ur: 'آج پڑھنا ہے', en: 'Read today' },
  completed: { ur: 'مکمل', en: 'Completed' },
  remaining: { ur: 'باقی', en: 'Remaining' },
  streak: { ur: 'مسلسل دن', en: 'Day streak' },
  mashallah: { ur: 'ماشاءاللہ! آج کا ہدف پورا ہوا', en: 'MashaAllah! Daily goal completed' },
  keepGoing: { ur: 'ابھی تھوڑا اور پڑھ لیں', en: 'Keep going, read a little more' },
  quranWaiting: { ur: 'قرآن آپ کا منتظر ہے', en: 'The Quran awaits you' },
  days: { ur: 'دن', en: 'days' },
  startSchedule: { ur: 'شیڈول شروع کریں', en: 'Start Schedule' },
  totalDays: { ur: 'کل دن', en: 'Total Days' },
  startDate: { ur: 'شروع کی تاریخ', en: 'Start Date' },
  language: { ur: 'زبان', en: 'Language' },
  fontSize: { ur: 'فونٹ سائز', en: 'Font Size' },
  pageFormat: { ur: 'صفحہ فارمیٹ', en: 'Page Format' },
  darkMode: { ur: 'ڈارک موڈ', en: 'Dark Mode' },
  line15: { ur: '15 لائن (مدینہ مصحف)', en: '15-line (Madina Mushaf)' },
  line16: { ur: '16 لائن (پاکستانی)', en: '16-line (Pakistani)' },
  noBookmarks: { ur: 'ابھی کوئی بک مارک نہیں', en: 'No bookmarks yet' },
  removeBookmark: { ur: 'ہٹائیں', en: 'Remove' },
  addBookmark: { ur: 'بک مارک لگائیں', en: 'Add Bookmark' },
  prev: { ur: 'پچھلا', en: 'Previous' },
  next: { ur: 'اگلا', en: 'Next' },
  loading: { ur: 'لوڈ ہو رہا ہے...', en: 'Loading...' },
  bismillah: { ur: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ', en: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ' },
  overallProgress: { ur: 'مجموعی پیش رفت', en: 'Overall Progress' },
  paraStatus: { ur: 'پاروں کی حیثیت', en: 'Para Status' },
  streakDays: { ur: 'دن مسلسل', en: 'days streak' },
  calendarView: { ur: 'کیلنڈر', en: 'Calendar' },
  scheduleSetup: { ur: 'نیا شیڈول بنائیں', en: 'Create New Schedule' },
  customDays: { ur: 'اپنی مرضی کے دن', en: 'Custom days' },
  dayTarget: { ur: 'آج کا ہدف:', en: "Today's target:" },
  pageReading: { ur: 'صفحہ نمبر سے پڑھیں', en: 'Read by Page' },
  page: { ur: 'صفحہ', en: 'Page' },
  goToPage: { ur: 'صفحہ نمبر', en: 'Page number' },
  go: { ur: 'جائیں', en: 'Go' },
  todayRead: { ur: 'آج پڑھا', en: 'Read Today' },
  todayReadingTime: { ur: 'آج کا پڑھنے کا وقت', en: "Today's Reading Time" },
  weekReadingTime: { ur: 'ہفتے کا پڑھنے کا وقت', en: "This Week's Reading" },
  minutes: { ur: 'منٹ', en: 'min' },
  ayahsRead: { ur: 'آیات پڑھیں', en: 'ayahs read' },
  streakMilestone3: { ur: '3 دن مسلسل! بہت خوب! 🌟', en: '3 day streak! Great! 🌟' },
  streakMilestone7: { ur: '7 دن مسلسل! ماشاءاللہ! ⭐', en: '7 day streak! MashaAllah! ⭐' },
  streakMilestone14: { ur: '14 دن مسلسل! سبحان اللہ! 🏆', en: '14 day streak! SubhanAllah! 🏆' },
  streakMilestone21: { ur: '21 دن مسلسل! بہترین! 💎', en: '21 day streak! Amazing! 💎' },
  streakMilestone30: { ur: '30 دن مسلسل! اللہ اکبر! 👑', en: '30 day streak! Allahu Akbar! 👑' },
  surah: { ur: 'سورۃ', en: 'Surah' },
  ayah: { ur: 'آیت', en: 'Ayah' },
};

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (l: AppLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ur',
  setLang: () => {},
  t: (k) => k,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('quran-lang') as AppLanguage) || 'ur';
  });

  useEffect(() => {
    localStorage.setItem('quran-lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
