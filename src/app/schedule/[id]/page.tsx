
'use client';

import { useState, useRef, useEffect, use } from 'react';
import html2canvas from 'html2canvas';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import ControlsSidebar from '@/components/controls-sidebar';
import ScheduleDisplay from '@/components/schedule-display';
import Header from '@/components/header';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';

const initialHours = Array.from({ length: 15 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`); // 06:00 to 20:00
const initialDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export type DaysOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type ScheduleLayout = 'vertical' | 'horizontal';

export interface Task {
  id: string;
  name: string;
  day: DaysOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  color: string; // Hex color string e.g., "#RRGGBB"
}

interface ScheduleData {
  id: string;
  name: string;
  tasks: Task[];
  hours: string[];
  visibleDays: DaysOfWeek[];
  layout: ScheduleLayout;
}

export default function SchedulePage({ params }: { params: { id: string } }) {
  const { id: scheduleId } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!scheduleId) return;
    const savedDataString = localStorage.getItem(`scheduleSnap-data-${scheduleId}`);
    if (savedDataString) {
      try {
        const data = JSON.parse(savedDataString);
        setScheduleData({
            id: scheduleId,
            name: data.name || 'Untitled Schedule',
            tasks: data.tasks || [],
            hours: data.hours || initialHours,
            visibleDays: data.visibleDays || initialDays,
            layout: data.layout || 'vertical'
        });
      } catch (e) {
        console.error("Failed to parse saved schedule", e);
        toast({
          title: t('error'),
          description: t('errorLoadingSchedule'),
          variant: "destructive",
        });
        router.push('/');
      }
    } else {
        toast({
          title: t('notFound'),
          description: t('scheduleNotFound'),
          variant: "destructive",
        });
        router.push('/');
    }
    setIsLoaded(true);
  }, [scheduleId, toast, router, t]);

  const updateScheduleData = (updater: (prev: ScheduleData) => ScheduleData) => {
    setScheduleData(prevData => {
        if (!prevData) return null;
        const newData = updater(prevData);
        return newData;
    });
  };

  const generatePreview = async () => {
    if (!scheduleRef.current) return '';
    try {
      const canvas = await html2canvas(scheduleRef.current, { scale: 0.5 });
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error("Error generating preview:", error);
      return '';
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleData) return;
    try {
        const preview = await generatePreview();

        localStorage.setItem(`scheduleSnap-data-${scheduleId}`, JSON.stringify(scheduleData));
        
        const allSchedulesString = localStorage.getItem('scheduleSnap-schedules');
        let allSchedules = allSchedulesString ? JSON.parse(allSchedulesString) : [];
        const scheduleIndex = allSchedules.findIndex((s: any) => s.id === scheduleId);

        if (scheduleIndex > -1) {
            allSchedules[scheduleIndex].name = scheduleData.name;
            allSchedules[scheduleIndex].preview = preview;
        } else {
            allSchedules.push({
                id: scheduleId,
                name: scheduleData.name,
                preview: preview,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('scheduleSnap-schedules', JSON.stringify(allSchedules));

        toast({
            title: t('success'),
            description: t('scheduleSavedSuccess'),
        });
    } catch (error) {
        console.error("Failed to save schedule", error);
        toast({
            title: t('errorSavingSchedule'),
            description: t('couldNotSaveSchedule'),
            variant: "destructive",
        })
    }
  };

  const handleExport = () => {
    if (scheduleRef.current) {
      toast({
        title: t('exporting'),
        description: t('exportingDescription'),
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
        link.download = `${scheduleData?.name || 'schedulesnap'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        toast({
            title: t('exportFailed'),
            description: t('exportFailedDescription'),
            variant: "destructive"
        })
        console.error("Export error:", err);
      });
    }
  };
  
  const handleNameChange = (newName: string) => {
      updateScheduleData(prev => ({...prev, name: newName}));
  }

  const addHour = (newHour: string) => {
    if (scheduleData?.hours.includes(newHour) || !/^\d{1,2}:\d{2}$/.test(newHour)) {
        toast({
            title: t('invalidHour'),
            description: t('invalidHourDescription'),
            variant: "destructive",
        });
        return;
    }
    updateScheduleData(prev => ({...prev, hours: [...prev.hours, newHour].sort() }));
  };

  const removeHour = (hourToRemove: string) => {
    if (scheduleData && scheduleData.hours.length <= 1) {
        toast({ title: t('cannotRemoveLastHour'), variant: "destructive" });
        return;
    }
    updateScheduleData(prev => ({ ...prev, hours: prev.hours.filter(h => h !== hourToRemove)}));
  };

  const toggleDay = (day: DaysOfWeek) => {
    const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    updateScheduleData(prev => {
        const newVisibleDays = prev.visibleDays.includes(day)
          ? prev.visibleDays.filter(d => d !== day)
          : [...prev.visibleDays, day];
        
        newVisibleDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        return {...prev, visibleDays: newVisibleDays};
    });
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = { ...task, id: Date.now().toString() };
    updateScheduleData(prev => ({...prev, tasks: [...prev.tasks, newTask]}));
    toast({
        title: t('taskCreated'),
        description: t('taskCreatedSuccess', { taskName: task.name }),
    })
  };
  
  const handleDeleteTask = (taskId: string) => {
      updateScheduleData(prev => ({...prev, tasks: prev.tasks.filter(task => task.id !== taskId)}));
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
      updateScheduleData(prev => ({...prev, tasks: prev.tasks.map(task => task.id === updatedTask.id ? updatedTask : task) }));
      toast({
        title: t('taskUpdated'),
        description: t('taskUpdatedSuccess', { taskName: updatedTask.name }),
    })
  };
  
  const handleLayoutChange = (layout: ScheduleLayout) => {
      updateScheduleData(prev => ({...prev, layout}));
  };

  if (!isLoaded || !scheduleData) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">{t('loadingSchedule')}...</div>
        </div>
      );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header 
          onExport={handleExport} 
          onSave={handleSaveSchedule} 
          scheduleName={scheduleData.name}
          onNameChange={handleNameChange}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <ControlsSidebar
              visibleDays={scheduleData.visibleDays}
              onToggleDay={toggleDay}
              hours={scheduleData.hours}
              onAddHour={addHour}
              onRemoveHour={removeHour}
              onAddTask={handleAddTask}
              layout={scheduleData.layout}
              onLayoutChange={handleLayoutChange}
            />
          </Sidebar>
          <SidebarInset>
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div ref={scheduleRef} className="bg-background">
                <ScheduleDisplay 
                  tasks={scheduleData.tasks}
                  hours={scheduleData.hours}
                  visibleDays={scheduleData.visibleDays}
                  layout={scheduleData.layout}
                  onNewTask={handleAddTask}
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
