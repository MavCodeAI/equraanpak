import { useQuery } from '@tanstack/react-query';
import { Ayah } from '@/types/quran';

interface SurahResponse {
  data: {
    number: number;
    name: string;
    englishName: string;
    ayahs: Ayah[];
  };
}

export function useSurahAyahs(surahNumber: number) {
  return useQuery({
    queryKey: ['surah', surahNumber],
    queryFn: async (): Promise<Ayah[]> => {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
      if (!res.ok) throw new Error('Failed to fetch surah');
      const json: SurahResponse = await res.json();
      return json.data.ayahs;
    },
    staleTime: Infinity, // Quran text doesn't change
    enabled: surahNumber > 0,
  });
}

export function usePageAyahs(pageNumber: number) {
  return useQuery({
    queryKey: ['page', pageNumber],
    queryFn: async (): Promise<Ayah[]> => {
      const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
      if (!res.ok) throw new Error('Failed to fetch page');
      const json = await res.json();
      return json.data.ayahs;
    },
    staleTime: Infinity,
    enabled: pageNumber > 0,
  });
}
