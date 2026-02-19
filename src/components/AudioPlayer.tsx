import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentAyah: number | null;
  onPlaySurah: () => void;
  onStop: () => void;
  onTogglePlayPause: () => void;
}

export const AudioPlayer = ({
  isPlaying,
  isLoading,
  currentAyah,
  onPlaySurah,
  onStop,
  onTogglePlayPause,
}: AudioPlayerProps) => {
  const { lang } = useLanguage();

  return (
    <div className="flex items-center gap-1.5">
      {isPlaying || currentAyah ? (
        <>
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
          {currentAyah && (
            <span className="text-[10px] text-muted-foreground font-sans">
              {lang === 'ur' ? `آیت ${currentAyah}` : `Ayah ${currentAyah}`}
            </span>
          )}
        </>
      ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlaySurah} title={lang === 'ur' ? 'سنیں' : 'Play'}>
          <Volume2 className="h-4 w-4 text-primary" />
        </Button>
      )}
    </div>
  );
};
