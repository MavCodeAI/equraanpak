import { useState, useCallback, useMemo } from 'react';
import type { UserNote, Highlight, NoteColor } from '@/types/quran';

const NOTES_KEY = 'quran-notes';
const HIGHLIGHTS_KEY = 'quran-highlights';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useNotes() {
  const [notes, setNotes] = useState<UserNote[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      const saved = localStorage.getItem(HIGHLIGHTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  const persistNotes = useCallback((newNotes: UserNote[]) => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    setNotes(newNotes);
  }, []);

  const persistHighlights = useCallback((newHighlights: Highlight[]) => {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(newHighlights));
    setHighlights(newHighlights);
  }, []);

  // CRUD for Notes
  const addNote = useCallback((
    surahNumber: number,
    ayahNumber: number,
    content: string,
    color?: NoteColor
  ): UserNote => {
    const newNote: UserNote = {
      id: generateId(),
      surahNumber,
      ayahNumber,
      content,
      createdAt: Date.now(),
      color,
    };
    const newNotes = [...notes, newNote];
    persistNotes(newNotes);
    return newNote;
  }, [notes, persistNotes]);

  const updateNote = useCallback((
    id: string,
    content: string,
    color?: NoteColor
  ) => {
    const newNotes = notes.map(note =>
      note.id === id
        ? { ...note, content, color, updatedAt: Date.now() }
        : note
    );
    persistNotes(newNotes);
  }, [notes, persistNotes]);

  const deleteNote = useCallback((id: string) => {
    const newNotes = notes.filter(note => note.id !== id);
    persistNotes(newNotes);
  }, [notes, persistNotes]);

  const getNote = useCallback((id: string): UserNote | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const getNotesForAyah = useCallback((
    surahNumber: number,
    ayahNumber: number
  ): UserNote[] => {
    return notes.filter(
      note => note.surahNumber === surahNumber && note.ayahNumber === ayahNumber
    );
  }, [notes]);

  const getNotesForSurah = useCallback((surahNumber: number): UserNote[] => {
    return notes.filter(note => note.surahNumber === surahNumber);
  }, [notes]);

  // Highlights CRUD
  const addHighlight = useCallback((
    surahNumber: number,
    ayahNumber: number,
    text: string,
    startOffset: number,
    endOffset: number,
    color: NoteColor
  ): Highlight => {
    const newHighlight: Highlight = {
      id: generateId(),
      surahNumber,
      ayahNumber,
      text,
      startOffset,
      endOffset,
      color,
      createdAt: Date.now(),
    };
    const newHighlights = [...highlights, newHighlight];
    persistHighlights(newHighlights);
    return newHighlight;
  }, [highlights, persistHighlights]);

  const deleteHighlight = useCallback((id: string) => {
    const newHighlights = highlights.filter(h => h.id !== id);
    persistHighlights(newHighlights);
  }, [highlights, persistHighlights]);

  const getHighlightsForAyah = useCallback((
    surahNumber: number,
    ayahNumber: number
  ): Highlight[] => {
    return highlights.filter(
      h => h.surahNumber === surahNumber && h.ayahNumber === ayahNumber
    );
  }, [highlights]);

  const getHighlightsForSurah = useCallback((surahNumber: number): Highlight[] => {
    return highlights.filter(h => h.surahNumber === surahNumber);
  }, [highlights]);

  // O(1) lookup for notes on an ayah
  const notesSet = useMemo(() => {
    return new Set(notes.map(n => `${n.surahNumber}-${n.ayahNumber}`));
  }, [notes]);

  const hasNote = useCallback((surahNumber: number, ayahNumber: number): boolean => {
    return notesSet.has(`${surahNumber}-${ayahNumber}`);
  }, [notesSet]);

  return {
    notes,
    highlights,
    addNote,
    updateNote,
    deleteNote,
    getNote,
    getNotesForAyah,
    getNotesForSurah,
    hasNote,
    addHighlight,
    deleteHighlight,
    getHighlightsForAyah,
    getHighlightsForSurah,
  };
}
