import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageAyahs } from '@/hooks/useQuranAPI';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useQuranAudio } from '@/hooks/useQuranAudio';
import { Bookmark } from '@/types/quran';
import { useChunkedAyahs } from '@/hooks/useChunkedAyahs';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, BookmarkCheck, ChevronLeft, ChevronRight, Home, Minus, Plus, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const TOTAL_PAGES = 604;
const TOTAL_PAGES_16 = 548;

const PageReadingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [pageInput, setPageInput] = useState('');

  useReadingTimer();

  const totalPages = settings.pageFormat === '16-line' ? TOTAL_PAGES_16 : TOTAL_PAGES;
  const [currentPage, setCurrentPage] = useLocalStorage<number>('quran-current-page', 1);

  // Handle page param from juz navigation
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const p = parseInt(pageParam);
      if (p >= 1 && p <= totalPages) setCurrentPage(p);
    }
  }, [searchParams]);

  const { data: ayahs, isLoading } = usePageAyahs(currentPage);
  const { visibleItems: visibleAyahs, hasMore, sentinelRef } = useChunkedAyahs(ayahs);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);

  // Get first surah number for audio - page may have multiple surahs
  const firstSurahNum = ayahs?.[0]?.surah?.number ?? 1;
  const audio = useQuranAudio({ surahNumber: firstSurahNum, ayahs: ayahs ?? [] });

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(clamped);
  };

  // Swipe navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => goToPage(currentPage + 1),
    onSwipeRight: () => goToPage(currentPage - 1),
  });

  const handlePageJump = () => {
    const p = parseInt(pageInput);
    if (p >= 1 && p <= totalPages) {
      goToPage(p);
      setPageInput('');
    }
  };

  const isBookmarked = (surahNum: number, ayahNum: number) =>
    bookmarks.some((b) => b.surahNumber === surahNum && b.ayahNumber === ayahNum);

  const toggleBookmark = (surahNum: number, ayahNum: number) => {
    const was = isBookmarked(surahNum, ayahNum);
    if (was) {
      setBookmarks((prev) => prev.filter((b) => !(b.surahNumber === surahNum && b.ayahNumber === ayahNum)));
      toast({ title: lang === 'ur' ? 'بک مارک ہٹایا گیا' : 'Bookmark removed', duration: 1500 });
    } else {
      setBookmarks((prev) => [...prev, { surahNumber: surahNum, ayahNumber: ayahNum, timestamp: Date.now() }]);
      toast({ title: lang === 'ur' ? 'بک مارک لگایا گیا ✅' : 'Bookmark added ✅', duration: 1500 });
    }
  };

  // Long press for bookmark
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = useCallback((surahNum: number, ayahNum: number) => {
    longPressTimer.current = setTimeout(() => {
      toggleBookmark(surahNum, ayahNum);
    }, 500);
  }, [bookmarks]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Auto-scroll to playing ayah
  useEffect(() => {
    if (audio.currentAyah) {
      const el = document.querySelector(`[data-ayah-page="${audio.currentAyah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audio.currentAyah]);

  const groupedBySurah = visibleAyahs?.reduce((acc, ayah) => {
    const surahNum = ayah.surah.number;
    if (!acc[surahNum]) acc[surahNum] = { name: ayah.surah.name, ayahs: [] };
    acc[surahNum].ayahs.push(ayah);
    return acc;
  }, {} as Record<number, { name: string; ayahs: typeof ayahs }>);

  return (
    <div className="min-h-screen pb-16" {...swipeHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1.5">
              {lang === 'ur' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {lang === 'ur' ? 'واپس' : 'Back'}
            </Button>
            <div className="text-center">
              <h1 className="text-base font-bold text-primary">
                {t('page')} {currentPage}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {settings.pageFormat === '16-line' ? t('line16') : t('line15')}
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
          {(audio.isPlaying || audio.currentAyah) && (
            <div className="mt-1.5">
              <AudioPlayer
                isPlaying={audio.isPlaying}
                isLoading={audio.isLoading}
                currentAyah={audio.currentAyah}
                currentTime={audio.currentTime}
                duration={audio.duration}
                totalAyahs={ayahs?.length}
                onPlaySurah={audio.playSurah}
                onStop={audio.stop}
                onTogglePlayPause={audio.togglePlayPause}
                onSeek={audio.seek}
                onSkipNext={audio.skipNext}
                onSkipPrev={audio.skipPrev}
              />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="flex gap-2 mb-4">
          <Input
            type="number"
            min={1}
            max={totalPages}
            placeholder={`${t('goToPage')} (1-${totalPages})`}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePageJump()}
            className="text-center"
          />
          <Button size="sm" onClick={handlePageJump} disabled={!pageInput}>
            {t('go')}
          </Button>
        </div>

        {/* Hint banner */}
        {!audio.isPlaying && !audio.currentAyah && !isLoading && (
          <div className="mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-center">
            <p className="text-xs text-muted-foreground">
              {lang === 'ur' 
                ? '🔊 آیت پر ٹیپ کریں — وہاں سے مسلسل تلاوت شروع ہوگی'
                : '🔊 Tap any ayah to start continuous playback from there'}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedBySurah && Object.entries(groupedBySurah).map(([surahNum, group]) => (
              <div key={surahNum}>
                {group.ayahs[0]?.numberInSurah === 1 && (
                  <div className="text-center mb-3 py-2 border-y border-primary/20">
                    <h2 className="text-xl font-arabic font-bold text-primary rtl">{group.name}</h2>
                    {parseInt(surahNum) !== 9 && parseInt(surahNum) !== 1 && (
                      <p className="font-arabic text-lg text-primary/80 rtl mt-1 leading-loose">
                        بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                      </p>
                    )}
                  </div>
                )}

                <div className="rtl leading-[2.5]" dir="rtl">
                  {group.ayahs.map((ayah) => (
                    <span key={`${surahNum}-${ayah.numberInSurah}`} className="inline" data-ayah-page={ayah.numberInSurah}>
                      <span
                        className={cn(
                          'font-arabic cursor-pointer hover:text-primary transition-colors',
                          isBookmarked(parseInt(surahNum), ayah.numberInSurah) && 'text-primary bg-primary/5 rounded px-1',
                          audio.currentAyah === ayah.numberInSurah && 'text-primary bg-primary/10 rounded px-1 font-bold'
                        )}
                        style={{ fontSize: `${settings.fontSize}px` }}
                        onClick={() => audio.playAyah(ayah.number, ayah.numberInSurah)}
                        onTouchStart={() => handleTouchStart(parseInt(surahNum), ayah.numberInSurah)}
                        onTouchEnd={handleTouchEnd}
                        onContextMenu={(e) => { e.preventDefault(); toggleBookmark(parseInt(surahNum), ayah.numberInSurah); }}
                      >
                        {ayah.text}
                      </span>
                      {isBookmarked(parseInt(surahNum), ayah.numberInSurah) && (
                        <BookmarkCheck className="inline h-3 w-3 text-primary mx-0.5" />
                      )}
                      <span className="inline-flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-primary/10 text-primary mx-1 font-sans">
                        {ayah.numberInSurah}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
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
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
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
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
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

export default PageReadingPage;
