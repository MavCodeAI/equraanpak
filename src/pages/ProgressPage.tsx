import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { ReadingProgress } from '@/types/quran';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, BookOpen, CheckCircle2, Circle, Clock, Award, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const streakMilestones = [
  { days: 3, key: 'streakMilestone3' },
  { days: 7, key: 'streakMilestone7' },
  { days: 14, key: 'streakMilestone14' },
  { days: 21, key: 'streakMilestone21' },
  { days: 30, key: 'streakMilestone30' },
];

const ProgressPage = () => {
  const { t, lang } = useLanguage();
  const { todayMinutes, weekMinutes } = useReadingTimer();
  const [progress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1,
    lastReadAyah: 1,
    completedParas: {},
    streak: 0,
    lastReadDate: '',
    totalAyahsRead: 0,
    todayAyahsRead: 0,
    todayDate: '',
  });

  const completedParaCount = Object.values(progress.completedParas).filter(Boolean).length;
  const overallPercent = Math.round((completedParaCount / 30) * 100);
  const achievedMilestones = streakMilestones.filter(m => progress.streak >= m.days);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold text-primary">{t('progress')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('overallProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">{overallPercent}%</span>
            </div>
            <Progress value={overallPercent} className="h-3" />
            <p className="text-sm text-center text-muted-foreground">
              {completedParaCount}/30 {t('para')}
            </p>
          </CardContent>
        </Card>

        {/* Reading Time */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{todayMinutes}</p>
            <p className="text-xs text-muted-foreground">{t('todayReadingTime')}</p>
            <p className="text-[10px] text-muted-foreground">{t('minutes')}</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">{weekMinutes}</p>
            <p className="text-xs text-muted-foreground">{t('weekReadingTime')}</p>
            <p className="text-[10px] text-muted-foreground">{t('minutes')}</p>
          </Card>
        </div>

        {/* Streak + Milestones */}
        <Card className="p-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Flame className="h-8 w-8 text-accent" />
            <div>
              <p className="text-3xl font-bold">{progress.streak}</p>
              <p className="text-sm text-muted-foreground">{t('streakDays')}</p>
            </div>
          </div>
          {achievedMilestones.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {achievedMilestones.map(m => (
                <Badge key={m.days} variant="secondary" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  {t(m.key)}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Ayahs */}
        {progress.todayDate === new Date().toDateString() && progress.todayAyahsRead > 0 && (
          <Card className="p-4 text-center">
            <Award className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{progress.todayAyahsRead}</p>
            <p className="text-xs text-muted-foreground">{t('ayahsRead')}</p>
          </Card>
        )}

        {/* Para Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('paraStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 30 }, (_, i) => {
                const paraNum = i + 1;
                const completed = progress.completedParas[paraNum];
                return (
                  <div
                    key={paraNum}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs ${
                      completed ? 'bg-primary/10 border-primary text-primary' : 'border-border'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{paraNum}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProgressPage;
