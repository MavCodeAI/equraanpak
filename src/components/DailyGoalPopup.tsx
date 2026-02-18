import { useLanguage } from '@/contexts/LanguageContext';
import { ReadingProgress } from '@/types/quran';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyGoalPopupProps {
  open: boolean;
  onClose: () => void;
  progress: ReadingProgress;
  dailyTarget: number; // para number to read today
}

const motivationalMessages = {
  ur: [
    'قرآن دلوں کی بہار ہے 🌿',
    'ہر حرف پر دس نیکیاں ہیں ✨',
    'قرآن آپ کا شفیع ہوگا 📖',
    'تھوڑا اور پڑھ لیں، بہت اجر ملے گا 🤲',
  ],
  en: [
    'The Quran is the spring of hearts 🌿',
    'Every letter earns ten rewards ✨',
    'The Quran will intercede for you 📖',
    'Read a little more, great reward awaits 🤲',
  ],
};

export function DailyGoalPopup({ open, onClose, progress, dailyTarget }: DailyGoalPopupProps) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const messages = motivationalMessages[lang];
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];

  const isCompleted = progress.completedParas[dailyTarget];
  const progressPercent = isCompleted ? 100 : 0;

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
              <div className="flex items-center justify-center gap-2 text-accent-foreground">
                <Flame className="h-5 w-5 text-accent" />
                <span className="font-medium">{progress.streak} {t('streakDays')}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-arabic rtl">
                {t('dayTarget')} {t('para')} {dailyTarget}
              </p>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground italic">{randomMsg}</p>
              <Button
                onClick={() => { onClose(); navigate('/surah/1'); }}
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
