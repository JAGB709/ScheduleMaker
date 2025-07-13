
'use client';

import { useI18n } from '@/context/i18n-context';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
            "rounded-full h-7 w-7 p-0 text-xs",
            locale === 'en' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
        )}
        onClick={() => setLocale('en')}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
            "rounded-full h-7 w-7 p-0 text-xs",
            locale === 'es' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
        )}
        onClick={() => setLocale('es')}
      >
        ES
      </Button>
    </div>
  );
}
