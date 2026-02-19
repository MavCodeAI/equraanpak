import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Globe, FileText, Flame, Award, Clock, LogIn, User, Sparkles } from 'lucide-react';
import { surahList } from '@/data/surahs';
import { juzList } from '@/data/juzData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReadingProgress, KhatamSchedule } from '@/types/quran';
import { useUser } from '@/contexts/UserContext';
import { DailyGoalPopup } from '@/components/DailyGoalPopup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Debounce hook for search input
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Simple virtualization hook for fixed-height items
const useVirtualList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return {
    containerRef,
    handleScroll,
    visibleItems,
    totalHeight,
    startIndex,
    offsetY,
  };
};

// Memoized Surah Card Component
interface SurahCardProps {
  surah: typeof surahList[0];
  lang: 'en' | 'ur';
  t: (key: string) => string;
  onClick: () => void;
  index: number;
}

const SurahCard = memo(({ surah, lang, t, onClick, index }: SurahCardProps) => (
  <Card
    className="flex items-center gap-3 p-3.5 cursor-pointer card-hover animate-fade-in border-border/40 will-change-transform"
    style={{ animationDelay: `${Math.min(index * 20, 150)}ms`, animationFillMode: 'both' }}
    onClick={onClick}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary font-bold text-sm shrink-0">
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
        <span>{surah.numberOfAyahs} {t('ayahs')}</span>
        <span className="opacity-30">•</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
          {t(surah.revelationType.toLowerCase())}
        </Badge>
      </div>
    </div>
  </Card>
));

SurahCard.displayName = 'SurahCard';

// Memoized Juz Card Component
interface JuzCardProps {
  juz: typeof juzList[0];
  lang: 'en' | 'ur';
  t: (key: string) => string;
  onClick: () => void;
  index: number;
  completedParas: Record<number, boolean>;
}

const JuzCard = memo(({ juz, lang, t, onClick, index, completedParas }: JuzCardProps) => (
  <Card
    className="flex items-center gap-3 p-3.5 cursor-pointer card-hover animate-fade-in border-border/40 will-change-transform"
    style={{ animationDelay: `${Math.min(index * 20, 150)}ms`, animationFillMode: 'both' }}
    onClick={onClick}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary font-bold text-sm shrink-0">
      {juz.number}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">
          {t('para')} {juz.number}
        </span>
        <span className="text-lg font-arabic font-bold rtl text-primary shrink-0">
          {juz.name}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {t('page')} {juz.startPage}
        {completedParas[juz.number] && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-2 rounded-md">✅ {t('completed')}</Badge>
        )}
      </div>
    </div>
  </Card>
));

JuzCard.displayName = 'JuzCard';

const streakBadges = [
  { days: 30, emoji: '👑', color: 'bg-accent text-accent-foreground' },
  { days: 21, emoji: '💎', color: 'bg-primary text-primary-foreground' },
  { days: 14, emoji: '🏆', color: 'bg-primary text-primary-foreground' },
  { days: 7, emoji: '⭐', color: 'bg-secondary text-secondary-foreground' },
  { days: 3, emoji: '🌟', color: 'bg-secondary text-secondary-foreground' },
];

const dailyQuotes = {
  ur: [
    'بے شک قرآن کی تلاوت کرنے والوں کے لیے بہت بڑا اجر ہے',
    'قرآن تمہارے حق میں حجت ہوگا یا تمہارے خلاف',
    'سب سے بہتر وہ ہے جو قرآن سیکھے اور سکھائے',
    'ہر حرف پر دس نیکیاں لکھی جاتی ہیں',
    'قرآن پڑھو، یہ قیامت کے دن شفاعت کرے گا',
  ],
  en: [
    'Indeed those who recite the Quran have a great reward',
    'The Quran will be a proof for you or against you',
    'The best among you is the one who learns Quran and teaches it',
    'Every letter earns ten good deeds',
    'Read the Quran, it will intercede on the Day of Judgment',
  ],
};

