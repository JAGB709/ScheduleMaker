'use client';

import { ArrowLeft, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import LanguageSwitcher from '@/components/language-switcher';

interface HeaderProps {
  scheduleName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
}

export default function Header({ scheduleName, onNameChange, onSave, onExport }: HeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/')}>
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">{t('backToSchedules')}</span>
      </Button>
      <Input
        type="text"
        value={scheduleName}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-9 max-w-xs text-xl font-bold tracking-tight border-none shadow-none focus-visible:ring-0 p-0"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          {t('save')}
        </Button>
        <Button size="sm" onClick={onExport}>
          <Share2 className="mr-2 h-4 w-4" />
          {t('exportImage')}
        </Button>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
