'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import en from '@/messages/en.json';
import sv from '@/messages/sv.json';

export type Language = 'en' | 'sv';

type Messages = typeof en;
type FlatMessages = Record<string, string>;

function flatten(obj: Record<string, unknown>, prefix = ''): FlatMessages {
  const result: FlatMessages = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[path] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatten(value as Record<string, unknown>, path));
    }
  }
  return result;
}

const flatEn = flatten(en as unknown as Record<string, unknown>);
const flatSv = flatten(sv as unknown as Record<string, unknown>);
const messagesByLang: Record<Language, FlatMessages> = { en: flatEn, sv: flatSv };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('parrot-language');
  if (stored === 'sv' || stored === 'en') return stored;
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('sv') ? 'sv' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState(detectLanguage());
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('parrot-language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let msg = messagesByLang[language][key] || messagesByLang.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(`{${k}}`, v);
      }
    }
    return msg;
  }, [language]);

  // Avoid hydration mismatch — render with 'en' on server, switch on mount
  if (!mounted) {
    const serverT = (key: string, params?: Record<string, string>): string => {
      let msg = flatEn[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, v);
        }
      }
      return msg;
    };
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage, t: serverT }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
