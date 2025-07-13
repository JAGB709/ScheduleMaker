
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
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Enter a name for your new schedule.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={scheduleName}
          onChange={(e) => setScheduleName(e.target.value)}
          placeholder="e.g., My Work Week"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
