'use client';
import { forwardRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Task, DaysOfWeek, ScheduleLayout } from '@/app/page';
import { cn } from '@/lib/utils';

interface ScheduleDisplayProps {
  tasks: Task[];
  hours: string[];
  visibleDays: DaysOfWeek[];
  layout: ScheduleLayout;
  onQuickAddTask: (day: DaysOfWeek, startTime: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
}

function getTaskDurationInMinutes(startTime: string, endTime: string): number {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) return 60;
    return end - start;
}

const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(
    ({ tasks, hours, visibleDays, layout, onQuickAddTask, onDeleteTask }, ref) => {
    
    const timeSlots = useMemo(() => hours.map(h => timeToMinutes(h)), [hours]);

    // This function calculates how many cells a task should span
    const getTaskSpan = (task: Task): number => {
        const taskStart = timeToMinutes(task.startTime);
        const taskEnd = timeToMinutes(task.endTime);
        
        let span = 0;
        let currentTime = taskStart;

        for (const slotStart of timeSlots) {
            if (currentTime === slotStart && slotStart < taskEnd) {
                // Find the next slot to determine the duration of the current cell
                const currentSlotIndex = timeSlots.indexOf(slotStart);
                const nextSlotStart = currentSlotIndex + 1 < timeSlots.length ? timeSlots[currentSlotIndex + 1] : Infinity;
                
                span++;
                currentTime = nextSlotStart;
                if (currentTime >= taskEnd) break;
            }
        }
        return Math.max(1, span);
    };
    
    // This function helps to avoid rendering cells that are already covered by a task
    const renderedCells = useMemo(() => {
        const cells: { [key: string]: boolean } = {};
        tasks.forEach(task => {
            const span = getTaskSpan(task);
            if (span > 1) {
                const startIdx = hours.findIndex(h => h === task.startTime);
                if (startIdx === -1) return;

                for (let i = 1; i < span; i++) {
                    if (startIdx + i < hours.length) {
                        const hourToSkip = hours[startIdx + i];
                        if (layout === 'vertical') {
                           cells[`${task.day}-${hourToSkip}`] = true;
                        } else {
                           cells[`${hourToSkip}-${task.day}`] = true;
                        }
                    }
                }
            }
        });
        return cells;
    }, [tasks, hours, layout, getTaskSpan]);

    const headers = layout === 'vertical' ? visibleDays : hours;
    const rows = layout === 'vertical' ? hours : visibleDays;

    return (
        <div ref={ref} className="bg-background p-1">
        <Card className="border shadow-sm">
            <Table className="border-collapse w-full table-fixed">
            <TableHeader>
                <TableRow className="hover:bg-card">
                    <TableHead className="w-28 border-r p-2 text-center sticky left-0 bg-card z-10">
                        {layout === 'vertical' ? 'Time' : 'Day'}
                    </TableHead>
                    {headers.map((header) => (
                        <TableHead key={header} className="border-r p-2 text-center font-semibold">
                            {header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((rowItem) => (
                <TableRow key={rowItem} className="hover:bg-card">
                    <TableCell className="font-semibold border-r p-2 text-center sticky left-0 bg-card z-10">{rowItem}</TableCell>
                    {headers.map((colItem) => {
                        const day = layout === 'vertical' ? colItem : rowItem;
                        const hour = layout === 'vertical' ? rowItem : colItem;

                        if (renderedCells[`${day}-${hour}`] || renderedCells[`${hour}-${day}`]) {
                            return null;
                        }

                        const task = tasks.find(t => {
                            return layout === 'vertical' 
                                ? t.day === day && t.startTime === hour 
                                : t.day === day && t.startTime === hour;
                        });

                        if (task) {
                            const span = getTaskSpan(task);
                            const props = layout === 'vertical' ? { rowSpan: span } : { colSpan: span };

                            return (
                                <TableCell
                                    key={`${day}-${hour}`}
                                    {...props}
                                    className={cn("p-0 border-r align-top relative group", task.color)}
                                >
                                    <div className="text-primary-foreground h-full p-2 rounded-sm text-sm">
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
                                onClick={() => onQuickAddTask(day as DaysOfWeek, hour)}
                                className="p-2 border-r align-top min-h-[4rem] min-w-[8rem] cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors"
                            ></TableCell>
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
