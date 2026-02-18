import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  name: string;
}

interface UserContextType {
  user: AppUser | null;
  loading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  lastSynced: string | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  syncToCloud: async () => {},
  loadFromCloud: async () => {},
  lastSynced: null,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem('quran-app-user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLastSynced(localStorage.getItem('quran-last-synced'));
    setLoading(false);
  }, []);

  const login = async (name: string, pin: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('name', name.trim())
      .eq('pin_code', pin)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'not_found' };

    const appUser = { id: data.id, name: data.name };
    setUser(appUser);
    localStorage.setItem('quran-app-user', JSON.stringify(appUser));
    return { success: true };
  };

  const signup = async (name: string, pin: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .insert({ name: name.trim(), pin_code: pin })
      .select('id, name')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'duplicate' };
      return { success: false, error: error.message };
    }

    const appUser = { id: data.id, name: data.name };
    setUser(appUser);
    localStorage.setItem('quran-app-user', JSON.stringify(appUser));
    return { success: true };
  };

  const logout = () => {
    syncToCloud(); // Save before logout
    setUser(null);
    localStorage.removeItem('quran-app-user');
  };

  const syncToCloud = useCallback(async () => {
    if (!user) return;
    try {
      const bookmarks = JSON.parse(localStorage.getItem('quran-bookmarks') || '[]');
      const progress = JSON.parse(localStorage.getItem('quran-progress') || '{}');
      const schedule = JSON.parse(localStorage.getItem('quran-schedule') || 'null');
      const readingTime = JSON.parse(localStorage.getItem('quran-reading-time') || '{}');

      await supabase
        .from('app_users')
        .update({ bookmarks, progress, schedule, reading_time: readingTime })
        .eq('id', user.id);

      const now = new Date().toLocaleString();
      setLastSynced(now);
      localStorage.setItem('quran-last-synced', now);
    } catch {
      // Offline - will sync later
    }
  }, [user]);

  const loadFromCloud = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('app_users')
        .select('bookmarks, progress, schedule, reading_time')
        .eq('id', user.id)
        .single();

      if (data) {
        if (data.bookmarks) localStorage.setItem('quran-bookmarks', JSON.stringify(data.bookmarks));
        if (data.progress) localStorage.setItem('quran-progress', JSON.stringify(data.progress));
        if (data.schedule) localStorage.setItem('quran-schedule', JSON.stringify(data.schedule));
        if (data.reading_time) localStorage.setItem('quran-reading-time', JSON.stringify(data.reading_time));
        const now = new Date().toLocaleString();
        setLastSynced(now);
        localStorage.setItem('quran-last-synced', now);
      }
    } catch {
      // Offline - use local data
    }
  }, [user]);

  // Load from cloud on login
  useEffect(() => {
    if (user) {
      loadFromCloud();
    }
  }, [user?.id]);

  // Auto-sync every 2 minutes while using the app
  useEffect(() => {
    if (!user) return;
    syncIntervalRef.current = setInterval(() => {
      syncToCloud();
    }, 120000); // 2 min
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [user, syncToCloud]);

  // Sync on beforeunload
  useEffect(() => {
    if (!user) return;
    const handleUnload = () => {
      // Use sendBeacon for reliable sync on close
      const bookmarks = localStorage.getItem('quran-bookmarks') || '[]';
      const progress = localStorage.getItem('quran-progress') || '{}';
      const schedule = localStorage.getItem('quran-schedule') || 'null';
      const readingTime = localStorage.getItem('quran-reading-time') || '{}';
      
      // Fallback: also try regular sync
      syncToCloud();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, syncToCloud]);

  // Sync when page becomes hidden (mobile tab switch / app close)
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        syncToCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, syncToCloud]);

  // Sync when coming back online
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => {
      syncToCloud();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncToCloud]);

  return (
    <UserContext.Provider value={{ user, loading, login, signup, logout, syncToCloud, loadFromCloud, lastSynced }}>
      {children}
    </UserContext.Provider>
  );
};
