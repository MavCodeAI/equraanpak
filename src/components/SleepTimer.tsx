import { useState } from 'react';
import { Moon, X, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SleepTimerProps {
  sleepTimerRemaining: number | null;
  onSetTimer: (minutes: number) => void;
  onClearTimer: () => void;
}

const TIMER_OPTIONS = [
  { value: 5, labelUr: '5 منٹ', labelEn: '5 min' },
  { value: 10, labelUr: '10 منٹ', labelEn: '10 min' },
  { value: 15, labelUr: '15 منٹ', labelEn: '15 min' },
  { value: 30, labelUr: '30 منٹ', labelEn: '30 min' },
  { value: 45, labelUr: '45 منٹ', labelEn: '45 min' },
  { value: 60, labelUr: '60 منٹ', labelEn: '60 min' },
];

export const SleepTimer = ({
  sleepTimerRemaining,
  onSetTimer,
  onClearTimer,
}: SleepTimerProps) => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTimer = (minutes: number) => {
    onSetTimer(minutes);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9',
            sleepTimerRemaining !== null && 'text-primary'
          )}
          title={lang === 'ur' ? 'سویٹائمر' : 'Sleep Timer'}
        >
          {sleepTimerRemaining !== null ? (
            <span className="text-xs font-mono font-bold">
              {formatRemaining(sleepTimerRemaining)}
            </span>
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {lang === 'ur' ? 'سویٹائمر' : 'Sleep Timer'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {sleepTimerRemaining !== null && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {lang === 'ur' ? 'باقی وقت:' : 'Time remaining:'}
                </span>
                <span className="text-lg font-bold font-mono text-primary">
                  {formatRemaining(sleepTimerRemaining)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearTimer}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {TIMER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="h-12"
                onClick={() => handleSetTimer(option.value)}
              >
                {lang === 'ur' ? option.labelUr : option.labelEn}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {lang === 'ur'
              ? 'آڈیو خودکار طور پر بند ہو جائے گا۔'
              : 'Audio will stop automatically when timer ends.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
