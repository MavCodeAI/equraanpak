import { Play, Pause, Square, Volume2, Loader2, SkipBack, SkipForward, Repeat, Repeat1, Gauge, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import type { AudioSpeed, RepeatMode } from '@/types/quran';
import { SleepTimer } from './SleepTimer';

interface AudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentAyah: number | null;
  currentTime?: number;
  duration?: number;
  totalAyahs?: number;
  onPlaySurah: () => void;
  onStop: () => void;
  onTogglePlayPause: () => void;
  onSeek?: (time: number) => void;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
  onSpeedChange?: (speed: AudioSpeed) => void;
  onRepeatChange?: (mode: RepeatMode) => void;
  onSetSleepTimer?: (minutes: number) => void;
  onClearSleepTimer?: () => void;
  sleepTimerRemaining?: number | null;
  compact?: boolean;
}

const formatTime = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({
  isPlaying,
  isLoading,
  currentAyah,
  currentTime = 0,
  duration = 0,
  totalAyahs,
  onPlaySurah,
  onStop,
  onTogglePlayPause,
  onSeek,
  onSkipNext,
  onSkipPrev,
  onSpeedChange,
  onRepeatChange,
  onSetSleepTimer,
  onClearSleepTimer,
  sleepTimerRemaining,
  compact = false,
}: AudioPlayerProps) => {
  const { lang } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const audioSpeed = settings.audioSpeed || 1;
  const repeatMode = settings.repeatMode || 'none';

  const speedOptions: { value: AudioSpeed; label: string }[] = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
  ];

  const repeatOptions: { value: RepeatMode; icon: React.ReactNode; label: string }[] = [
    { value: 'none', icon: <Repeat className="h-3.5 w-3.5" />, label: lang === 'ur' ? 'دہرانے والا نہیں' : 'No Repeat' },
    { value: 'ayah', icon: <Repeat1 className="h-3.5 w-3.5" />, label: lang === 'ur' ? 'آیت دہرائیں' : 'Repeat Ayah' },
    { value: 'surah', icon: <Repeat className="h-3.5 w-3.5" />, label: lang === 'ur' ? 'سورت دہرائیں' : 'Repeat Surah' },
  ];

  const handleSpeedChange = (speed: AudioSpeed) => {
    updateSettings({ audioSpeed: speed });
    onSpeedChange?.(speed);
  };

  const handleRepeatChange = (mode: RepeatMode) => {
    updateSettings({ repeatMode: mode });
    onRepeatChange?.(mode);
  };

  // Compact mode for header
  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {isPlaying || currentAyah ? (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTogglePlayPause} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStop}>
              <Square className="h-3 w-3 text-destructive" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlaySurah} title={lang === 'ur' ? 'پوری سورت سنیں' : 'Play All'}>
            <Volume2 className="h-4 w-4 text-primary" />
          </Button>
        )}
        {sleepTimerRemaining !== undefined && (
          <SleepTimer
            sleepTimerRemaining={sleepTimerRemaining}
            onSetTimer={onSetSleepTimer || (() => {})}
            onClearTimer={onClearSleepTimer || (() => {})}
          />
        )}
      </div>
    );
  }

  // Full player — no active playback: show a prominent play button
  if (!isPlaying && !currentAyah) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlaySurah} title={lang === 'ur' ? 'پوری سورت سنیں' : 'Play All'}>
          <Volume2 className="h-4 w-4 text-primary" />
        </Button>
        {/* Speed Control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" title={lang === 'ur' ? 'آڈیو رفتار' : 'Playback Speed'}>
              <Gauge className="h-4 w-4" />
              <span className="sr-only">{lang === 'ur' ? 'رفتار' : 'Speed'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2" align="start">
            <div className="grid gap-1">
              {speedOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={audioSpeed === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => handleSpeedChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {/* Sleep Timer */}
        <SleepTimer
          sleepTimerRemaining={sleepTimerRemaining ?? null}
          onSetTimer={onSetSleepTimer || (() => {})}
          onClearTimer={onClearSleepTimer || (() => {})}
        />
      </div>
    );
  }

  // Full player with progress bar + skip controls
  return (
    <div className="flex flex-col w-full gap-1.5">
      {/* Controls row */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {onSkipPrev && (
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={onSkipPrev} aria-label="Skip to previous ayah">
            <SkipBack className="h-4 w-4 text-foreground" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-12 w-12" onClick={onTogglePlayPause} disabled={isLoading} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6 text-primary" />
          ) : (
            <Play className="h-6 w-6 text-primary" />
          )}
        </Button>
        {onSkipNext && (
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={onSkipNext} aria-label="Skip to next ayah">
            <SkipForward className="h-4 w-4 text-foreground" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onStop} aria-label="Stop playback">
          <Square className="h-3.5 w-3.5 text-destructive" />
        </Button>
        {/* Repeat Mode Toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-10 w-10', repeatMode !== 'none' && 'text-primary')}
              title={lang === 'ur' ? 'دہرانے کا طریقہ' : 'Repeat Mode'}
            >
              {repeatMode === 'ayah' ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="grid gap-1">
              {repeatOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={repeatMode === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => handleRepeatChange(option.value)}
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {/* Speed Control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10" title={lang === 'ur' ? 'آڈیو رفتار' : 'Playback Speed'}>
              <Gauge className="h-4 w-4" />
              <span className="sr-only">{lang === 'ur' ? 'رفتار' : 'Speed'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2" align="start">
            <div className="grid gap-1">
              {speedOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={audioSpeed === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => handleSpeedChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {/* Sleep Timer */}
        <SleepTimer
          sleepTimerRemaining={sleepTimerRemaining ?? null}
          onSetTimer={onSetSleepTimer || (() => {})}
          onClearTimer={onClearSleepTimer || (() => {})}
        />
        {/* Ayah badge */}
        {currentAyah && (
          <span className="text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5 font-sans whitespace-nowrap ml-1">
            {lang === 'ur' ? `آیت ${currentAyah}` : `Ayah ${currentAyah}`}
            {totalAyahs ? ` / ${totalAyahs}` : ''}
          </span>
        )}
      </div>

      {/* Progress bar row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono min-w-[30px] text-right">
          {formatTime(currentTime)}
        </span>
        <div
          className="flex-1 h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden active:scale-y-150 transition-transform"
          onClick={(e) => {
            if (!onSeek || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            onSeek(pct * duration);
          }}
          role="slider"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Audio progress"
          tabIndex={0}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono min-w-[30px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
