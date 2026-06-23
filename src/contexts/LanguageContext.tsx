'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, TranslationKey, translations } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  tCat: (category: string) => string;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'es',
  t: (k) => k,
  tCat: (c) => c,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('claire-lang') as Lang | null;
    if (saved === 'es' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('claire-lang', newLang);
  };

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  const tCat = (category: string): string => {
    const key = `cat_${category}` as TranslationKey;
    return (translations[lang][key] as string | undefined) ?? category;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, tCat, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