const Index = () => {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [showGoal, setShowGoal] = useState(false);

  // Debounce search input with 300ms delay
  const debouncedSearch = useDebounce(search, 300);

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

  const [schedule] = useLocalStorage<KhatamSchedule | null>('quran-schedule', null);

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

  const currentStreak = progress.streak;
  const currentBadge = streakBadges.find(b => currentStreak >= b.days);
  const todayQuote = dailyQuotes[lang][new Date().getDate() % dailyQuotes[lang].length];
  const lastSurah = useMemo(() => surahList.find(s => s.number === progress.lastReadSurah), [progress.lastReadSurah]);

  // Memoized filtered list - uses debounced search to prevent filtering on every keystroke
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return surahList;
    const q = debouncedSearch.toLowerCase().trim();
    const paraMatch = q.match(/^(?:پارہ|para|juz)\s*(\d+)$/i);
    if (paraMatch) {
      const paraNum = parseInt(paraMatch[1]);
      const juz = juzList.find(j => j.number === paraNum);
      if (juz) return surahList.filter(s => s.number === juz.startSurah);
    }
    return surahList.filter(
      (s) =>
        s.name.includes(debouncedSearch) ||
        s.englishName.toLowerCase().includes(q) ||
        s.urduName.includes(debouncedSearch) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }, [debouncedSearch]);

  // Memoized click handlers
  const handleSurahClick = useCallback((surahNumber: number) => {
    navigate(`/surah/${surahNumber}`);
  }, [navigate]);

  const handleJuzClick = useCallback((startPage: number) => {
    navigate(`/page-reading?page=${startPage}`);
  }, [navigate]);

  const handleLanguageToggle = useCallback(() => {
    setLang(lang === 'ur' ? 'en' : 'ur');
  }, [lang, setLang]);

  const handleLoginClick = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleContinueReading = useCallback(() => {
    navigate(`/surah/${progress.lastReadSurah}`);
  }, [navigate, progress.lastReadSurah]);

  const handlePageReading = useCallback(() => {
    navigate('/page-reading');
  }, [navigate]);

  // Virtualized surah list - fixed height container with overscan
  const SURAH_ITEM_HEIGHT = 88; // approximate height of each card in pixels
  const SURAH_CONTAINER_HEIGHT = 500; // viewport height for virtual scrolling
  const surahVirtual = useVirtualList(filtered, SURAH_ITEM_HEIGHT, SURAH_CONTAINER_HEIGHT, 3);

  // Virtualized juz list
  const JUZ_ITEM_HEIGHT = 88;
  const JUZ_CONTAINER_HEIGHT = 500;
  const juzVirtual = useVirtualList(juzList, JUZ_ITEM_HEIGHT, JUZ_CONTAINER_HEIGHT, 3);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-arabic text-primary">{t('appName')}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLanguageToggle}
            className="gap-1.5 rounded-full"
          >
            <Globe className="h-4 w-4" />
            {lang === 'ur' ? 'EN' : 'اردو'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5 space-y-5">
        {/* Welcome */}
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-2xl font-arabic font-bold rtl">
            {user 
              ? (lang === 'ur' ? `السلام علیکم، ${user.name}` : `Assalamu Alaikum, ${user.name}`)
              : t('welcome')
            }
          </h2>
          <p className="text-sm text-muted-foreground italic leading-relaxed">{todayQuote}</p>
        </div>

        {/* Login Prompt */}
        {!user && (
          <Card 
            className="p-3.5 flex items-center gap-3 cursor-pointer card-hover border-dashed animate-fade-in"
            onClick={handleLoginClick}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LogIn className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {lang === 'ur' ? 'لاگ ان کریں' : 'Login'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ur' ? 'اپنا ڈیٹا محفوظ رکھیں ☁️' : 'Keep your data safe ☁️'}
              </p>
            </div>
          </Card>
        )}

        {/* Logged in user badge */}
        {user && (
          <Card className="p-2.5 flex items-center justify-center gap-2 text-sm glass-card animate-fade-in">
            <User className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {lang === 'ur' ? 'ڈیٹا کلاؤڈ میں محفوظ ہے' : 'Data saved to cloud'}
            </span>
            <span className="text-primary">☁️</span>
          </Card>
        )}

        {/* Streak Badge */}
        {currentStreak > 0 && (
          <Card className="p-4 flex items-center justify-center gap-4 glass-card animate-slide-up overflow-hidden relative">
            <div className="absolute inset-0 bg-accent/5 rounded-lg" />
            <div className="relative flex items-center gap-3">
              <Flame className="h-7 w-7 text-accent animate-glow-pulse" />
              <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">{t('streakDays')}</span>
              {currentBadge && (
                <Badge className={`${currentBadge.color} text-sm px-2.5`}>
                  {currentBadge.emoji}
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Today's Progress */}
        {progress.todayDate === new Date().toDateString() && progress.todayAyahsRead > 0 && (
          <Card className="p-4 space-y-3 glass-card animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                {t('todayRead')}
              </span>
              <span className="text-primary font-bold text-lg">{progress.todayAyahsRead} <span className="text-xs font-normal text-muted-foreground">{t('ayahs')}</span></span>
            </div>
            {schedule && (
              <Progress value={Math.min(100, (progress.todayAyahsRead / 20) * 100)} className="h-2.5" />
            )}
          </Card>
        )}

        {/* Continue Reading */}
        <div className="space-y-2.5 animate-slide-up">
          {progress.lastReadSurah > 0 && lastSurah && (
            <Button
              onClick={handleContinueReading}
              className="w-full gap-3 h-auto py-4 rounded-xl gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow duration-300"
              size="lg"
            >
              <BookOpen className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{t('continueReading')}</span>
                <span className="text-xs opacity-85">
                  {t('surah')} {lastSurah.name} - {t('ayah')} {progress.lastReadAyah}
                </span>
              </div>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePageReading}
            className="w-full gap-2 rounded-xl card-hover"
            size="lg"
          >
            <FileText className="h-5 w-5" />
            {t('pageReading')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-card border-border/50 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="surahs">
          <TabsList className="w-full rounded-xl p-1 bg-secondary/60">
            <TabsTrigger value="surahs" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all">{t('surahs')}</TabsTrigger>
            <TabsTrigger value="juz" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all">{t('juzIndex')}</TabsTrigger>
          </TabsList>

          <TabsContent value="surahs" className="mt-3">
            {/* Virtualized Surah List */}
            <div 
              ref={surahVirtual.containerRef}
              onScroll={surahVirtual.handleScroll}
              className="space-y-2 overflow-y-auto"
              style={{ height: SURAH_CONTAINER_HEIGHT }}
            >
              <div style={{ height: surahVirtual.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${surahVirtual.offsetY}px)` }}>
                  {surahVirtual.visibleItems.map((surah, idx) => (
                    <SurahCard
                      key={surah.number}
                      surah={surah}
                      lang={lang}
                      t={t}
                      onClick={() => handleSurahClick(surah.number)}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="juz" className="mt-3">
            {/* Virtualized Juz List */}
            <div 
              ref={juzVirtual.containerRef}
              onScroll={juzVirtual.handleScroll}
              className="space-y-2 overflow-y-auto"
              style={{ height: JUZ_CONTAINER_HEIGHT }}
            >
              <div style={{ height: juzVirtual.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${juzVirtual.offsetY}px)` }}>
                  {juzVirtual.visibleItems.map((juz, idx) => (
                    <JuzCard
                      key={juz.number}
                      juz={juz}
                      lang={lang}
                      t={t}
                      onClick={() => handleJuzClick(juz.startPage)}
                      index={idx}
                      completedParas={progress.completedParas}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

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
