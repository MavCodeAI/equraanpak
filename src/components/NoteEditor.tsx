import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserNote, NoteColor } from '@/types/quran';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  surahNumber: number;
  ayahNumber?: number;
  note?: UserNote;
  onSave: (content: string, color?: NoteColor) => void;
  onUpdate?: (id: string, content: string, color?: NoteColor) => void;
}

const colors: NoteColor[] = ['yellow', 'green', 'blue', 'pink'];

const colorClasses: Record<NoteColor, { bg: string; border: string; label: string }> = {
  yellow: {
    bg: 'bg-yellow-200 dark:bg-yellow-800',
    border: 'border-yellow-500',
    label: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
  },
  green: {
    bg: 'bg-green-200 dark:bg-green-800',
    border: 'border-green-500',
    label: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  },
  blue: {
    bg: 'bg-blue-200 dark:bg-blue-800',
    border: 'border-blue-500',
    label: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  },
  pink: {
    bg: 'bg-pink-200 dark:bg-pink-800',
    border: 'border-pink-500',
    label: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100',
  },
};

export function NoteEditor({
  isOpen,
  onOpenChange,
  surahNumber,
  ayahNumber,
  note,
  onSave,
  onUpdate,
}: NoteEditorProps) {
  const { t, lang } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor | undefined>(undefined);

  const isEditing = !!note;

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setSelectedColor(note.color);
    } else {
      setContent('');
      setSelectedColor(undefined);
    }
  }, [note, isOpen]);

  const handleSave = () => {
    if (!content.trim()) return;

    if (isEditing && note && onUpdate) {
      onUpdate(note.id, content.trim(), selectedColor);
    } else {
      onSave(content.trim(), selectedColor);
    }

    setContent('');
    setSelectedColor(undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    setContent('');
    setSelectedColor(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editNote') : t('addNote')}
          </DialogTitle>
          {ayahNumber && (
            <p className="text-sm text-muted-foreground">
              {t('surah')} {surahNumber} - {t('ayah')} {ayahNumber}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">{t('noteContent')}</Label>
            <Textarea
              id="note-content"
              placeholder={lang === 'ur' ? 'اپنا نوٹس یہاں لکھیں...' : 'Write your note here...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('selectColor')}
            </Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color === selectedColor ? undefined : color)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all duration-200',
                    colorClasses[color].bg,
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  title={t(color)}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-xs text-muted-foreground">
                {t('selected')}: {t(selectedColor)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            {lang === 'ur' ? 'منسوخ' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            <Save className="h-4 w-4 mr-1" />
            {lang === 'ur' ? 'محفوظ کریں' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
