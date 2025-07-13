'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { DaysOfWeek, Task } from '@/app/page';

interface CreateTaskFormProps {
  hours: string[];
  visibleDays: DaysOfWeek[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Task name is required.'),
  day: z.string().min(1, 'Please select a day.'),
  startTime: z.string().min(1, 'Start time is required.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 hour.').max(12, 'Duration cannot exceed 12 hours.'),
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
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const startHour = parseInt(data.startTime.split(':')[0]);
    const endHour = startHour + data.duration;
    
    if (endHour > 24) {
        form.setError('duration', { type: 'manual', message: 'Task cannot extend past midnight.' });
        return;
    }

    const endTime = `${endHour.toString().padStart(2, '0')}:00`;

    onAddTask({
      name: data.name,
      day: data.day as DaysOfWeek,
      startTime: data.startTime,
      endTime: endTime,
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
                        <Input type="number" min="1" {...field} />
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
