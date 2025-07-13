'use client';
import { forwardRef, useMemo, useState, useRef, useEffect } from 'react';
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
  onNewTask: (task: Omit<Task, 'id' | 'endTime'> & { endTime: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

interface Cell {
  day: DaysOfWeek;
  hour: string;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
}

const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(
    ({ tasks, hours, visibleDays, layout, onNewTask, onDeleteTask }, ref) => {
    
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<Cell | null>(null);
    const [endCell, setEndCell] = useState<Cell | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    const timeSlots = useMemo(() => hours.map(h => timeToMinutes(h)).sort((a,b) => a-b), [hours]);
    const sortedHours = useMemo(() => [...hours].sort(), [hours]);

    const getTaskSpan = (task: Task): number => {
      const taskStartMinutes = timeToMinutes(task.startTime);
      const taskEndMinutes = timeToMinutes(task.endTime);

      if (layout === 'vertical') {
        return sortedHours.filter(hour => {
          const hourMinutes = timeToMinutes(hour);
          return hourMinutes >= taskStartMinutes && hourMinutes < taskEndMinutes;
        }).length;
      } else {
        const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const startIndex = visibleDays.map(d => dayOrder.indexOf(d)).indexOf(dayOrder.indexOf(task.day));
        // This is a simplified span for horizontal, assuming tasks don't span days
        return 1;
      }
    };
    
    const renderedCells = useMemo(() => {
        const cells: { [key: string]: boolean } = {};
        tasks.forEach(task => {
            const taskStartMinutes = timeToMinutes(task.startTime);
            const taskEndMinutes = timeToMinutes(task.endTime);
            
            if (layout === 'vertical') {
                const startIndex = sortedHours.findIndex(h => timeToMinutes(h) === taskStartMinutes);
                const endIndex = sortedHours.findIndex(h => timeToMinutes(h) === taskEndMinutes);
                const span = (endIndex === -1 ? sortedHours.length : endIndex) - startIndex;

                if (span > 1 && startIndex !== -1) {
                    for (let i = 1; i < span; i++) {
                        if (startIndex + i < sortedHours.length) {
                            cells[`${task.day}-${sortedHours[startIndex + i]}`] = true;
                        }
                    }
                }
            }
        });
        return cells;
    }, [tasks, sortedHours, layout]);
    
    const handleMouseDown = (day: DaysOfWeek, hour: string) => {
      setIsDragging(true);
      const cell = { day, hour };
      setStartCell(cell);
      setEndCell(cell);
    };

    const handleMouseEnter = (day: DaysOfWeek, hour: string) => {
        if (isDragging && startCell) {
            if (layout === 'vertical' && day === startCell.day) {
                setEndCell({ day, hour });
            } else if (layout === 'horizontal' && hour === startCell.hour) {
                setEndCell({ day, hour });
            }
        }
    };

    const handleMouseUp = () => {
        if (isDragging && startCell && endCell) {
            const taskName = window.prompt('Enter task name:');
            if (taskName) {
                const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                let startTime, endTime, day;
                
                if (layout === 'vertical') {
                    day = startCell.day;
                    const start = timeToMinutes(startCell.hour);
                    const end = timeToMinutes(endCell.hour);
                    const lastHourSlot = sortedHours[sortedHours.indexOf(endCell.hour)];
                    const lastHourSlotDuration = 60; // Assuming 1 hour slots for simplicity
                    const finalEndMinutes = timeToMinutes(lastHourSlot) + lastHourSlotDuration;
                    
                    startTime = start < end ? startCell.hour : endCell.hour;
                    const endHour = Math.floor(finalEndMinutes / 60).toString().padStart(2, '0');
                    const endMinute = (finalEndMinutes % 60).toString().padStart(2, '0');
                    endTime = `${endHour}:${endMinute}`;
                } else { // horizontal
                    startTime = startCell.hour;
                    const startIdx = dayOrder.indexOf(startCell.day);
                    const endIdx = dayOrder.indexOf(endCell.day);
                    day = startIdx < endIdx ? startCell.day : endCell.day;
                    
                    // For now, horizontal dragging only creates a 1-hour task on the start day
                    const startMinutes = timeToMinutes(startTime);
                    const endMinutes = startMinutes + 60;
                    const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
                    const endMinute = (endMinutes % 60).toString().padStart(2, '0');
                    endTime = `${endHour}:${endMinute}`;
                }

                onNewTask({ name: taskName, day, startTime, endTime, color: 'bg-primary/20' });
            }
        }
        setIsDragging(false);
        setStartCell(null);
        setEndCell(null);
    };
    
    useEffect(() => {
        const table = tableRef.current;
        if (table) {
            const handleMouseLeave = () => {
                if(isDragging) {
                    handleMouseUp();
                }
            };
            table.addEventListener('mouseleave', handleMouseLeave);
            return () => table.removeEventListener('mouseleave', handleMouseLeave);
        }
    }, [isDragging, handleMouseUp]);

    const getSelectedCells = () => {
        if (!isDragging || !startCell || !endCell) return {};
        const selected: { [key: string]: boolean } = {};
        
        if (layout === 'vertical') {
            const startIdx = sortedHours.indexOf(startCell.hour);
            const endIdx = sortedHours.indexOf(endCell.hour);
            const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];

            for (let i = minIdx; i <= maxIdx; i++) {
                selected[`${startCell.day}-${sortedHours[i]}`] = true;
            }
        } else { // horizontal
            const dayOrder: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const startIdx = dayOrder.indexOf(startCell.day);
            const endIdx = dayOrder.indexOf(endCell.day);
            const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
            
            for (let i = minIdx; i <= maxIdx; i++) {
                selected[`${dayOrder[i]}-${startCell.hour}`] = true;
            }
        }

        return selected;
    };
    const selectedCells = getSelectedCells();


    const headers = layout === 'vertical' ? visibleDays : sortedHours;
    const rows = layout === 'vertical' ? sortedHours : visibleDays;

    return (
        <div ref={ref} className="bg-background p-1 select-none">
        <Card className="border shadow-sm">
            <Table ref={tableRef} onMouseUp={handleMouseUp} className="border-collapse w-full table-fixed">
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
                        const day = layout === 'vertical' ? colItem as DaysOfWeek : rowItem as DaysOfWeek;
                        const hour = layout === 'vertical' ? rowItem : colItem;

                        if (renderedCells[`${day}-${hour}`] || (layout === 'horizontal' && renderedCells[`${hour}-${day}`])) {
                            return null;
                        }

                        const task = tasks.find(t => {
                            if (t.day !== day) return false;
                            const taskStartMinutes = timeToMinutes(t.startTime);
                            const hourMinutes = timeToMinutes(hour);
                            return layout === 'vertical' 
                                ? taskStartMinutes === hourMinutes
                                : taskStartMinutes <= hourMinutes && hourMinutes < timeToMinutes(t.endTime);
                        });

                        if (task && ( (layout === 'vertical' && task.startTime === hour) || (layout === 'horizontal' && task.startTime === hour) )) {
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

                        const cellKey = `${day}-${hour}`;
                        return (
                            <TableCell
                                key={cellKey}
                                onMouseDown={() => handleMouseDown(day, hour)}
                                onMouseEnter={() => handleMouseEnter(day, hour)}
                                className={cn(
                                    "p-2 border-r align-top min-h-[4rem] min-w-[8rem] cursor-cell transition-colors",
                                    selectedCells[cellKey] ? 'bg-accent/70' : 'hover:bg-accent/50'
                                )}
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
