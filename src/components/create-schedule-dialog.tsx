
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

interface CreateScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateScheduleDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateScheduleDialogProps) {
  const [scheduleName, setScheduleName] = useState("");

  const handleCreate = () => {
    if (scheduleName.trim() !== "") {
      onCreate(scheduleName);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          placeholder="Schedule Name"
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
