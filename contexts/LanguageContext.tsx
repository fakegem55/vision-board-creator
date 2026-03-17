'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '@/types';

interface LanguageContextValue {
  lang: Language;
  mounted: boolean; // hydration 후 true → 언어 감지 완료
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ko',
  mounted: false,
  setLang: () => {},
});

function detectBrowserLang(): Language {
  const nav = navigator.language || navigator.languages?.[0] || '';
  const l = nav.toLowerCase();
  if (l.startsWith('ko')) return 'ko';
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('zh')) return 'zh';
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLang(detectBrowserLang());
    setMounted(true);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, mounted, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
