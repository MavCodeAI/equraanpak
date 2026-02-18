import { useParams, useNavigate } from 'react-router-dom';
import { useSurahAyahs } from '@/hooks/useQuranAPI';
import { surahList } from '@/data/surahs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Bookmark, ReadingProgress } from '@/types/quran';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BookmarkPlus, BookmarkCheck, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const SurahPage = () => {
  const { id } = useParams();
  const surahNumber = parseInt(id || '1');
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  const surah = surahList.find((s) => s.number === surahNumber);

  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);
  const [progress, setProgress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1,
    lastReadAyah: 1,
    completedParas: {},
    streak: 0,
    lastReadDate: '',
    totalAyahsRead: 0,
  });

  // Update last read position
  useEffect(() => {
    if (surahNumber > 0) {
      const today = new Date().toDateString();
      setProgress((prev) => ({
        ...prev,
        lastReadSurah: surahNumber,
        lastReadDate: today,
        streak: prev.lastReadDate === today ? prev.streak :
          prev.lastReadDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1,
      }));
    }
  }, [surahNumber]);

  const isBookmarked = (ayahNum: number) =>
    bookmarks.some((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNum);

  const toggleBookmark = (ayahNum: number) => {
    if (isBookmarked(ayahNum)) {
      setBookmarks((prev) => prev.filter((b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNum)));
    } else {
      setBookmarks((prev) => [...prev, { surahNumber, ayahNumber: ayahNum, timestamp: Date.now() }]);
    }
  };

  if (!surah) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            {lang === 'ur' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-arabic font-bold text-primary rtl">{surah.name}</h1>
            <p className="text-xs text-muted-foreground">
              {lang === 'ur' ? surah.urduName : surah.englishNameTranslation}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.min(42, settings.fontSize + 2) })}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Bismillah */}
        {surahNumber !== 9 && (
          <p className="text-center font-arabic text-2xl mb-6 text-primary rtl leading-loose">
            بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
          </p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="rtl leading-[2.5] space-y-1" dir="rtl">
            {ayahs?.map((ayah) => (
              <span key={ayah.numberInSurah} className="inline group relative">
                <span
                  className={cn(
                    'font-arabic cursor-pointer hover:text-primary transition-colors',
                    isBookmarked(ayah.numberInSurah) && 'text-primary bg-primary/5 rounded px-1'
                  )}
                  style={{ fontSize: `${settings.fontSize}px` }}
                  onClick={() => toggleBookmark(ayah.numberInSurah)}
                >
                  {ayah.text}
                </span>
                <span className="inline-flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-primary/10 text-primary mx-1 font-sans">
                  {ayah.numberInSurah}
                </span>
              </span>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`)}
            disabled={surahNumber <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('prev')}
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {surahNumber} / 114
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`)}
            disabled={surahNumber >= 114}
            className="gap-1"
          >
            {t('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurahPage;
