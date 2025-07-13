
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Locale = 'en' | 'es';

const translations = { en, es };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocale(savedLocale);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, options?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let text = translations[locale];
    for(const k of keys) {
        if (text && typeof text === 'object' && k in text) {
            text = text[k];
        } else {
            return options?.defaultValue as string ?? key;
        }
    }
    
    if (typeof text !== 'string') return options?.defaultValue as string ?? key;

    if (options) {
      Object.keys(options).forEach(optKey => {
        if (optKey !== 'defaultValue') {
          text = (text as string).replace(`{${optKey}}`, String(options[optKey]));
        }
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
