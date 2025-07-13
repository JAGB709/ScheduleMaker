'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import ControlsSidebar from '@/components/controls-sidebar';
import ScheduleDisplay from '@/components/schedule-display';
import Header from '@/components/header';
import { useToast } from "@/hooks/use-toast"

const initialHours = Array.from({ length: 15 }, (_, i) => `${i + 6}:00`); // 6:00 to 20:00

const initialDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const initialSchedule = () => {
  const schedule: { [key: string]: { [key: string]: string } } = {};
  initialDays.forEach(day => {
    schedule[day] = {};
    initialHours.forEach(hour => {
      schedule[day][hour] = '';
    });
  });
  return schedule;
};


export type ScheduleData = { [key: string]: { [key: string]: string } };
export type DaysOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule());
  const [hours, setHours] = useState<string[]>(initialHours);
  const [visibleDays, setVisibleDays] = useState<DaysOfWeek[]>(initialDays as DaysOfWeek[]);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedData = localStorage.getItem('scheduleSnap-data');
    if (savedData) {
      try {
        const { schedule, hours, visibleDays } = JSON.parse(savedData);
        if (schedule && hours && visibleDays) {
          setSchedule(schedule);
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
    localStorage.setItem('scheduleSnap-data', JSON.stringify({ schedule, hours, visibleDays }));
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
      // Temporarily remove borders from editable cells for a cleaner look
      const cells = scheduleRef.current.querySelectorAll('[contenteditable="true"]');
      cells.forEach(cell => (cell as HTMLElement).style.border = '1px solid transparent');

      html2canvas(scheduleRef.current, {
        useCORS: true,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
        scale: 2,
        onclone: (document) => {
            // This runs in the cloned document before rendering
            const table = document.querySelector('table');
            if (table) {
                table.style.width = '100%';
                table.style.tableLayout = 'fixed';
            }
        }
      }).then((canvas) => {
        // Restore borders
        cells.forEach(cell => (cell as HTMLElement).style.border = '');

        const link = document.createElement('a');
        link.download = 'schedulesnap.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
         // Restore borders even if there's an error
        cells.forEach(cell => (cell as HTMLElement).style.border = '');
        toast({
            title: "Export failed",
            description: "Something went wrong during the image export.",
            variant: "destructive"
        })
        console.error("Export error:", err);
      });
    }
  };
  
  const updateActivity = (day: string, hour: string, activity: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: activity
      }
    }));
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
    const newHours = [...hours, newHour].sort((a, b) => parseFloat(a.replace(':', '.')) - parseFloat(b.replace(':', '.')));
    setHours(newHours);

    const newSchedule = { ...schedule };
    visibleDays.forEach(day => {
        if (!newSchedule[day]) newSchedule[day] = {};
        newSchedule[day][newHour] = '';
    });
    setSchedule(newSchedule);
  };

  const removeHour = (hourToRemove: string) => {
    if (hours.length <= 1) {
        toast({ title: "Cannot remove last hour", variant: "destructive" });
        return;
    }
    setHours(hours.filter(h => h !== hourToRemove));
    // No need to update schedule data, it will just not be displayed
  };

  const toggleDay = (day: DaysOfWeek) => {
    const newVisibleDays = visibleDays.includes(day)
      ? visibleDays.filter(d => d !== day)
      : [...visibleDays, day];
    
    // Maintain a consistent order
    const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    newVisibleDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    setVisibleDays(newVisibleDays);
    
    // Ensure day data exists if it's newly added
    if (!schedule[day]) {
      const newSchedule = { ...schedule };
      newSchedule[day] = {};
      hours.forEach(hour => {
        newSchedule[day][hour] = '';
      });
      setSchedule(newSchedule);
    }
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
            />
          </Sidebar>
          <SidebarInset>
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div ref={scheduleRef} className="bg-background">
                <ScheduleDisplay 
                  schedule={schedule}
                  onUpdateActivity={updateActivity}
                  hours={hours}
                  visibleDays={visibleDays}
                />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
