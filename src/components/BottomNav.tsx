import { memo } from 'react';
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

function isActive(path: string, pathname: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
}

export const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const pathname = location.pathname;

  if (pathname.startsWith('/surah/') || pathname === '/page-reading') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-lg" aria-label="Main navigation">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-2">
        {navItems.map(({ key, icon: Icon, path }) => {
          const isNavActive = isActive(path, pathname);
          return (
            <Link
              key={key}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-all duration-300 rounded-xl relative',
                isNavActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isNavActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary animate-scale-in" />
              )}
              <Icon className={cn('h-5 w-5 transition-transform duration-300', isNavActive && 'text-primary scale-110')} />
              <span className="text-[10px]">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
