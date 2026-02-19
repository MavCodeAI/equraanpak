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
  onPlaySurah: () => void;
  onStop: () => void;
  onTogglePlayPause: () => void;
  onSeek?: (time: number) => void;
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
  onPlaySurah,
  onStop,
  onTogglePlayPause,
  onSeek,
  compact = false,
}: AudioPlayerProps) => {
  const { lang } = useLanguage();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isPlaying || currentAyah ? (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTogglePlayPause} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStop}>
              <Square className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlaySurah} title={lang === 'ur' ? 'سنیں' : 'Play'}>
            <Volume2 className="h-4 w-4 text-primary" />
          </Button>
        )}
      </div>
    );
  }

  // Full player (no active playback)
  if (!isPlaying && !currentAyah) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlaySurah} title={lang === 'ur' ? 'سنیں' : 'Play'}>
          <Volume2 className="h-4 w-4 text-primary" />
        </Button>
      </div>
    );
  }

  // Full player with progress bar
  return (
    <div className="flex flex-col w-full gap-1">
      <div className="flex items-center gap-2">
        {/* Controls */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTogglePlayPause} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 text-primary" />
            ) : (
              <Play className="h-4 w-4 text-primary" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStop}>
            <Square className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono min-w-[32px] text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative overflow-hidden"
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
          <span className="text-[10px] text-muted-foreground font-mono min-w-[32px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Ayah badge */}
        {currentAyah && (
          <span className="text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5 font-sans whitespace-nowrap">
            {lang === 'ur' ? `آیت ${currentAyah}` : `${currentAyah}`}
          </span>
        )}
      </div>
    </div>
  );
};
