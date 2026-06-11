'use client';

import { useLanguage } from '@/lib/language-context';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'sv' : 'en')}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:bg-muted/50',
        className
      )}
      title={language === 'en' ? 'Byt till svenska' : 'Switch to English'}
    >
      <span className={cn('transition-opacity', language === 'sv' ? 'opacity-100' : 'opacity-40')}>🇸🇪</span>
      <span className="text-muted-foreground">/</span>
      <span className={cn('transition-opacity', language === 'en' ? 'opacity-100' : 'opacity-40')}>🇬🇧</span>
    </button>
  );
}
