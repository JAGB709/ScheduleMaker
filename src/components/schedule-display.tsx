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
  onNewTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

interface Cell {
  day: DaysOfWeek;
  hour: string;
}

function timeToMinutes(time: string): number {
    if (!time) return 0;
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

    const sortedHours = useMemo(() => [...hours].sort(), [hours]);

    const getTaskSpan = (task: Task): number => {
      const taskStartMinutes = timeToMinutes(task.startTime);
      const taskEndMinutes = timeToMinutes(task.endTime);

      if (layout === 'vertical') {
          // Calculate how many hour slots the task spans
          return sortedHours.filter(hour => {
              const hourMinutes = timeToMinutes(hour);
              return hourMinutes >= taskStartMinutes && hourMinutes < taskEndMinutes;
          }).length;
      }
      return 1; // Horizontal span is always 1 for now
    };
    
    const renderedCells = useMemo(() => {
        const cells: { [key: string]: boolean } = {};
        if (layout === 'vertical') {
            tasks.forEach(task => {
                const taskStartMinutes = timeToMinutes(task.startTime);
                const taskEndMinutes = timeToMinutes(task.endTime);

                const startIndex = sortedHours.findIndex(h => timeToMinutes(h) >= taskStartMinutes);

                if (startIndex !== -1) {
                    const startSlotMinutes = timeToMinutes(sortedHours[startIndex]);
                    const slotsToSpan = sortedHours.filter(h => {
                       const hMinutes = timeToMinutes(h);
                       return hMinutes >= startSlotMinutes && hMinutes < taskEndMinutes;
                    }).length;

                    for (let i = 1; i < slotsToSpan; i++) {
                        if (startIndex + i < sortedHours.length) {
                           cells[`${task.day}-${sortedHours[startIndex + i]}`] = true;
                        }
                    }
                }
            });
        }
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
                let startTime, endTime, day;
                
                if (layout === 'vertical') {
                    day = startCell.day;
                    const startIdx = sortedHours.indexOf(startCell.hour);
                    const endIdx = sortedHours.indexOf(endCell.hour);
                    startTime = sortedHours[Math.min(startIdx, endIdx)];

                    const finalEndCellHour = sortedHours[Math.max(startIdx, endIdx)];
                    const nextHourIndex = sortedHours.indexOf(finalEndCellHour) + 1;

                    if (nextHourIndex < sortedHours.length) {
                        endTime = sortedHours[nextHourIndex];
                    } else {
                        const lastHourMinutes = timeToMinutes(finalEndCellHour) + 60;
                        const endHour = Math.floor(lastHourMinutes / 60).toString().padStart(2, '0');
                        const endMinute = (lastHourMinutes % 60).toString().padStart(2, '0');
                        endTime = `${endHour}:${endMinute}`;
                    }
                } else { // horizontal (simplified)
                    startTime = startCell.hour;
                    day = startCell.day; // simplified to single day
                    
                    const nextHourIndex = sortedHours.indexOf(startTime) + 1;
                    if (nextHourIndex < sortedHours.length) {
                        endTime = sortedHours[nextHourIndex];
                    } else {
                        const lastHourMinutes = timeToMinutes(startTime) + 60;
                        const endHour = Math.floor(lastHourMinutes / 60).toString().padStart(2, '0');
                        const endMinute = (lastHourMinutes % 60).toString().padStart(2, '0');
                        endTime = `${endHour}:${endMinute}`;
                    }
                }

                onNewTask({ name: taskName, day, startTime, endTime, color: '#A9A9A9' }); // Default color
            }
        }
        setIsDragging(false);
        setStartCell(null);
        setEndCell(null);
    };
    
    useEffect(() => {
        const table = tableRef.current;
        const handleMouseLeave = (e: MouseEvent) => {
            if(isDragging) {
                handleMouseUp();
            }
        };
        table?.addEventListener('mouseleave', handleMouseLeave);
        
        const handleDocMouseUp = () => {
             if (isDragging) {
                handleMouseUp();
             }
        };
        document.addEventListener('mouseup', handleDocMouseUp);

        return () => {
            table?.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseup', handleDocMouseUp);
        };
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
            const visibleDayOrder = dayOrder.filter(d => visibleDays.includes(d));
            const startIdx = visibleDayOrder.indexOf(startCell.day);
            const endIdx = visibleDayOrder.indexOf(endCell.day);
            const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
            
            for (let i = minIdx; i <= maxIdx; i++) {
                selected[`${visibleDayOrder[i]}-${startCell.hour}`] = true;
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
            <Table ref={tableRef} className="border-collapse w-full table-fixed">
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
                        
                        const cellKey = `${day}-${hour}`;
                        if (renderedCells[cellKey]) {
                            return null;
                        }

                        const task = tasks.find(t => {
                            if (t.day !== day) return false;
                             if (layout === 'vertical') {
                                return t.startTime === hour;
                             }
                             // A task is in a horizontal cell if it starts in that hour slot
                             return timeToMinutes(t.startTime) <= timeToMinutes(hour) && timeToMinutes(hour) < timeToMinutes(t.endTime);
                        });


                        if (task && ( (layout === 'vertical' && task.startTime === hour) || (layout === 'horizontal' && task.startTime === hour) )) {
                            const span = getTaskSpan(task);
                            const props = layout === 'vertical' ? { rowSpan: span } : { colSpan: span };
                            
                            // Basic text color algorithm (light/dark)
                            const hex = task.color.replace('#', '');
                            const r = parseInt(hex.substring(0, 2), 16);
                            const g = parseInt(hex.substring(2, 4), 16);
                            const b = parseInt(hex.substring(4, 6), 16);
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            const textColor = brightness > 128 ? 'black' : 'white';

                            return (
                                <TableCell
                                    key={cellKey}
                                    {...props}
                                    style={{ backgroundColor: task.color, color: textColor }}
                                    className={cn("p-0 border-r align-top relative group")}
                                >
                                    <div className="h-full p-2 rounded-sm text-sm">
                                        <p className="font-semibold">{task.name}</p>
                                        <p className="text-xs opacity-80">{task.startTime} - {task.endTime}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100", textColor === 'black' ? 'text-destructive hover:bg-black/10' : 'text-white hover:bg-white/20')}
                                            onClick={() => onDeleteTask(task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            );
                        }

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
