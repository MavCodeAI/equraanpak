import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSurahAyahs } from '@/hooks/useQuranAPI';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHifz } from '@/hooks/useHifz';
import { surahList } from '@/data/surahs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, ChevronRight, Eye, EyeOff, Check, X, 
  Brain, BookOpen, FileQuestion, Volume2, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HifzMode } from '@/types/quran';

interface HifzModeProps {
  surahNumber?: number;
  initialMode?: HifzMode;
  onComplete?: () => void;
}

export function HifzMode({ surahNumber: propSurahNumber, initialMode = 'learn', onComplete }: HifzModeProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  const surahNum = propSurahNumber || parseInt(id || '1');
  const { data: ayahs, isLoading } = useSurahAyahs(surahNum);
  const surah = surahList.find(s => s.number === surahNum);
  
  const {
    getMemorizedCount,
    getMasteredCount,
    markAyahAsMemorized,
    markAyahForReview,
    recordReview,
    startSession,
    updateSession,
    endSession,
    currentSession,
  } = useHifz();

  const [mode, setMode] = useState<HifzMode>(initialMode);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showText, setShowText] = useState(mode === 'learn');
  const [revealedWords, setRevealedWords] = useState<number[]>([]);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  // Initialize session
  useEffect(() => {
    if (surahNum && !currentSession) {
      startSession(surahNum, mode);
    }
  }, [surahNum, mode, currentSession, startSession]);

  // Auto-reveal in learn mode
  useEffect(() => {
    if (mode === 'learn') {
      setShowText(true);
    } else if (mode === 'review') {
      // Show first 3 words in review mode
      setRevealedWords([0, 1, 2]);
    } else {
      // Test mode - hide everything
      setShowText(false);
      setRevealedWords([]);
    }
  }, [mode, currentAyahIndex]);

  const currentAyah = ayahs?.[currentAyahIndex];
  const totalAyahs = ayahs?.length || 0;
  const progress = totalAyahs > 0 ? ((currentAyahIndex + 1) / totalAyahs) * 100 : 0;

  // Get visible text based on mode
  const getVisibleText = useCallback(() => {
    if (!currentAyah) return '';
    
    if (mode === 'learn' && showText) {
      return currentAyah.text;
    }
    
    if (mode === 'review') {
      // Show first few words only
      const words = currentAyah.text.split(' ');
      const visibleWords = words.map((word, idx) => 
        revealedWords.includes(idx) ? word : '_____'
      ).join(' ');
      return visibleWords;
    }
    
    // Test mode - hide everything
    return '🧠 ' + (lang === 'ur' ? 'آیت یاد کریں' : 'Recite the Ayah');
  }, [currentAyah, mode, showText, revealedWords, lang]);

  const handleNext = useCallback(() => {
    if (currentAyahIndex < totalAyahs - 1) {
      setCurrentAyahIndex(prev => prev + 1);
      setLastResult(null);
    }
  }, [currentAyahIndex, totalAyahs]);

  const handlePrev = useCallback(() => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
      setLastResult(null);
    }
  }, [currentAyahIndex]);

  const handleMarkMemorized = useCallback(() => {
    if (currentAyah) {
      markAyahAsMemorized(surahNum, currentAyah.numberInSurah);
      recordReview(surahNum, currentAyah.numberInSurah, true);
      setSessionStats(prev => ({ reviewed: prev.reviewed + 1, correct: prev.correct + 1 }));
      setLastResult('correct');
      updateSession(sessionStats.reviewed + 1, sessionStats.correct + 1);
      
      setTimeout(() => {
        handleNext();
      }, 800);
    }
  }, [currentAyah, surahNum, markAyahAsMemorized, recordReview, sessionStats, updateSession, handleNext]);

  const handleMarkNeedsPractice = useCallback(() => {
    if (currentAyah) {
      markAyahForReview(surahNum, currentAyah.numberInSurah);
      recordReview(surahNum, currentAyah.numberInSurah, false);
      setSessionStats(prev => ({ reviewed: prev.reviewed + 1, correct: prev.correct }));
      setLastResult('wrong');
      updateSession(sessionStats.reviewed + 1, sessionStats.correct);
      
      setTimeout(() => {
        handleNext();
      }, 800);
    }
  }, [currentAyah, surahNum, markAyahForReview, recordReview, sessionStats, updateSession, handleNext]);

  const handleReveal = useCallback(() => {
    if (mode === 'learn') {
      setShowText(prev => !prev);
    } else if (mode === 'review') {
      // Reveal more words
      const words = currentAyah?.text.split(' ').length || 0;
      if (revealedWords.length < words) {
        setRevealedWords(prev => [...prev, prev.length]);
      }
    } else {
      setShowText(true);
    }
  }, [mode, currentAyah, revealedWords]);

  const handleEndSession = useCallback(() => {
    endSession();
    onComplete?.();
  }, [endSession, onComplete]);

  const changeMode = useCallback((newMode: HifzMode) => {
    setMode(newMode);
    setCurrentAyahIndex(0);
    setSessionStats({ reviewed: 0, correct: 0 });
    startSession(surahNum, newMode);
  }, [surahNum, startSession]);

  if (isLoading || !ayahs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-primary">
                {lang === 'ur' ? surah?.urduName : surah?.englishName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ur' ? `آیت ${currentAyahIndex + 1} / ${totalAyahs}` : `Ayah ${currentAyahIndex + 1} / ${totalAyahs}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              {lang === 'ur' ? 'ختم' : 'End'}
            </Button>
          </div>
          
          {/* Progress bar */}
          <Progress value={progress} className="h-1 mt-2" />
          
          {/* Mode tabs */}
          <div className="flex gap-1 mt-3 bg-muted rounded-lg p-1">
            {[
              { key: 'learn', icon: BookOpen, label: lang === 'ur' ? 'سیکھیں' : 'Learn' },
              { key: 'review', icon: Brain, label: lang === 'ur' ? 'دہرائیں' : 'Review' },
              { key: 'test', icon: FileQuestion, label: lang === 'ur' ? 'ٹیسٹ' : 'Test' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => changeMode(key as HifzMode)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                  mode === key 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6 text-xs text-muted-foreground">
          <span>{lang === 'ur' ? 'یاد شدہ' : 'Memorized'}: {getMemorizedCount(surahNum)}</span>
          <span>{lang === 'ur' ? 'مکمل یاد' : 'Mastered'}: {getMasteredCount(surahNum)}</span>
        </div>

        {/* Ayah Card */}
        <Card className={cn(
          'overflow-hidden transition-all duration-300',
          lastResult === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
          lastResult === 'wrong' && 'border-red-500 bg-red-50 dark:bg-red-950/20'
        )}>
          <CardContent className="p-6">
            {/* Ayah number */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                {currentAyah?.numberInSurah}
              </span>
            </div>
            
            {/* Ayah text */}
            <div 
              className={cn(
                'font-arabic text-center leading-loose rtl py-4 min-h-[120px] flex items-center justify-center',
                'text-2xl transition-all duration-300'
              )}
              dir="rtl"
            >
              {getVisibleText()}
            </div>

            {/* Reveal button for review/test mode */}
            {mode !== 'learn' && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReveal}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {lang === 'ur' ? 'اور الفاظ' : 'More words'}
                </Button>
              </div>
            )}

            {/* Show/Hide toggle for learn mode */}
            {mode === 'learn' && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowText(prev => !prev)}
                  className="gap-2"
                >
                  {showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showText ? (lang === 'ur' ? 'چھپائیں' : 'Hide') : (lang === 'ur' ? 'دکھائیں' : 'Reveal')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback indicator */}
        {lastResult && (
          <div className={cn(
            'flex items-center justify-center gap-2 mt-4 py-2 rounded-lg text-sm font-medium animate-fade-in',
            lastResult === 'correct' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30'
          )}>
            {lastResult === 'correct' ? (
              <><Check className="h-4 w-4" /> {lang === 'ur' ? 'صحیح!' : 'Correct!'}</>
            ) : (
              <><X className="h-4 w-4" /> {lang === 'ur' ? 'مشق کریں' : 'Needs practice'}</>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1 h-14 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={handleMarkNeedsPractice}
            disabled={lastResult !== null}
          >
            <X className="h-5 w-5" />
            {lang === 'ur' ? 'مشق کریں' : 'Practice'}
          </Button>
          <Button 
            className="flex-1 h-14 gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleMarkMemorized}
            disabled={lastResult !== null}
          >
            <Check className="h-5 w-5" />
            {lang === 'ur' ? 'یاد ہوگیا' : 'Memorized'}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button 
            variant="ghost" 
            onClick={handlePrev}
            disabled={currentAyahIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {lang === 'ur' ? 'پچھلا' : 'Previous'}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentAyahIndex(0)}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            {lang === 'ur' ? 'دوبارہ' : 'Restart'}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleNext}
            disabled={currentAyahIndex === totalAyahs - 1}
            className="gap-1"
          >
            {lang === 'ur' ? 'اگلا' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Session summary */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === 'ur' 
                ? `سیشن میں ${sessionStats.reviewed} آیات دیکھیں، ${sessionStats.correct} صحیح`
                : `Reviewed ${sessionStats.reviewed} ayahs, ${sessionStats.correct} correct`
              }
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default HifzMode;
