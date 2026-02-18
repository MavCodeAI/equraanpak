import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  syncToCloud: async () => {},
  loadFromCloud: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem('quran-app-user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
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
    setUser(null);
    localStorage.removeItem('quran-app-user');
  };

  const syncToCloud = useCallback(async () => {
    if (!user) return;
    const bookmarks = JSON.parse(localStorage.getItem('quran-bookmarks') || '[]');
    const progress = JSON.parse(localStorage.getItem('quran-progress') || '{}');
    const schedule = JSON.parse(localStorage.getItem('quran-schedule') || 'null');
    const readingTime = JSON.parse(localStorage.getItem('quran-reading-time') || '{}');

    await supabase
      .from('app_users')
      .update({ bookmarks, progress, schedule, reading_time: readingTime })
      .eq('id', user.id);
  }, [user]);

  const loadFromCloud = useCallback(async () => {
    if (!user) return;
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
    }
  }, [user]);

  // Auto-sync on login
  useEffect(() => {
    if (user) {
      loadFromCloud();
    }
  }, [user?.id]);

  // Auto-sync before unload
  useEffect(() => {
    if (!user) return;
    const handleUnload = () => syncToCloud();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, syncToCloud]);

  return (
    <UserContext.Provider value={{ user, loading, login, signup, logout, syncToCloud, loadFromCloud }}>
      {children}
    </UserContext.Provider>
  );
};
