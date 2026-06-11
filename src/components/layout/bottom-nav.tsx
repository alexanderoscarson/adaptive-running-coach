'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarDays, Trophy, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

const NAV_ITEMS = [
  { href: '/today', labelSv: 'Hem', labelEn: 'Home', icon: Home },
  { href: '/plan', labelSv: 'Plan', labelEn: 'Plan', icon: CalendarDays },
  { href: '/races', labelSv: 'Lopp', labelEn: 'Races', icon: Trophy },
  { href: '/coach', labelSv: 'Coach', labelEn: 'Coach', icon: MessageCircle },
  { href: '/settings', labelSv: 'Profil', labelEn: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          const label = language === 'sv' ? item.labelSv : item.labelEn;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-[56px]',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_var(--primary)]')} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
