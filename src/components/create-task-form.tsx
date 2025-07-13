'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { DaysOfWeek, Task } from '@/app/page';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface CreateTaskFormProps {
  hours: string[];
  visibleDays: DaysOfWeek[];
  onAddTask: (task: Omit<Task, 'id' | 'endTime'> & { duration: number }) => void;
}

const taskColors = [
    { id: 'blue', value: 'bg-blue-500/30', label: 'Blue' },
    { id: 'green', value: 'bg-green-500/30', label: 'Green' },
    { id: 'red', value: 'bg-red-500/30', label: 'Red' },
    { id: 'yellow', value: 'bg-yellow-500/30', label: 'Yellow' },
    { id: 'purple', value: 'bg-purple-500/30', label: 'Purple' },
    { id: 'pink', value: 'bg-pink-500/30', label: 'Pink' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Task name is required.'),
  day: z.string().min(1, 'Please select a day.'),
  startTime: z.string().min(1, 'Start time is required.'),
  duration: z.coerce.number().min(0.5, 'Duration must be at least 30 minutes.').max(12, 'Duration cannot exceed 12 hours.'),
  color: z.string().min(1, 'Please select a color.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTaskForm({ hours, visibleDays, onAddTask }: CreateTaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      day: visibleDays[0] || 'Monday',
      startTime: hours[0] || '09:00',
      duration: 1,
      color: taskColors[0].value,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    onAddTask({
      name: data.name,
      day: data.day as DaysOfWeek,
      startTime: data.startTime,
      duration: data.duration,
      color: data.color
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input type="number" min="0.5" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Color</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-2"
                >
                  {taskColors.map(color => (
                    <FormItem key={color.id} className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={color.value} className="sr-only" />
                      </FormControl>
                      <Label
                        className={cn(
                          'w-8 h-8 rounded-full border-2 border-transparent cursor-pointer',
                          color.value,
                          field.value === color.value && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                        )}
                        title={color.label}
                      />
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Add Task</Button>
      </form>
    </Form>
  );
}
