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
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-extrabold tracking-tight">RUN<span className="text-primary">.</span></h1>
        <p className="text-xs text-sidebar-foreground/50 font-semibold mt-0.5">Adaptive training coach</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
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
