import { useLanguage } from '@/contexts/LanguageContext';
import { useHifz } from '@/hooks/useHifz';
import { surahList } from '@/data/surahs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Brain, Target, Trophy, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HifzDashboardProps {
  onStartSession: (surahNumber: number, mode: 'learn' | 'review' | 'test') => void;
  onNavigateToHifz: () => void;
}

export function HifzDashboard({ onStartSession, onNavigateToHifz }: HifzDashboardProps) {
  const { t, lang } = useLanguage();
  const { overallStats, getMemorizedCount, getMasteredCount, getReviewQueue } = useHifz();

  // Calculate total ayahs in Quran
  const totalAyahs = surahList.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  const progressPercentage = totalAyahs > 0 
    ? Math.round((overallStats.totalMemorized / totalAyahs) * 100) 
    : 0;

  // Get top surahs with most memorization
  const surahProgressList = surahList.map(surah => ({
    surah,
    memorized: getMemorizedCount(surah.number),
    mastered: getMasteredCount(surah.number),
  })).filter(s => s.memorized > 0)
    .sort((a, b) => b.memorized - a.memorized)
    .slice(0, 5);

  return (
    <div className="space-y-4">
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
                  {lang === 'ur' ? 'آج دہرانے ہیں' : 'Review today'}
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
              : `${overallStats.totalMemorized} ayahs memorized`}
          </p>
        </CardContent>
      </Card>

      {/* Top Surahs */}
      {surahProgressList.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">
              {lang === 'ur' ? 'بہترین سورتیں' : 'Top Surahs'}
            </p>
            <div className="space-y-2">
              {surahProgressList.map(({ surah, memorized, mastered }) => {
                const percentage = surah.numberOfAyahs > 0 
                  ? Math.round((memorized / surah.numberOfAyahs) * 100) 
                  : 0;
                return (
                  <button
                    key={surah.number}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    onClick={() => onStartSession(surah.number, 'review')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lang === 'ur' ? surah.urduName : surah.englishName}
                      </p>
                      <Progress value={percentage} className="h-1.5 mt-1" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {memorized}/{surah.numberOfAyahs}
                      </p>
                      {mastered > 0 && (
                        <p className="text-xs text-amber-600">
                          ★ {mastered}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={onNavigateToHifz}
        >
          <BookOpen className="h-4 w-4" />
          {lang === 'ur' ? 'مکمل ڈیش بورڈ' : 'Full Dashboard'}
        </Button>
        {overallStats.reviewCount > 0 && (
          <Button 
            className="flex-1 gap-2"
            onClick={() => {
              const queue = getReviewQueue();
              if (queue.length > 0) {
                onStartSession(queue[0].surahNumber, 'review');
              }
            }}
          >
            <Target className="h-4 w-4" />
            {lang === 'ur' ? 'دہرانے شروع کریں' : 'Start Review'}
          </Button>
        )}
      </div>
    </div>
  );
}
