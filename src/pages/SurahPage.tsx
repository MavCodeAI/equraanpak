import { useParams, useNavigate } from 'react-router-dom';
import { useSurahAyahs } from '@/hooks/useQuranAPI';
import { surahList } from '@/data/surahs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useQuranAudio } from '@/hooks/useQuranAudio';
import { Bookmark, ReadingProgress } from '@/types/quran';
import { useChunkedAyahs } from '@/hooks/useChunkedAyahs';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ArrowLeft, ArrowRight, BookmarkCheck, ChevronLeft, ChevronRight, Home, Minus, Plus, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

const SurahPage = () => {
  const { id } = useParams();
  const surahNumber = parseInt(id || '1');
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  const surah = surahList.find((s) => s.number === surahNumber);

  useReadingTimer();

  const audio = useQuranAudio({ surahNumber, ayahs: ayahs ?? [] });
  const { visibleItems: visibleAyahs, hasMore, sentinelRef } = useChunkedAyahs(ayahs);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);
  const [progress, setProgress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1,
    lastReadAyah: 1,
    completedParas: {},
    streak: 0,
    lastReadDate: '',
    totalAyahsRead: 0,
    todayAyahsRead: 0,
    todayDate: '',
  });

  // Swipe navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`),
    onSwipeRight: () => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`),
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
    const was = isBookmarked(ayahNum);
    if (was) {
      setBookmarks((prev) => prev.filter((b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNum)));
      toast({ title: lang === 'ur' ? 'بک مارک ہٹایا گیا' : 'Bookmark removed', duration: 1500 });
    } else {
      setBookmarks((prev) => [...prev, { surahNumber, ayahNumber: ayahNum, timestamp: Date.now() }]);
      toast({ title: lang === 'ur' ? 'بک مارک لگایا گیا ✅' : 'Bookmark added ✅', duration: 1500 });
    }
    // Track ayah reading
    const today = new Date().toDateString();
    setProgress(prev => ({
      ...prev,
      lastReadAyah: ayahNum,
      todayAyahsRead: prev.todayDate === today ? prev.todayAyahsRead + 1 : 1,
      todayDate: today,
      totalAyahsRead: prev.totalAyahsRead + 1,
    }));
  };

  // Long press for bookmark
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = useCallback((ayahNum: number) => {
    longPressTimer.current = setTimeout(() => {
      toggleBookmark(ayahNum);
    }, 500);
  }, [bookmarks, surahNumber]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (!surah) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="min-h-screen" {...swipeHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1.5">
              {lang === 'ur' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {lang === 'ur' ? 'واپس' : 'Back'}
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-arabic font-bold text-primary rtl">{surah.name}</h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ur' ? surah.urduName : surah.englishNameTranslation}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <AudioPlayer
                isPlaying={audio.isPlaying}
                isLoading={audio.isLoading}
                currentAyah={audio.currentAyah}
                onPlaySurah={audio.playSurah}
                onStop={audio.stop}
                onTogglePlayPause={audio.togglePlayPause}
                compact
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.min(42, settings.fontSize + 2) })}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {/* Progress bar when playing */}
          {(audio.isPlaying || audio.currentAyah) && (
            <div className="mt-1.5">
              <AudioPlayer
                isPlaying={audio.isPlaying}
                isLoading={audio.isLoading}
                currentAyah={audio.currentAyah}
                currentTime={audio.currentTime}
                duration={audio.duration}
                onPlaySurah={audio.playSurah}
                onStop={audio.stop}
                onTogglePlayPause={audio.togglePlayPause}
                onSeek={audio.seek}
              />
            </div>
          )}
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
             {visibleAyahs?.map((ayah) => (
              <span key={ayah.numberInSurah} className="inline group relative">
                <span
                  className={cn(
                    'font-arabic cursor-pointer hover:text-primary transition-colors',
                    isBookmarked(ayah.numberInSurah) && 'text-primary bg-primary/5 rounded px-1',
                    audio.currentAyah === ayah.numberInSurah && 'text-primary bg-primary/10 rounded px-1'
                  )}
                  style={{ fontSize: `${settings.fontSize}px` }}
                  onClick={() => {
                    setProgress(prev => ({ ...prev, lastReadAyah: ayah.numberInSurah }));
                    audio.playAyah(ayah.number, ayah.numberInSurah);
                  }}
                  onTouchStart={() => handleTouchStart(ayah.numberInSurah)}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => { e.preventDefault(); toggleBookmark(ayah.numberInSurah); }}
                >
                  {ayah.text}
                </span>
                {isBookmarked(ayah.numberInSurah) && (
                  <BookmarkCheck className="inline h-3 w-3 text-primary mx-0.5" />
                )}
                <span className="inline-flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-primary/10 text-primary mx-1 font-sans">
                  {ayah.numberInSurah}
                </span>
              </span>
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9"
          >
            <Home className="h-5 w-5 text-primary" />
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
