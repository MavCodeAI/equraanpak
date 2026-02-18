import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Bookmark } from '@/types/quran';
import { surahList } from '@/data/surahs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BookOpen } from 'lucide-react';

const BookmarksPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);

  const removeBookmark = (b: Bookmark) => {
    setBookmarks((prev) => prev.filter((x) => !(x.surahNumber === b.surahNumber && x.ayahNumber === b.ayahNumber)));
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold text-primary">{t('bookmarks')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 space-y-2">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('noBookmarks')}</p>
          </div>
        ) : (
          bookmarks
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((b) => {
              const surah = surahList.find((s) => s.number === b.surahNumber);
              return (
                <Card key={`${b.surahNumber}-${b.ayahNumber}`} className="flex items-center gap-3 p-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/surah/${b.surahNumber}`)}
                  >
                    <p className="font-medium text-sm">
                      {lang === 'ur' ? surah?.urduName : surah?.englishName} - {t('ayahs')} {b.ayahNumber}
                    </p>
                    <p className="text-xs text-muted-foreground font-arabic rtl">{surah?.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBookmark(b)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              );
            })
        )}
      </main>
    </div>
  );
};

export default BookmarksPage;
