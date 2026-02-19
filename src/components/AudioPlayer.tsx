import { Play, Pause, Square, Volume2, Loader2, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
  compact = false,
}: AudioPlayerProps) => {
  const { lang } = useLanguage();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
      </div>
    );
  }

  // Full player with progress bar + skip controls
  return (
    <div className="flex flex-col w-full gap-1.5">
      {/* Controls row */}
      <div className="flex items-center justify-center gap-1">
        {onSkipPrev && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipPrev}>
            <SkipBack className="h-3.5 w-3.5 text-foreground" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onTogglePlayPause} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Play className="h-5 w-5 text-primary" />
          )}
        </Button>
        {onSkipNext && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipNext}>
            <SkipForward className="h-3.5 w-3.5 text-foreground" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStop}>
          <Square className="h-3 w-3 text-destructive" />
        </Button>
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
