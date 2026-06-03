export const dynamic = 'force-dynamic';

import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
