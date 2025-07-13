'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface Schedule {
  id: string;
  name: string;
  preview: string; // base64 data URI
  createdAt: string;
}

export default function HomePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedSchedules = localStorage.getItem('scheduleSnap-schedules');
    if (savedSchedules) {
      try {
        const parsedSchedules = JSON.parse(savedSchedules);
        // Sort by creation date, newest first
        parsedSchedules.sort((a: Schedule, b: Schedule) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSchedules(parsedSchedules);
      } catch (error) {
        console.error("Failed to parse schedules from localStorage", error);
        setSchedules([]);
      }
    }
  }, []);

  const handleCreateNewSchedule = () => {
    const newScheduleName = prompt("Enter a name for your new schedule:");
    if (newScheduleName && newScheduleName.trim() !== '') {
      const newScheduleId = `schedule_${Date.now()}`;
      const newScheduleData = {
        id: newScheduleId,
        name: newScheduleName,
        tasks: [],
        hours: Array.from({ length: 15 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`),
        visibleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        layout: 'vertical',
      };
      
      localStorage.setItem(`scheduleSnap-data-${newScheduleId}`, JSON.stringify(newScheduleData));
      
      const newMetaSchedule = {
          id: newScheduleId,
          name: newScheduleName,
          preview: '',
          createdAt: new Date().toISOString()
      };
      
      const updatedSchedules = [newMetaSchedule, ...schedules];
      localStorage.setItem('scheduleSnap-schedules', JSON.stringify(updatedSchedules));
      
      router.push(`/schedule/${newScheduleId}`);
    }
  };
  
  const handleDeleteSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updatedSchedules);
    localStorage.setItem('scheduleSnap-schedules', JSON.stringify(updatedSchedules));
    localStorage.removeItem(`scheduleSnap-data-${scheduleId}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <h1 className="text-xl font-bold tracking-tight">My Schedules</h1>
        <div className="ml-auto">
          <Button onClick={handleCreateNewSchedule}>
            <PlusCircle className="mr-2" />
            Create New Schedule
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-muted rounded-lg p-12">
            <h2 className="text-2xl font-semibold mb-2">No schedules found</h2>
            <p className="text-muted-foreground mb-4">Click the button above to create your first schedule.</p>
            <Image src="https://placehold.co/400x300.png" alt="Empty state illustration" width={400} height={300} data-ai-hint="empty calendar" className="max-w-xs opacity-50"/>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                <Link href={`/schedule/${schedule.id}`} className="flex-grow">
                  <CardHeader className="p-4">
                    <CardTitle className="truncate">{schedule.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted">
                      {schedule.preview ? (
                        <Image src={schedule.preview} alt={`${schedule.name} preview`} width={400} height={225} className="h-full w-full object-cover" />
                      ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary">
                             <p>No preview available</p>
                         </div>
                      )}
                    </div>
                  </CardContent>
                </Link>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                           <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your schedule
                            "{schedule.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSchedule(schedule.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}