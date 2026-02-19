

## Error Fix Plan - Quran App

### Problem 1: Vite HMR Stale Cache (Main Error)
The "Cannot read properties of null (reading 'useState')" error is caused by Vite serving outdated cached modules. The error points to line 293 in LanguageContext.tsx, but that file only has 105 lines -- proof of stale cache.

**Fix:** Force a full module graph rebuild by adding cache-busting to `vite.config.ts` and touching key entry files.

### Problem 2: Stale Closure Bug in SurahPage.tsx
`handleTouchStart` uses `useCallback` but references `toggleBookmark` which depends on `bookmarks` state. The dependency array only has `[bookmarks, surahNumber]` but `toggleBookmark` is not wrapped in `useCallback` itself, so the long-press bookmark may reference stale data.

**Fix:** Wrap `toggleBookmark` in `useCallback` with proper dependencies, or remove `useCallback` from `handleTouchStart` since it's not performance-critical.

### Problem 3: Same Stale Closure Bug in PageReadingPage.tsx
Identical issue with `handleTouchStart` and `toggleBookmark`.

### Problem 4: useQuranAudio cleanup dependency
The cleanup `useEffect` at line 64 has an empty dependency array `[]` but references `stopTimeTracking` which is a `useCallback`. This could miss cleanup in edge cases.

---

### Technical Implementation

**File 1: `vite.config.ts`**
- Add a unique build timestamp comment to force cache invalidation

**File 2: `src/main.tsx`**
- Add a cache-busting comment with timestamp to force fresh module loading

**File 3: `src/contexts/LanguageContext.tsx`**
- Minor touch to force re-compilation (add explicit React import validation)

**File 4: `src/contexts/SettingsContext.tsx`**
- Minor touch to force re-compilation

**File 5: `src/pages/SurahPage.tsx`**
- Fix `handleTouchStart` stale closure: remove `useCallback` wrapper (not needed for touch handlers)
- Same for `handleTouchEnd`

**File 6: `src/pages/PageReadingPage.tsx`**
- Fix same `handleTouchStart` / `handleTouchEnd` stale closure issue

**File 7: `src/hooks/useQuranAudio.ts`**
- Add `stopTimeTracking` to cleanup useEffect dependency array

