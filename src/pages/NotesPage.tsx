import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotes } from '@/hooks/useNotes';
import type { UserNote, NoteColor } from '@/types/quran';
import { surahList } from '@/data/surahs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, StickyNote, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NoteEditor } from '@/components/NoteEditor';

const colorBorderMap: Record<NoteColor, string> = {
  yellow: 'border-l-yellow-500',
  green: 'border-l-green-500',
  blue: 'border-l-blue-500',
  pink: 'border-l-pink-500',
};

const NotesPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<UserNote | undefined>(undefined);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSurahForNewNote, setSelectedSurahForNewNote] = useState<number | undefined>(undefined);
  const [selectedAyahForNewNote, setSelectedAyahForNewNote] = useState<number | undefined>(undefined);

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const surah = surahList.find((s) => s.number === note.surahNumber);
    const surahName = lang === 'ur' ? surah?.urduName : surah?.englishName;
    return (
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surahName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.ayahNumber.toString().includes(searchQuery)
    );
  });

  const handleEditNote = useCallback((note: UserNote) => {
    setEditingNote(note);
    setSelectedSurahForNewNote(note.surahNumber);
    setSelectedAyahForNewNote(note.ayahNumber);
    setIsEditorOpen(true);
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    deleteNote(id);
    toast({
      title: t('noteDeleted'),
      duration: 1500,
    });
  }, [deleteNote, t]);

  const handleSaveNote = useCallback((content: string, color?: NoteColor) => {
    if (selectedSurahForNewNote && selectedAyahForNewNote) {
      addNote(selectedSurahForNewNote, selectedAyahForNewNote, content, color);
      toast({
        title: t('noteSaved'),
        duration: 1500,
      });
    }
  }, [addNote, selectedSurahForNewNote, selectedAyahForNewNote, t]);

  const handleUpdateNote = useCallback((id: string, content: string, color?: NoteColor) => {
    updateNote(id, content, color);
    toast({
      title: t('noteSaved'),
      duration: 1500,
    });
    setEditingNote(undefined);
  }, [updateNote, t]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3 space-y-3">
          <h1 className="text-xl font-bold text-primary">{t('allNotes')}</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={lang === 'ur' ? 'نوٹس تلاش کریں...' : 'Search notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery ? (lang === 'ur' ? 'کوئی نتیجہ نہیں' : 'No results found') : t('noNotes')}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="space-y-3 pr-4">
              {filteredNotes
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((note) => {
                  const surah = surahList.find((s) => s.number === note.surahNumber);
                  return (
                    <Card
                      key={note.id}
                      className={cn(
                        'relative overflow-hidden p-4 transition-all hover:shadow-md cursor-pointer',
                        note.color && colorBorderMap[note.color]
                      )}
                    >
                      <div
                        className="flex items-start justify-between gap-3"
                        onClick={() => navigate(`/surah/${note.surahNumber}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {lang === 'ur' ? surah?.urduName : surah?.englishName}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {t('ayah')} {note.ayahNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditNote(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </ScrollArea>
        )}
      </main>

      <NoteEditor
        isOpen={isEditorOpen}
        onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) {
            setEditingNote(undefined);
          }
        }}
        surahNumber={selectedSurahForNewNote || 1}
        ayahNumber={selectedAyahForNewNote}
        note={editingNote}
        onSave={handleSaveNote}
        onUpdate={handleUpdateNote}
      />
    </div>
  );
};

export default NotesPage;
