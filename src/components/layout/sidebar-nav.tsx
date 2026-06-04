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
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">RunCoach<span className="text-primary">AI</span></h1>
        <p className="text-xs text-muted-foreground mt-1">Adaptive Training</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      {/* Decorative footer */}
      <div className="p-4 border-t">
        <div className="rounded-xl bg-primary/5 p-3 text-center">
          <p className="text-xs text-primary font-medium">Powered by Claude AI</p>
        </div>
      </div>
    </aside>
  );
}
