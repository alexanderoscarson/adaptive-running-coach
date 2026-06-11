'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarDays, Trophy, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { useLanguage } from '@/lib/language-context';

const NAV_ITEMS = [
  { href: '/today', labelSv: 'Hem', labelEn: 'Home', icon: Home },
  { href: '/plan', labelSv: 'Plan', labelEn: 'Plan', icon: CalendarDays },
  { href: '/races', labelSv: 'Lopp', labelEn: 'Races', icon: Trophy },
  { href: '/coach', labelSv: 'Coach', labelEn: 'Coach', icon: MessageCircle },
  { href: '/settings', labelSv: 'Profil', labelEn: 'Profile', icon: User },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-border">
      <div className="p-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display">P<span className="text-primary">arro</span>t</h1>
          <p className="text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-widest mt-1">Personal Trainer</p>
        </div>
        <LanguageToggle className="text-sidebar-foreground/50 mt-1" />
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          const label = language === 'sv' ? item.labelSv : item.labelEn;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-[10px] text-sidebar-foreground/30 font-bold uppercase tracking-wider">
          {language === 'sv' ? 'Tema' : 'Theme'}
        </span>
        <ThemeToggle className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
      </div>
    </aside>
  );
}
