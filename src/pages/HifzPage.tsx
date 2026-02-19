import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHifz } from '@/hooks/useHifz';
import { surahList } from '@/data/surahs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, Search, Brain, BookOpen, Target, 
  Trophy, Clock, Play, X, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HifzMode } from '@/types/quran';

type ViewMode = 'dashboard' | 'surah-select' | 'session';

const HifzPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { 
    overallStats, 
    getMemorizedCount, 
    getMasteredCount, 
    getSurahProgress,
    getReviewQueue 
  } = useHifz();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<HifzMode>('learn');

  // Filter surahs based on search
  const filteredSurahs = surahList.filter(surah => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      surah.englishName.toLowerCase().includes(query) ||
      surah.urduName.includes(searchQuery) ||
      surah.englishNameTranslation.toLowerCase().includes(query) ||
      surah.number.toString() === query
    );
  });

  // Get review queue
  const reviewQueue = getReviewQueue();

  // Calculate total ayahs
  const totalAyahs = surahList.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  const progressPercentage = totalAyahs > 0 
    ? Math.round((overallStats.totalMemorized / totalAyahs) * 100) 
    : 0;

  const handleStartSession = (surahNumber: number, mode: HifzMode) => {
    setSelectedSurah(surahNumber);
    setSelectedMode(mode);
    navigate(`/hifz/${surahNumber}?mode=${mode}`);
  };

  // If we're in session mode (navigated from dashboard)
  if (selectedSurah) {
    // This will be handled by the route
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary">
                {lang === 'ur' ? 'حفظ' : 'Hifz'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ur' ? 'قرآن کی تلاوت یاد کریں' : 'Memorize the Quran'}
              </p>
            </div>
            {reviewQueue.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {reviewQueue.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {overallStats.totalMemorized}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {lang === 'ur' ? 'یاد کیے' : 'Memorized'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {overallStats.totalMastered}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {lang === 'ur' ? 'مکمل یاد' : 'Mastered'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {overallStats.reviewCount}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {lang === 'ur' ? 'آج دہرانے' : 'Review today'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {overallStats.totalSessions}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {lang === 'ur' ? 'سیشنز' : 'Sessions'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">
                      {lang === 'ur' ? 'مجموعی پیش رفت' : 'Overall Progress'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary">{progressPercentage}%</p>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {lang === 'ur' 
                    ? `${overallStats.totalMemorized} آیات یاد کیں`
                    : `${overallStats.totalMemorized} ayahs memorized`
                  } • {totalAyahs.toLocaleString()} {lang === 'ur' ? 'کل' : 'total'}
                </p>
              </CardContent>
            </Card>

            {/* Start Session Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => setViewMode('surah-select')}
              >
                <Play className="h-4 w-4" />
                <span className="text-xs">{lang === 'ur' ? 'سیکھیں' : 'Learn'}</span>
              </Button>
              <Button 
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => {
                  if (reviewQueue.length > 0) {
                    handleStartSession(reviewQueue[0].surahNumber, 'review');
                  } else {
                    setViewMode('surah-select');
                  }
                }}
              >
                <Brain className="h-4 w-4" />
                <span className="text-xs">{lang === 'ur' ? 'دہرائیں' : 'Review'}</span>
              </Button>
              <Button 
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => setViewMode('surah-select')}
              >
                <Target className="h-4 w-4" />
                <span className="text-xs">{lang === 'ur' ? 'ٹیسٹ' : 'Test'}</span>
              </Button>
            </div>

            {/* Quick Surah Access */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  {lang === 'ur' ? 'سورتیں' : 'Surahs'}
                </p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {surahList.slice(0, 20).map(surah => {
                    const memorized = getMemorizedCount(surah.number);
                    const mastered = getMasteredCount(surah.number);
                    const percentage = surah.numberOfAyahs > 0 
                      ? Math.round((memorized / surah.numberOfAyahs) * 100) 
                      : 0;
                    
                    return (
                      <button
                        key={surah.number}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => handleStartSession(surah.number, 'learn')}
                      >
                        <span className="w-6 text-center text-xs text-muted-foreground">
                          {surah.number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {lang === 'ur' ? surah.urduName : surah.englishName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Progress value={percentage} className="h-1 flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {memorized}/{surah.numberOfAyahs}
                            </span>
                          </div>
                        </div>
                        {mastered > 0 && (
                          <span className="text-xs text-amber-500">★{mastered}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Surah Selection View */}
        {viewMode === 'surah-select' && (
          <>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setViewMode('dashboard')}>
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </Button>
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={lang === 'ur' ? 'سورت تلاش کریں...' : 'Search surah...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              {filteredSurahs.map(surah => {
                const memorized = getMemorizedCount(surah.number);
                const mastered = getMasteredCount(surah.number);
                const hasProgress = memorized > 0;
                
                return (
                  <button
                    key={surah.number}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleStartSession(surah.number, 'learn')}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {surah.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {lang === 'ur' ? surah.urduName : surah.englishName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {surah.numberOfAyahs} {lang === 'ur' ? 'آیات' : 'ayahs'}
                      </p>
                    </div>
                    {hasProgress && (
                      <div className="text-right">
                        <p className="text-xs text-emerald-600">
                          {lang === 'ur' ? 'یاد' : 'Mem'} {memorized}
                        </p>
                        {mastered > 0 && (
                          <p className="text-xs text-amber-600">
                            ★{mastered}
                          </p>
                        )}
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default HifzPage;
