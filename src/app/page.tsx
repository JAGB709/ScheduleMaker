'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import ControlsSidebar from '@/components/controls-sidebar';
import ScheduleDisplay from '@/components/schedule-display';
import Header from '@/components/header';
import { useToast } from "@/hooks/use-toast"

const defaultSchedule = {
  "Monday": [
    { "time": "9:00 AM", "activity": "Morning Stand-up & Coffee" }, 
    { "time": "10:00 AM", "activity": "Deep Work Block: Project A" }, 
    { "time": "1:00 PM", "activity": "Lunch Break" }, 
    { "time": "2:00 PM", "activity": "Design Review" }
  ],
  "Tuesday": [
    { "time": "10:00 AM", "activity": "Client Meeting" },
    { "time": "11:00 AM", "activity": "Follow-up & Emails" }
  ],
  "Wednesday": [
    { "time": "9:00 AM", "activity": "Team Brainstorming" },
    { "time": "11:00 AM", "activity": "Development Block: Project B" }, 
    { "time": "3:00 PM", "activity": "Team Sync" }
  ],
  "Thursday": [
    { "time": "10:00 AM", "activity": "Research & Development" },
    { "time": "2:00 PM", "activity": "User Testing Session" }
  ],
  "Friday": [
    { "time": "9:00 AM", "activity": "Focus Work" },
    { "time": "4:00 PM", "activity": "Weekly Retrospective & Planning" }
  ],
  "Saturday": [{ "time": "Morning", "activity": "Personal Project / Learning" }],
  "Sunday": [{ "time": "Afternoon", "activity": "Relax & Recharge" }],
};

export type ScheduleData = typeof defaultSchedule;

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleData>(defaultSchedule);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedSchedule = localStorage.getItem('scheduleSnap-schedule');
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
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
    localStorage.setItem('scheduleSnap-schedule', JSON.stringify(schedule));
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
      html2canvas(scheduleRef.current, {
        useCORS: true,
        backgroundColor: 'var(--background)',
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'schedulesnap.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const handleAiSuggestion = (suggestion: string) => {
    try {
      const newSchedule: ScheduleData = {
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
      };
      
      const lines = suggestion.split('\n').filter(line => line.trim() !== '');
      let currentDay: keyof ScheduleData | null = null;
      
      lines.forEach(line => {
        const dayMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):/i);
        if (dayMatch) {
          currentDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() as keyof ScheduleData;
          if (!newSchedule[currentDay]) newSchedule[currentDay] = [];
        } else if (currentDay && line.trim().startsWith('-')) {
            const item = line.substring(line.indexOf('-') + 1).trim();
            const timeActivityMatch = item.match(/^(.+?)\s*-\s*(.+)$/);

            if (timeActivityMatch) {
                const [, time, activity] = timeActivityMatch;
                newSchedule[currentDay]?.push({ time: time.trim(), activity: activity.trim() });
            } else {
                newSchedule[currentDay]?.push({ time: "All Day", activity: item });
            }
        }
      });

      setSchedule(newSchedule);
      toast({
        title: "Schedule Updated!",
        description: "The AI has generated a new schedule for you.",
      });
    } catch (e) {
        toast({
          title: "Parsing Error",
          description: "Could not understand the AI's suggestion format.",
          variant: "destructive",
        });
    }
  };
  
  const updateActivity = (day: keyof ScheduleData, index: number, newActivity: string) => {
    const newSchedule = { ...schedule };
    if(newSchedule[day] && newSchedule[day][index]) {
      newSchedule[day][index].activity = newActivity;
      setSchedule(newSchedule);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header onExport={handleExport} onSave={handleSaveSchedule} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <ControlsSidebar onAiSuggestion={handleAiSuggestion} />
          </Sidebar>
          <SidebarInset>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div ref={scheduleRef}>
                <ScheduleDisplay schedule={schedule} onUpdateActivity={updateActivity} />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
