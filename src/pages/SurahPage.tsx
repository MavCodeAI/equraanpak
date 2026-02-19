import { useParams, useNavigate } from 'react-router-dom';
import { useSurahAyahs } from '@/hooks/useQuranAPI';
import { surahList } from '@/data/surahs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useQuranAudio } from '@/hooks/useQuranAudio';
import { useNotes } from '@/hooks/useNotes';
import { Bookmark, ReadingProgress, NoteColor } from '@/types/quran';
import { useChunkedAyahs } from '@/hooks/useChunkedAyahs';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/AudioPlayer';
import { NotesPanel } from '@/components/NotesPanel';
import { NoteEditor } from '@/components/NoteEditor';
import { BookmarkCheck, ChevronLeft, ChevronRight, Home, Minus, Plus, Copy, Share2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

const SurahPage = () => {
  const { id } = useParams();
  const surahNumber = parseInt(id || '1');
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  
  // Memoize surah lookup - O(1) instead of O(n) on each render
  const surah = useMemo(() => surahList.find((s) => s.number === surahNumber), [surahNumber]);
  const [showAudioBar, setShowAudioBar] = useState(false);

  useReadingTimer();

  const audio = useQuranAudio({ surahNumber, ayahs: ayahs ?? [] });
  const { visibleItems: visibleAyahs, hasMore, sentinelRef } = useChunkedAyahs(ayahs);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);
  
  // O(1) bookmark lookup using Set
  const bookmarkSet = useMemo(() => new Set(bookmarks.map(b => `${b.surahNumber}-${b.ayahNumber}`)), [bookmarks]);
  const isBookmarked = useCallback((ayahNum: number) => bookmarkSet.has(`${surahNumber}-${ayahNum}`), [bookmarkSet, surahNumber]);
  const [progress, setProgress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1, lastReadAyah: 1, completedParas: {}, streak: 0,
    lastReadDate: '', totalAyahsRead: 0, todayAyahsRead: 0, todayDate: '',
  });

  // Notes state
  const { notes, addNote, updateNote, deleteNote, hasNote } = useNotes();
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ id: string; content: string; color?: NoteColor } | null>(null);
  const [selectedAyahForNote, setSelectedAyahForNote] = useState<number | null>(null);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: useCallback(() => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`), [surahNumber, navigate]),
    onSwipeRight: useCallback(() => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`), [surahNumber, navigate]),
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

  const toggleBookmark = useCallback((ayahNum: number) => {
    const key = `${surahNumber}-${ayahNum}`;
    if (bookmarkSet.has(key)) {
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
  }, [bookmarkSet, surahNumber, lang]);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((ayahNum: number) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedAyahForNote(ayahNum);
      setNoteEditorOpen(true);
    }, 800);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) { 
      clearTimeout(longPressTimer.current); 
      longPressTimer.current = null; 
    }
  }, []);

  if (!surah) return <div className="p-8 text-center">{t('loading')}</div>;
  const audioActive = audio.isPlaying || audio.currentAyah;

  // Extracted handlers for JSX
  const handlePrevSurah = useCallback(() => surahNumber > 1 && navigate(`/surah/${surahNumber - 1}`), [surahNumber, navigate]);
  const handleNextSurah = useCallback(() => surahNumber < 114 && navigate(`/surah/${surahNumber + 1}`), [surahNumber, navigate]);
  const handleDecreaseFont = useCallback(() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) }), [settings.fontSize, updateSettings]);
  const handleIncreaseFont = useCallback(() => updateSettings({ fontSize: Math.min(42, settings.fontSize + 2) }), [settings.fontSize, updateSettings]);
  const handlePlayAudio = useCallback(() => audio.playSurah(), [audio]);
  const handleGoHome = useCallback(() => navigate('/'), [navigate]);
  const handleAyahClick = useCallback((ayahNum: number, ayahNumberInSurah: number) => {
    setProgress(prev => ({ ...prev, lastReadAyah: ayahNumberInSurah }));
    audio.playAyah(ayahNum, ayahNumberInSurah);
  }, [audio, setProgress]);
  const handleAyahKeyDown = useCallback((e: React.KeyboardEvent, ayahNum: number, ayahNumberInSurah: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setProgress(prev => ({ ...prev, lastReadAyah: ayahNumberInSurah }));
      audio.playAyah(ayahNum, ayahNumberInSurah);
    }
  }, [audio, setProgress]);

  // Note handlers
  const handleAddNote = useCallback((ayahNum: number) => {
    setSelectedAyahForNote(ayahNum);
    setEditingNote(null);
    setNoteEditorOpen(true);
  }, []);

  const handleSaveNote = useCallback((content: string, color?: NoteColor) => {
    if (selectedAyahForNote !== null) {
      addNote(surahNumber, selectedAyahForNote, content, color);
      toast({ title: t('noteSaved'), duration: 1500 });
    }
  }, [addNote, surahNumber, selectedAyahForNote, t]);

  const handleUpdateNote = useCallback((id: string, content: string, color?: NoteColor) => {
    updateNote(id, content, color);
    toast({ title: t('noteSaved'), duration: 1500 });
    setEditingNote(null);
  }, [updateNote, t]);

  const handleDeleteNote = useCallback((id: string) => {
    deleteNote(id);
    toast({ title: t('noteDeleted'), duration: 1500 });
  }, [deleteNote, t]);

  const handleCopyAyah = useCallback(async (text: string, ayahNum: number) => {
    const surahName = lang === 'ur' ? surah?.urduName : surah?.englishName;
    const textToCopy = `${text}\n\n(${surahName} - ${t('ayah')} ${ayahNum})`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: t('ayahCopied'), duration: 1500 });
    } catch {
      toast({ title: 'Failed to copy', duration: 1500 });
    }
  }, [lang, surah, t]);

  const handleShareAyah = useCallback(async (text: string, ayahNum: number) => {
    const surahName = lang === 'ur' ? surah?.urduName : surah?.englishName;
    const shareText = `${text}\n\n(${surahName} - ${t('ayah')} ${ayahNum})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${surahName} - ${t('ayah')} ${ayahNum}`,
          text: shareText,
        });
      } catch {
        // User cancelled or error - ignore
      }
    } else {
      // Fallback to clipboard
      handleCopyAyah(text, ayahNum);
    }
  }, [lang, surah, t, handleCopyAyah]);

  // Context menu / long-press for notes
  // Notes are now shown on hover with action buttons

  return (
    <div className="min-h-screen pb-28" {...swipeHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4 py-3 text-center">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right">
              {/* Left spacer for alignment */}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-arabic font-bold text-primary rtl animate-fade-in">{surah.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ur' ? surah.urduName : surah.englishNameTranslation}
              </p>
            </div>
            <div className="flex-1 flex justify-start">
              <NotesPanel
                notes={notes}
                surahNumber={surahNumber}
                onEditNote={(note) => {
                  setEditingNote({ id: note.id, content: note.content, color: note.color });
                  setSelectedAyahForNote(note.ayahNumber);
                  setNoteEditorOpen(true);
                }}
                onDeleteNote={handleDeleteNote}
                onAddNote={() => {
                  setEditingNote(null);
                  setSelectedAyahForNote(1);
                  setNoteEditorOpen(true);
                }}
                isOpen={notesPanelOpen}
                onOpenChange={setNotesPanelOpen}
              />
            </div>
          </div>
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
            {visibleAyahs?.map((ayah) => {
              const isAyatBookmarked = isBookmarked(ayah.numberInSurah);
              const hasNoteForAyah = hasNote(surahNumber, ayah.numberInSurah);
              return (
                <span key={ayah.numberInSurah} className="inline group relative" data-ayah={ayah.numberInSurah}>
                  <span
                    className={cn(
                      'font-arabic cursor-pointer transition-all duration-200',
                      'hover:text-primary hover:bg-primary/5 rounded-md px-0.5',
                      isAyatBookmarked && 'text-primary bg-primary/8 rounded-md px-1',
                      audio.currentAyah === ayah.numberInSurah && 'text-primary bg-primary/12 rounded-md px-1 font-bold shadow-sm'
                    )}
                    style={{ fontSize: `${settings.fontSize}px` }}
                    onClick={() => handleAyahClick(ayah.number, ayah.numberInSurah)}
                    onTouchStart={() => handleTouchStart(ayah.numberInSurah)}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => { e.preventDefault(); toggleBookmark(ayah.numberInSurah); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => handleAyahKeyDown(e, ayah.number, ayah.numberInSurah)}
                  >
                    {ayah.text}
                  </span>
                  {isAyatBookmarked && (
                    <BookmarkCheck className="inline h-3 w-3 text-primary mx-0.5 animate-scale-in" />
                  )}
                  {hasNoteForAyah && (
                    <StickyNote className="inline h-3 w-3 text-amber-500 mx-0.5 animate-scale-in" />
                  )}
                  <span className="inline-flex items-center justify-center h-5 w-5 text-[10px] rounded-full bg-primary/8 text-primary mx-1 font-sans">
                    {ayah.numberInSurah}
                  </span>
                  {/* Context menu on right-click */}
                  <div className="absolute hidden group-hover:flex items-center gap-1 -top-8 left-0 bg-card border rounded-lg shadow-lg p-1 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNote(ayah.numberInSurah);
                      }}
                      title={t('addNote')}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAyah(ayah.text, ayah.numberInSurah);
                      }}
                      title={t('copyAyah')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareAyah(ayah.text, ayah.numberInSurah);
                      }}
                      title={t('shareAyah')}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </span>
              );
            })}
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
                onSetSleepTimer={audio.setSleepTimer}
                onClearSleepTimer={audio.clearSleepTimer}
                sleepTimerRemaining={audio.sleepTimerRemaining}
              />
            </div>
          )}
          <div className="flex items-center justify-between py-2.5">
            <Button variant="ghost" size="sm" onClick={handlePrevSurah} disabled={surahNumber <= 1} className="gap-0.5 px-2 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">{t('prev')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleDecreaseFont}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            {!audioActive ? (
              <Button variant="default" size="icon" className="h-11 w-11 rounded-full gradient-primary shadow-lg hover:shadow-xl transition-shadow duration-300" onClick={handlePlayAudio}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handleGoHome}>
                <Home className="h-5 w-5 text-primary" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleIncreaseFont}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextSurah} disabled={surahNumber >= 114} className="gap-0.5 px-2 rounded-xl">
              <span className="text-xs hidden sm:inline">{t('next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <NoteEditor
        isOpen={noteEditorOpen}
        onOpenChange={(open) => {
          setNoteEditorOpen(open);
          if (!open) {
            setEditingNote(null);
            setSelectedAyahForNote(null);
          }
        }}
        surahNumber={surahNumber}
        ayahNumber={selectedAyahForNote || undefined}
        note={editingNote ? { id: editingNote.id, surahNumber, ayahNumber: selectedAyahForNote || 1, content: editingNote.content, createdAt: 0, color: editingNote.color } : undefined}
        onSave={handleSaveNote}
        onUpdate={handleUpdateNote}
      />
    </div>
  );
};

export default SurahPage;
