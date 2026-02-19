import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserNote, NoteColor } from '@/types/quran';
import { surahList } from '@/data/surahs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, StickyNote, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesPanelProps {
  notes: UserNote[];
  surahNumber: number;
  onEditNote: (note: UserNote) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorMap: Record<NoteColor, string> = {
  yellow: 'bg-yellow-200 dark:bg-yellow-800',
  green: 'bg-green-200 dark:bg-green-800',
  blue: 'bg-blue-200 dark:bg-blue-800',
  pink: 'bg-pink-200 dark:bg-pink-800',
};

const colorBorderMap: Record<NoteColor, string> = {
  yellow: 'border-l-yellow-500',
  green: 'border-l-green-500',
  blue: 'border-l-blue-500',
  pink: 'border-l-pink-500',
};

export function NotesPanel({
  notes,
  surahNumber,
  onEditNote,
  onDeleteNote,
  onAddNote,
  isOpen,
  onOpenChange,
}: NotesPanelProps) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const surah = surahList.find((s) => s.number === surahNumber);

  const surahNotes = notes.filter((n) => n.surahNumber === surahNumber);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <StickyNote className="h-5 w-5" />
          {notes.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {notes.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              {t('notesForThisSurah')}
            </SheetTitle>
            <Button size="sm" onClick={onAddNote}>
              <FileText className="h-4 w-4 mr-1" />
              {t('addNote')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === 'ur' ? surah?.urduName : surah?.englishName} ({surahNumber})
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)] pr-4">
          {surahNotes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('noNotesForSurah')}</p>
              <Button variant="outline" size="sm" onClick={onAddNote}>
                <FileText className="h-4 w-4 mr-1" />
                {t('addNote')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {surahNotes
                .sort((a, b) => a.ayahNumber - b.ayahNumber)
                .map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      'relative rounded-lg border bg-card p-3 pl-4 shadow-sm',
                      note.color && colorBorderMap[note.color]
                    )}
                  >
                    {note.color && (
                      <div
                        className={cn(
                          'absolute left-0 top-2 bottom-2 w-1 rounded-full',
                          colorMap[note.color]
                        )}
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {t('ayah')} {note.ayahNumber}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
