'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ListChecks, MessageCircle, Settings, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: CalendarDays },
  { href: '/plan', label: 'Plan', icon: ListChecks },
  { href: '/coach', label: 'Coach', icon: MessageCircle },
  { href: '/constraints', label: 'Schedule', icon: Sliders },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
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
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
