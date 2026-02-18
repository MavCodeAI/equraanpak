import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KhatamSchedule } from '@/types/quran';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, CalendarDays } from 'lucide-react';

const presets = [20, 25, 30];

const SchedulePage = () => {
  const { t, lang } = useLanguage();
  const [schedule, setSchedule] = useLocalStorage<KhatamSchedule | null>('quran-schedule', null);
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const createSchedule = () => {
    setSchedule({
      totalDays: days,
      startDate,
      completedDays: {},
      pagesPerDay: Math.ceil(604 / days),
    });
  };

  const toggleDay = (dayIndex: number) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      completedDays: {
        ...schedule.completedDays,
        [dayIndex]: !schedule.completedDays[dayIndex],
      },
    });
  };

  const resetSchedule = () => setSchedule(null);

  if (!schedule) {
    return (
      <div className="min-h-screen pb-20">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
          <div className="mx-auto max-w-lg px-4 py-3">
            <h1 className="text-xl font-bold text-primary">{t('schedule')}</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('scheduleSetup')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('totalDays')}</Label>
                <div className="flex gap-2">
                  {presets.map((p) => (
                    <Button
                      key={p}
                      variant={days === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDays(p)}
                    >
                      {p} {t('days')}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="shrink-0">{t('customDays')}:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('startDate')}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-secondary/50 p-3 text-sm text-center">
                <p>{lang === 'ur' ? `روزانہ ${Math.ceil(604 / days)} صفحات پڑھیں` : `Read ${Math.ceil(604 / days)} pages daily`}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'ur' ? `(تقریباً ${(Math.ceil(604 / days) / 20).toFixed(1)} پارہ روزانہ)` : `(≈ ${(Math.ceil(604 / days) / 20).toFixed(1)} juz per day)`}
                </p>
              </div>

              <Button onClick={createSchedule} className="w-full">
                <CalendarDays className="h-4 w-4 mr-2" />
                {t('startSchedule')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const completedCount = Object.values(schedule.completedDays).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / schedule.totalDays) * 100);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-primary">{t('schedule')}</h1>
          <Button variant="ghost" size="sm" onClick={resetSchedule} className="text-xs text-destructive">
            {lang === 'ur' ? 'ری سیٹ' : 'Reset'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <Card className="p-4 text-center space-y-2">
          <p className="text-3xl font-bold text-primary">{progressPercent}%</p>
          <p className="text-sm text-muted-foreground">
            {completedCount} / {schedule.totalDays} {t('days')}
          </p>
        </Card>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: schedule.totalDays }, (_, i) => {
            const completed = schedule.completedDays[i];
            const dayDate = new Date(schedule.startDate);
            dayDate.setDate(dayDate.getDate() + i);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const isPast = dayDate < new Date() && !isToday;

            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors text-xs ${
                  completed
                    ? 'bg-primary/10 border-primary text-primary'
                    : isToday
                    ? 'border-accent bg-accent/10'
                    : isPast && !completed
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border'
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>{i + 1}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SchedulePage;
