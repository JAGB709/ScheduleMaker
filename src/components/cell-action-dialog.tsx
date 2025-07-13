
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "@/app/schedule/[id]/page";
import { Trash2, Edit, PlusCircle } from "lucide-react";

interface CellActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onCreateNew: () => void;
}

export function CellActionDialog({
  isOpen,
  onClose,
  tasks,
  onEdit,
  onDelete,
  onCreateNew,
}: CellActionDialogProps) {

  const handleCreateClick = () => {
    onClose();
    onCreateNew();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actions</DialogTitle>
          <DialogDescription>
            Choose an action for this time slot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-4">
            <h3 className="text-sm font-medium text-muted-foreground">Existing Tasks</h3>
            {tasks.length > 0 ? (
                <ul className="space-y-2">
                    {tasks.map(task => (
                        <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                            <span className="font-semibold truncate pr-2">{task.name}</span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">No tasks in this specific slot.</p>
            )}
        </div>
        <DialogFooter className="sm:justify-between flex-row-reverse w-full">
            <Button onClick={handleCreateClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Task
            </Button>
           <Button variant="outline" onClick={onClose}>
                Cancel
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
