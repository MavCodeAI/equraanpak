import { Home, BookmarkCheck, CalendarDays, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home', icon: Home, path: '/' },
  { key: 'schedule', icon: CalendarDays, path: '/schedule' },
  { key: 'progress', icon: BarChart3, path: '/progress' },
  { key: 'bookmarks', icon: BookmarkCheck, path: '/bookmarks' },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  // Hide on reading pages
  if (location.pathname.startsWith('/surah/') || location.pathname === '/page-reading') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {navItems.map(({ key, icon: Icon, path }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={key}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors rounded-lg',
                active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
