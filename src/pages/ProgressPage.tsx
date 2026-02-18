import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReadingProgress } from '@/types/quran';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, BookOpen, CheckCircle2, Circle } from 'lucide-react';

const ProgressPage = () => {
  const { t, lang } = useLanguage();
  const [progress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1,
    lastReadAyah: 1,
    completedParas: {},
    streak: 0,
    lastReadDate: '',
    totalAyahsRead: 0,
  });

  const completedParaCount = Object.values(progress.completedParas).filter(Boolean).length;
  const overallPercent = Math.round((completedParaCount / 30) * 100);

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

        {/* Streak */}
        <Card className="p-4">
          <div className="flex items-center justify-center gap-3">
            <Flame className="h-8 w-8 text-accent" />
            <div>
              <p className="text-3xl font-bold">{progress.streak}</p>
              <p className="text-sm text-muted-foreground">{t('streakDays')}</p>
            </div>
          </div>
        </Card>

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
