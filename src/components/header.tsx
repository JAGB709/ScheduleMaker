'use client';

import { CalendarDays, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSave: () => void;
  onExport: () => void;
}

export default function Header({ onSave, onExport }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">ScheduleSnap</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button size="sm" onClick={onExport}>
          <Share2 className="mr-2 h-4 w-4" />
          Export Image
        </Button>
      </div>
    </header>
  );
}
