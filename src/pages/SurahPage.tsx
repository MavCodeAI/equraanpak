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
import { BookmarkCheck, ChevronLeft, ChevronRight, Home, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

const SurahPage = () => {
  const { id } = useParams();
  const surahNumber = parseInt(id || '1');
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  const surah = surahList.find((s) => s.number === surahNumber);
  const [showAudioBar, setShowAudioBar] = useState(false);

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

  // Show audio bar when playing
  useEffect(() => {
    if (audio.isPlaying || audio.currentAyah) setShowAudioBar(true);
  }, [audio.isPlaying, audio.currentAyah]);

  // Auto-scroll to playing ayah
  useEffect(() => {
    if (audio.currentAyah) {
      const el = document.querySelector(`[data-ayah="${audio.currentAyah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audio.currentAyah]);

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
  const handleTouchStart = (ayahNum: number) => {
    longPressTimer.current = setTimeout(() => {
      toggleBookmark(ayahNum);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (!surah) return <div className="p-8 text-center">{t('loading')}</div>;

  const audioActive = audio.isPlaying || audio.currentAyah;

  return (
    <div className="min-h-screen pb-28" {...swipeHandlers}>
      {/* Minimal Header — just surah name */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-2.5 text-center">
          <h1 className="text-lg font-arabic font-bold text-primary rtl">{surah.name}</h1>
          <p className="text-xs text-muted-foreground">
            {lang === 'ur' ? surah.urduName : surah.englishNameTranslation}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Bismillah */}
        {surahNumber !== 9 && (
          <p className="text-center font-arabic text-2xl mb-6 text-primary rtl leading-loose">
            بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
          </p>
        )}

        {/* Hint banner */}
        {!audioActive && !isLoading && (
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="rtl leading-[2.5] space-y-1" dir="rtl">
            {visibleAyahs?.map((ayah) => (
              <span key={ayah.numberInSurah} className="inline group relative" data-ayah={ayah.numberInSurah}>
                <span
                  className={cn(
                    'font-arabic cursor-pointer hover:text-primary transition-colors',
                    isBookmarked(ayah.numberInSurah) && 'text-primary bg-primary/5 rounded px-1',
                    audio.currentAyah === ayah.numberInSurah && 'text-primary bg-primary/10 rounded px-1 font-bold'
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

      {/* ═══ Bottom Toolbar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-3">
          {/* Audio player row — shown when audio is active */}
          {audioActive && (
            <div className="pt-2 pb-1 border-b border-border/50">
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

          {/* Controls row */}
          <div className="flex items-center justify-between py-2">
            {/* Prev Surah */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`)}
              disabled={surahNumber <= 1}
              className="gap-0.5 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs hidden min-[380px]:inline">{t('prev')}</span>
            </Button>

            {/* Font size */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}>
              <Minus className="h-3.5 w-3.5" />
            </Button>

            {/* Play / Home */}
            {!audioActive ? (
              <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={audio.playSurah}
                title={lang === 'ur' ? 'پوری سورت سنیں' : 'Play All'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/')}>
                <Home className="h-5 w-5 text-primary" />
              </Button>
            )}

            {/* Font size */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSettings({ fontSize: Math.min(42, settings.fontSize + 2) })}>
              <Plus className="h-3.5 w-3.5" />
            </Button>

            {/* Next Surah */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`)}
              disabled={surahNumber >= 114}
              className="gap-0.5 px-2"
            >
              <span className="text-xs hidden min-[380px]:inline">{t('next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahPage;
