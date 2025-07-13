'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import ControlsSidebar from '@/components/controls-sidebar';
import ScheduleDisplay from '@/components/schedule-display';
import Header from '@/components/header';
import { useToast } from "@/hooks/use-toast"

const initialHours = Array.from({ length: 15 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`); // 06:00 to 20:00

const initialDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export type DaysOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Task {
  id: string;
  name: string;
  day: DaysOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hours, setHours] = useState<string[]>(initialHours);
  const [visibleDays, setVisibleDays] = useState<DaysOfWeek[]>(initialDays as DaysOfWeek[]);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedData = localStorage.getItem('scheduleSnap-data');
    if (savedData) {
      try {
        const { tasks, hours, visibleDays } = JSON.parse(savedData);
        if (tasks && hours && visibleDays) {
          setTasks(tasks);
          setHours(hours);
          setVisibleDays(visibleDays);
        }
      } catch (e) {
        console.error("Failed to parse saved schedule", e);
        toast({
          title: "Error",
          description: "Could not load your saved schedule.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleSaveSchedule = () => {
    localStorage.setItem('scheduleSnap-data', JSON.stringify({ tasks, hours, visibleDays }));
    toast({
      title: "Success!",
      description: "Your schedule has been saved locally.",
    });
  };

  const handleExport = () => {
    if (scheduleRef.current) {
      toast({
        title: "Exporting...",
        description: "Your schedule is being converted to an image.",
      });
      
      const backgroundColorValue = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      const backgroundColor = `hsl(${backgroundColorValue})`;

      html2canvas(scheduleRef.current, {
        useCORS: true,
        backgroundColor: backgroundColor,
        scale: 2,
        onclone: (document) => {
            const table = document.querySelector('table');
            if (table) {
                table.style.width = '100%';
                table.style.tableLayout = 'fixed';
            }
        }
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'schedulesnap.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        toast({
            title: "Export failed",
            description: "Something went wrong during the image export.",
            variant: "destructive"
        })
        console.error("Export error:", err);
      });
    }
  };

  const addHour = (newHour: string) => {
    if (hours.includes(newHour) || !/^\d{1,2}:\d{2}$/.test(newHour)) {
        toast({
            title: "Invalid Hour",
            description: "Please enter a valid hour (e.g., 14:30) that doesn't already exist.",
            variant: "destructive",
        });
        return;
    }
    const newHours = [...hours, newHour].sort();
    setHours(newHours);
  };

  const removeHour = (hourToRemove: string) => {
    if (hours.length <= 1) {
        toast({ title: "Cannot remove last hour", variant: "destructive" });
        return;
    }
    setHours(hours.filter(h => h !== hourToRemove));
  };

  const toggleDay = (day: DaysOfWeek) => {
    const newVisibleDays = visibleDays.includes(day)
      ? visibleDays.filter(d => d !== day)
      : [...visibleDays, day];
    
    const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    newVisibleDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    setVisibleDays(newVisibleDays);
  };

  const isTimeSlotTaken = (day: DaysOfWeek, startTime: string, endTime: string, excludeTaskId?: string): boolean => {
    return tasks.some(task => {
      if (task.id === excludeTaskId || task.day !== day) {
        return false;
      }
      // Check for time overlap
      const taskStart = task.startTime;
      const taskEnd = task.endTime;
      return (startTime < taskEnd && endTime > taskStart);
    });
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    if (isTimeSlotTaken(task.day, task.startTime, task.endTime)) {
      toast({
        title: "Time slot conflict",
        description: "This time slot is already taken by another task.",
        variant: "destructive"
      });
      return;
    }
    const newTask: Task = { ...task, id: Date.now().toString() };
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({
        title: "Task created!",
        description: `Task "${task.name}" has been added to the schedule.`,
    })
  };

  const handleQuickAddTask = (day: DaysOfWeek, startTime: string) => {
    const taskName = window.prompt("Enter task name:");
    if (!taskName) return;

    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = startMinutes + 60;
    const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endMinute = (endMinutes % 60).toString().padStart(2, '0');
    const endTime = `${endHour}:${endMinute}`;
    
    handleAddTask({ name: taskName, day, startTime, endTime });
  };
  
  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
      if (isTimeSlotTaken(updatedTask.day, updatedTask.startTime, updatedTask.endTime, updatedTask.id)) {
        toast({
            title: "Time slot conflict",
            description: "This time slot is already taken by another task.",
            variant: "destructive"
        });
        return;
      }
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header onExport={handleExport} onSave={handleSaveSchedule} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <ControlsSidebar
              visibleDays={visibleDays}
              onToggleDay={toggleDay}
              hours={hours}
              onAddHour={addHour}
              onRemoveHour={removeHour}
              onAddTask={handleAddTask}
            />
          </Sidebar>
          <SidebarInset>
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div ref={scheduleRef} className="bg-background">
                <ScheduleDisplay 
                  tasks={tasks}
                  hours={hours}
                  visibleDays={visibleDays}
                  onQuickAddTask={handleQuickAddTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
