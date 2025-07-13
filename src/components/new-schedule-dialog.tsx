
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useI18n } from "@/context/i18n-context";

interface NewScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewScheduleDialog({
  isOpen,
  onClose,
  onCreate,
}: NewScheduleDialogProps) {
  const { t } = useI18n();
  const [scheduleName, setScheduleName] = useState("");

  const handleCreate = () => {
    if (scheduleName.trim() !== "") {
      onCreate(scheduleName);
      setScheduleName("");
      onClose();
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setScheduleName("");
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createNewSchedule')}</DialogTitle>
          <DialogDescription>
            {t('newScheduleDescription')}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={scheduleName}
          onChange={(e) => setScheduleName(e.target.value)}
          placeholder={t('newSchedulePlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleCreate}>{t('create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
