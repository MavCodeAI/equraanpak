import { useLanguage } from '@/contexts/LanguageContext';
import { ReadingProgress } from '@/types/quran';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Flame, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface DailyGoalPopupProps {
  open: boolean;
  onClose: () => void;
  progress: ReadingProgress;
  dailyTarget: number;
}

const motivationalMessages = {
  ur: [
    'قرآن دلوں کی بہار ہے 🌿',
    'ہر حرف پر دس نیکیاں ہیں ✨',
    'قرآن آپ کا شفیع ہوگا 📖',
    'تھوڑا اور پڑھ لیں، بہت اجر ملے گا 🤲',
    'سب سے بہتر وہ ہے جو قرآن سیکھے اور سکھائے 📚',
  ],
  en: [
    'The Quran is the spring of hearts 🌿',
    'Every letter earns ten rewards ✨',
    'The Quran will intercede for you 📖',
    'Read a little more, great reward awaits 🤲',
    'The best is the one who learns and teaches Quran 📚',
  ],
};

const streakBadges = [
  { days: 30, emoji: '👑', label: { ur: '30 دن!', en: '30 days!' } },
  { days: 21, emoji: '💎', label: { ur: '21 دن!', en: '21 days!' } },
  { days: 14, emoji: '🏆', label: { ur: '14 دن!', en: '14 days!' } },
  { days: 7, emoji: '⭐', label: { ur: '7 دن!', en: '7 days!' } },
  { days: 3, emoji: '🌟', label: { ur: '3 دن!', en: '3 days!' } },
];

export function DailyGoalPopup({ open, onClose, progress, dailyTarget }: DailyGoalPopupProps) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const messages = motivationalMessages[lang];
  const randomMsg = messages[new Date().getDate() % messages.length];

  const isCompleted = progress.completedParas[dailyTarget];
  const progressPercent = isCompleted ? 100 : 0;
  const currentBadge = streakBadges.find(b => progress.streak >= b.days);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isCompleted ? '🎉' : '📖'} {t('todayGoal')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          {isCompleted ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-primary">{t('mashallah')}</p>
              <div className="flex items-center justify-center gap-2">
                <Flame className="h-5 w-5 text-accent" />
                <span className="font-medium">{progress.streak} {t('streakDays')}</span>
              </div>
              {currentBadge && (
                <Badge className="bg-accent text-accent-foreground text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  {currentBadge.emoji} {currentBadge.label[lang]}
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-arabic rtl">
                {t('dayTarget')} {t('para')} {dailyTarget}
              </p>
              <Progress value={progressPercent} className="h-3" />
              
              {progress.streak > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-accent" />
                  <span>{progress.streak} {t('streakDays')}</span>
                  {currentBadge && <span>{currentBadge.emoji}</span>}
                </div>
              )}

              <p className="text-sm text-muted-foreground italic">{randomMsg}</p>
              <Button
                onClick={() => { onClose(); navigate(`/surah/${progress.lastReadSurah || 1}`); }}
                className="w-full gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {t('continueReading')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
