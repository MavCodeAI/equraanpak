import { useState, useMemo, useEffect } from 'react';
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
  const lastSurah = surahList.find(s => s.number === progress.lastReadSurah);

  const filtered = useMemo(() => {
    if (!search.trim()) return surahList;
    const q = search.toLowerCase().trim();
    const paraMatch = q.match(/^(?:پارہ|para|juz)\s*(\d+)$/i);
    if (paraMatch) {
      const paraNum = parseInt(paraMatch[1]);
      const juz = juzList.find(j => j.number === paraNum);
      if (juz) return surahList.filter(s => s.number === juz.startSurah);
    }
    return surahList.filter(
      (s) =>
        s.name.includes(search) ||
        s.englishName.toLowerCase().includes(q) ||
        s.urduName.includes(search) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }, [search]);

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
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
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
            onClick={() => navigate('/login')}
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
              onClick={() => navigate(`/surah/${progress.lastReadSurah}`)}
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
            onClick={() => navigate('/page-reading')}
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
            <div className="space-y-2">
              {filtered.map((surah, i) => (
                <Card
                  key={surah.number}
                  className="flex items-center gap-3 p-3.5 cursor-pointer card-hover animate-fade-in border-border/40"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
                  onClick={() => navigate(`/surah/${surah.number}`)}
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="juz" className="mt-3">
            <div className="space-y-2">
              {juzList.map((juz, i) => (
                <Card
                  key={juz.number}
                  className="flex items-center gap-3 p-3.5 cursor-pointer card-hover animate-fade-in border-border/40"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
                  onClick={() => navigate(`/page-reading?page=${juz.startPage}`)}
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
                      {progress.completedParas[juz.number] && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-2 rounded-md">✅ {t('completed')}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
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
