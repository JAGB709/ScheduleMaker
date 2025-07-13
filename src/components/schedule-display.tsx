'use client';
import { forwardRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Task, DaysOfWeek } from '@/app/page';

interface ScheduleDisplayProps {
  tasks: Task[];
  hours: string[];
  visibleDays: DaysOfWeek[];
  onQuickAddTask: (day: DaysOfWeek, startTime: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

function getTaskDurationInHours(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(1, Math.round(diff));
}

const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(({ tasks, hours, visibleDays, onQuickAddTask, onDeleteTask }, ref) => {

  const renderedCells = useMemo(() => {
    const cells: { [key: string]: boolean } = {};
    tasks.forEach(task => {
        if (!visibleDays.includes(task.day)) return;

        const startHour = parseInt(task.startTime.split(':')[0]);
        const endHour = parseInt(task.endTime.split(':')[0]);
        const duration = endHour - startHour;

        if (duration > 1) {
            for (let i = 1; i < duration; i++) {
                const hourToSkip = (startHour + i).toString().padStart(2, '0') + ':00';
                if (hours.includes(hourToSkip)) {
                    cells[`${task.day}-${hourToSkip}`] = true;
                }
            }
        }
    });
    return cells;
  }, [tasks, hours, visibleDays]);

  return (
    <div ref={ref} className="bg-background p-1">
      <Card className="border shadow-sm">
        <Table className="border-collapse w-full table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-card">
              <TableHead className="w-24 border-r p-2 text-center sticky left-0 bg-card z-10">Time</TableHead>
              {visibleDays.map((day) => (
                <TableHead key={day} className="border-r p-2 text-center font-semibold">{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.map((hour) => (
              <TableRow key={hour} className="hover:bg-card">
                <TableCell className="font-semibold border-r p-2 text-center sticky left-0 bg-card z-10">{hour}</TableCell>
                {visibleDays.map((day) => {
                  if (renderedCells[`${day}-${hour}`]) {
                    return null; // This cell is covered by a multi-hour task
                  }

                  const task = tasks.find(t => t.day === day && t.startTime === hour);
                  
                  if (task) {
                    const rowSpan = getTaskDurationInHours(task.startTime, task.endTime);
                    return (
                      <TableCell
                        key={`${day}-${hour}`}
                        rowSpan={rowSpan}
                        className="p-0 border-r align-top relative group"
                      >
                         <div className="bg-primary/20 text-primary-foreground h-full p-2 rounded-sm text-sm">
                            <p className="font-semibold text-foreground">{task.name}</p>
                            <p className="text-xs text-muted-foreground">{task.startTime} - {task.endTime}</p>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => onDeleteTask(task.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                         </div>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={`${day}-${hour}`}
                      onClick={() => onQuickAddTask(day, hour)}
                      className="p-2 border-r align-top min-h-[4rem] min-w-[8rem] cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors"
                    >
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
});

ScheduleDisplay.displayName = 'ScheduleDisplay';

export default ScheduleDisplay;
