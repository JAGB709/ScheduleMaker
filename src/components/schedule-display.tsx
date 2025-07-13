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
    const dayOrder: DaysOfWeek[] = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
    const sortedVisibleDays = useMemo(() => dayOrder.filter(day => visibleDays.includes(day)), [visibleDays, dayOrder]);

    const getTaskSpan = (task: Task): number => {
      const taskStartMinutes = timeToMinutes(task.startTime);
      const taskEndMinutes = timeToMinutes(task.endTime);

      if (layout === 'vertical') {
          return sortedHours.filter(hour => {
              const hourMinutes = timeToMinutes(hour);
              return hourMinutes >= taskStartMinutes && hourMinutes < taskEndMinutes;
          }).length;
      } else { 
          return 1; 
      }
    };
    
    const renderedCells = useMemo(() => {
        const cells: { [key: string]: boolean } = {};
        tasks.forEach(task => {
            const taskStartMinutes = timeToMinutes(task.startTime);
            const taskEndMinutes = timeToMinutes(task.endTime);

            if (layout === 'vertical') {
                const startIndex = sortedHours.findIndex(h => timeToMinutes(h) >= taskStartMinutes);
                if (startIndex !== -1) {
                    const slotsToSpan = sortedHours.filter(h => {
                       const hMinutes = timeToMinutes(h);
                       return hMinutes >= taskStartMinutes && hMinutes < taskEndMinutes;
                    }).length;
                    for (let i = 1; i < slotsToSpan; i++) {
                        if (startIndex + i < sortedHours.length) {
                           cells[`${task.day}-${sortedHours[startIndex + i]}`] = true;
                        }
                    }
                }
            } else { // Horizontal rendering logic
                 const dayIndex = sortedVisibleDays.indexOf(task.day);
                if (dayIndex !== -1) {
                    const slotsToSpan = 1; 
                    for (let i = 1; i < slotsToSpan; i++) {
                        if (dayIndex + i < sortedVisibleDays.length) {
                            cells[`${sortedVisibleDays[dayIndex + i]}-${task.startTime}`] = true;
                        }
                    }
                }
            }
        });
        return cells;
    }, [tasks, sortedHours, sortedVisibleDays, layout]);
    
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
        if (!isDragging || !startCell || !endCell) {
            setIsDragging(false);
            setStartCell(null);
            setEndCell(null);
            return;
        }

        const taskName = window.prompt('Enter task name:');
        if (taskName) {
            let day, startTime, endTime;

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
            } else { // horizontal
                startTime = startCell.hour;
                const startDayIndex = dayOrder.indexOf(startCell.day);
                const endDayIndex = dayOrder.indexOf(endCell.day);
                day = dayOrder[Math.min(startDayIndex, endDayIndex)];

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

            onNewTask({ name: taskName, day, startTime, endTime, color: '#A9A9A9' });
        }
        
        setIsDragging(false);
        setStartCell(null);
        setEndCell(null);
    };
    
    useEffect(() => {
        const handleDocMouseUp = () => {
             if (isDragging) {
                handleMouseUp();
             }
        };
        document.addEventListener('mouseup', handleDocMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleDocMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, startCell, endCell]);


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
        } else {
            const startIdx = dayOrder.indexOf(startCell.day);
            const endIdx = dayOrder.indexOf(endCell.day);
            const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
            
            for (let i = minIdx; i <= maxIdx; i++) {
                if (sortedVisibleDays.includes(dayOrder[i])) {
                    selected[`${dayOrder[i]}-${startCell.hour}`] = true;
                }
            }
        }

        return selected;
    };
    const selectedCells = getSelectedCells();


    const headers = layout === 'vertical' ? sortedVisibleDays : sortedHours;
    const rows = layout === 'vertical' ? sortedHours : sortedVisibleDays;

    return (
        <div ref={ref} className="bg-background p-1 select-none w-full overflow-x-auto">
        <Card className="border shadow-sm">
            <Table ref={tableRef} onMouseUp={handleMouseUp} className="border-collapse w-full table-fixed">
            <TableHeader>
                <TableRow className="hover:bg-card">
                    <TableHead className="w-24 md:w-28 border-r p-2 text-center sticky left-0 bg-card z-10 text-xs md:text-sm">
                        {layout === 'vertical' ? 'Time' : 'Day'}
                    </TableHead>
                    {headers.map((header) => (
                        <TableHead key={header} className="border-r p-2 text-center font-semibold text-xs md:text-sm">
                            {header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((rowItem) => (
                <TableRow key={rowItem} className="hover:bg-card">
                    <TableCell className="font-semibold border-r p-2 text-center sticky left-0 bg-card z-10 text-xs md:text-sm">{rowItem}</TableCell>
                    {headers.map((colItem) => {
                        const day = layout === 'vertical' ? colItem as DaysOfWeek : rowItem as DaysOfWeek;
                        const hour = layout === 'vertical' ? rowItem : colItem;
                        
                        const cellKey = `${day}-${hour}`;
                        if (renderedCells[cellKey]) {
                            return null;
                        }

                        const task = tasks.find(t => {
                            if (t.day !== day) return false;
                            const taskStartMinutes = timeToMinutes(t.startTime);
                            const taskEndMinutes = timeToMinutes(t.endTime);
                            const hourStartMinutes = timeToMinutes(hour);

                            if (layout === 'vertical') {
                                return hourStartMinutes === taskStartMinutes;
                            }
                            return hourStartMinutes >= taskStartMinutes && hourStartMinutes < taskEndMinutes;
                        });


                        if (task && (layout === 'vertical' ? task.startTime === hour : tasks.some(t => t.day === day && t.startTime <= hour && t.endTime > hour))) {
                             const taskToRender = tasks.find(t => t.day === day && t.startTime <= hour && t.endTime > hour)!;
                             if (taskToRender.startTime !== hour && layout === 'vertical') {
                             } else {

                                const span = getTaskSpan(taskToRender);
                                const props = layout === 'vertical' ? { rowSpan: span } : { colSpan: 1 };
                                
                                const hex = taskToRender.color.replace('#', '');
                                const r = parseInt(hex.substring(0, 2), 16);
                                const g = parseInt(hex.substring(2, 4), 16);
                                const b = parseInt(hex.substring(4, 6), 16);
                                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                const textColor = brightness > 128 ? 'black' : 'white';

                                return (
                                    <TableCell
                                        key={cellKey}
                                        {...props}
                                        style={{ backgroundColor: taskToRender.color, color: textColor }}
                                        className={cn("p-0 border-r align-top relative group")}
                                    >
                                        <div className="h-full p-2 rounded-sm text-xs md:text-sm">
                                            <p className="font-semibold">{taskToRender.name}</p>
                                            <p className="opacity-80 text-[10px] md:text-xs">{taskToRender.startTime} - {taskToRender.endTime}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100", textColor === 'black' ? 'text-destructive hover:bg-black/10' : 'text-white hover:bg-white/20')}
                                                onClick={() => onDeleteTask(taskToRender.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                );
                            }
                        }

                        return (
                            <TableCell
                                key={cellKey}
                                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(day, hour); }}
                                onMouseEnter={(e) => { e.preventDefault(); handleMouseEnter(day, hour); }}
                                className={cn(
                                    "p-2 border-r align-top min-h-[4rem] min-w-[6rem] md:min-w-[8rem] cursor-cell transition-colors",
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
