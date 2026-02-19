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
    lastReadSurah: 1, lastReadAyah: 1, completedParas: {}, streak: 0,
    lastReadDate: '', totalAyahsRead: 0, todayAyahsRead: 0, todayDate: '',
  });

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`),
    onSwipeRight: () => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`),
  });

  useEffect(() => {
    if (surahNumber > 0) {
      const today = new Date().toDateString();
      setProgress((prev) => ({
        ...prev, lastReadSurah: surahNumber, lastReadDate: today,
        streak: prev.lastReadDate === today ? prev.streak :
          prev.lastReadDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1,
      }));
    }
  }, [surahNumber]);

  useEffect(() => {
    if (audio.isPlaying || audio.currentAyah) setShowAudioBar(true);
  }, [audio.isPlaying, audio.currentAyah]);

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
      ...prev, lastReadAyah: ayahNum,
      todayAyahsRead: prev.todayDate === today ? prev.todayAyahsRead + 1 : 1,
      todayDate: today, totalAyahsRead: prev.totalAyahsRead + 1,
    }));
  };

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = (ayahNum: number) => {
    longPressTimer.current = setTimeout(() => toggleBookmark(ayahNum), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  if (!surah) return <div className="p-8 text-center">{t('loading')}</div>;
  const audioActive = audio.isPlaying || audio.currentAyah;

  return (
    <div className="min-h-screen pb-28" {...swipeHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4 py-3 text-center">
          <h1 className="text-xl font-arabic font-bold text-primary rtl animate-fade-in">{surah.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ur' ? surah.urduName : surah.englishNameTranslation}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Bismillah */}
        {surahNumber !== 9 && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="font-arabic text-2xl text-primary rtl leading-loose">
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </p>
            </div>
          </div>
        )}

        {/* Hint */}
        {!audioActive && !isLoading && (
          <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center animate-fade-in">
            <p className="text-xs text-muted-foreground">
              {lang === 'ur'
                ? '🔊 آیت پر ٹیپ کریں — وہاں سے مسلسل تلاوت شروع ہوگی'
                : '🔊 Tap any ayah to start continuous playback from there'}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/60 animate-pulse rounded-lg" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        ) : (
          <div className="rtl leading-[2.8] space-y-1 animate-fade-in" dir="rtl">
            {visibleAyahs?.map((ayah) => (
              <span key={ayah.numberInSurah} className="inline group relative" data-ayah={ayah.numberInSurah}>
                <span
                  className={cn(
                    'font-arabic cursor-pointer transition-all duration-200',
                    'hover:text-primary hover:bg-primary/5 rounded-md px-0.5',
                    isBookmarked(ayah.numberInSurah) && 'text-primary bg-primary/8 rounded-md px-1',
                    audio.currentAyah === ayah.numberInSurah && 'text-primary bg-primary/12 rounded-md px-1 font-bold shadow-sm'
                  )}
                  style={{ fontSize: `${settings.fontSize}px` }}
                  onClick={() => {
                    setProgress(prev => ({ ...prev, lastReadAyah: ayah.numberInSurah }));
                    audio.playAyah(ayah.number, ayah.numberInSurah);
                  }}
                  onTouchStart={() => handleTouchStart(ayah.numberInSurah)}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => { e.preventDefault(); toggleBookmark(ayah.numberInSurah); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setProgress(prev => ({ ...prev, lastReadAyah: ayah.numberInSurah }));
                      audio.playAyah(ayah.number, ayah.numberInSurah);
                    }
                  }}
                >
                  {ayah.text}
                </span>
                {isBookmarked(ayah.numberInSurah) && (
                  <BookmarkCheck className="inline h-3 w-3 text-primary mx-0.5 animate-scale-in" />
                )}
                <span className="inline-flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-primary/8 text-primary mx-1 font-sans">
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

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-3">
          {audioActive && (
            <div className="pt-2 pb-1 border-b border-border/30">
              <AudioPlayer
                isPlaying={audio.isPlaying} isLoading={audio.isLoading}
                currentAyah={audio.currentAyah} currentTime={audio.currentTime}
                duration={audio.duration} totalAyahs={ayahs?.length}
                onPlaySurah={audio.playSurah} onStop={audio.stop}
                onTogglePlayPause={audio.togglePlayPause} onSeek={audio.seek}
                onSkipNext={audio.skipNext} onSkipPrev={audio.skipPrev}
              />
            </div>
          )}
          <div className="flex items-center justify-between py-2.5">
            <Button variant="ghost" size="sm" onClick={() => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`)} disabled={surahNumber <= 1} className="gap-0.5 px-2 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">{t('prev')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            {!audioActive ? (
              <Button variant="default" size="icon" className="h-11 w-11 rounded-full gradient-primary shadow-lg hover:shadow-xl transition-shadow duration-300" onClick={audio.playSurah}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate('/')}>
                <Home className="h-5 w-5 text-primary" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateSettings({ fontSize: Math.min(42, settings.fontSize + 2) })}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`)} disabled={surahNumber >= 114} className="gap-0.5 px-2 rounded-xl">
              <span className="text-xs hidden sm:inline">{t('next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahPage;
