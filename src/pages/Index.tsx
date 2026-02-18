import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Globe, FileText } from 'lucide-react';
import { surahList } from '@/data/surahs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReadingProgress, KhatamSchedule } from '@/types/quran';
import { DailyGoalPopup } from '@/components/DailyGoalPopup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showGoal, setShowGoal] = useState(false);

  const [progress] = useLocalStorage<ReadingProgress>('quran-progress', {
    lastReadSurah: 1,
    lastReadAyah: 1,
    completedParas: {},
    streak: 0,
    lastReadDate: '',
    totalAyahsRead: 0,
  });

  const [schedule] = useLocalStorage<KhatamSchedule | null>('quran-schedule', null);

  // Show daily goal popup on first visit
  useEffect(() => {
    if (schedule) {
      const today = new Date().toDateString();
      const shown = sessionStorage.getItem('goal-shown');
      if (shown !== today) {
        setShowGoal(true);
        sessionStorage.setItem('goal-shown', today);
      }
    }
  }, [schedule]);

  const dailyTarget = useMemo(() => {
    if (!schedule) return 1;
    const start = new Date(schedule.startDate);
    const now = new Date();
    const dayIndex = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(dayIndex + 1, 30);
  }, [schedule]);

  const filtered = useMemo(() => {
    if (!search.trim()) return surahList;
    const q = search.toLowerCase();
    return surahList.filter(
      (s) =>
        s.name.includes(search) ||
        s.englishName.toLowerCase().includes(q) ||
        s.urduName.includes(search) ||
        s.number.toString() === q
    );
  }, [search]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold font-arabic text-primary">{t('appName')}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            className="gap-1.5"
          >
            <Globe className="h-4 w-4" />
            {lang === 'ur' ? 'EN' : 'اردو'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Welcome */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-arabic font-bold rtl">{t('welcome')}</h2>
          <p className="text-sm text-muted-foreground">{t('welcomeMsg')}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {progress.lastReadSurah > 0 && (
            <Button
              onClick={() => navigate(`/surah/${progress.lastReadSurah}`)}
              className="w-full gap-2"
              size="lg"
            >
              <BookOpen className="h-5 w-5" />
              {t('continueReading')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/page-reading')}
            className="w-full gap-2"
            size="lg"
          >
            <FileText className="h-5 w-5" />
            {t('pageReading')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Surah List */}
        <div className="space-y-2">
          {filtered.map((surah) => (
            <Card
              key={surah.number}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate(`/surah/${surah.number}`)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {surah.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {lang === 'ur' ? surah.urduName : surah.englishName}
                  </span>
                  <span className="text-lg font-arabic font-bold rtl text-primary shrink-0">
                    {surah.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{surah.numberOfAyahs} {t('ayahs')}</span>
                  <span>•</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {t(surah.revelationType.toLowerCase())}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Daily Goal Popup */}
      <DailyGoalPopup
        open={showGoal}
        onClose={() => setShowGoal(false)}
        progress={progress}
        dailyTarget={dailyTarget}
      />
    </div>
  );
};

export default Index;
