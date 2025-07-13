
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { DaysOfWeek, Task } from '@/app/schedule/[id]/page';
import { useEffect } from "react";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  hours: string[];
  visibleDays: DaysOfWeek[];
  defaultDay: DaysOfWeek;
  defaultStartTime: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Task name is required.'),
  day: z.string().min(1, 'Please select a day.'),
  startTime: z.string().min(1, 'Start time is required.'),
  duration: z.coerce.number().min(0.25, 'Duration must be at least 15 minutes.').max(24, 'Duration cannot exceed 24 hours.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Please select a valid color.'),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTaskDialog({
  isOpen,
  onClose,
  onAddTask,
  hours,
  visibleDays,
  defaultDay,
  defaultStartTime
}: CreateTaskDialogProps) {

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      day: defaultDay,
      startTime: defaultStartTime,
      duration: 1,
      color: '#64B5F6',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: '',
            day: defaultDay,
            startTime: defaultStartTime,
            duration: 1,
            color: '#64B5F6',
        });
    }
  }, [isOpen, defaultDay, defaultStartTime, form]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const startMinutes = parseInt(data.startTime.split(':')[0]) * 60 + parseInt(data.startTime.split(':')[1]);
    const endMinutes = startMinutes + data.duration * 60;
    
    if (endMinutes > 24*60) {
      form.setError("duration", { message: "Task cannot extend past midnight." });
      return;
    }

    const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endMinute = (endMinutes % 60).toString().padStart(2, '0');
    const endTime = `${endHour}:${endMinute}`;

    onAddTask({
      name: data.name,
      day: data.day as DaysOfWeek,
      startTime: data.startTime,
      endTime: endTime,
      color: data.color
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for your new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Team Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibleDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {hours.map(hour => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                            <Input type="number" min="0.25" step="0.25" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="p-1 h-10 w-14" />
                      <span className="text-sm text-muted-foreground">{field.value.toUpperCase()}</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
