'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ListChecks, MessageCircle, Settings, Sliders, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: CalendarDays },
  { href: '/plan', label: 'Plan', icon: ListChecks },
  { href: '/coach', label: 'Coach', icon: MessageCircle },
  { href: '/constraints', label: 'Schedule', icon: Sliders },
  { href: '/audit', label: 'Audit Log', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-muted/30 h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">RunCoach AI</h1>
        <p className="text-xs text-muted-foreground mt-1">Adaptive Training</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
