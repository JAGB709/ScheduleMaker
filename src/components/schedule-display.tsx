
'use client';
import { forwardRef, useMemo, useState, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Task, DaysOfWeek, ScheduleLayout } from '@/app/schedule/[id]/page';
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

// Function to calculate overlap layout
const getOverlapLayout = (tasks: Task[]) => {
    const sortedTasks = [...tasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const layout = new Map<string, { width: number; left: number; total: number }>();
    if (!sortedTasks.length) return layout;

    const overlapGroups: Task[][] = [];
    
    for (const task of sortedTasks) {
        let placed = false;
        for (const group of overlapGroups) {
            const lastTaskInGroup = group[group.length - 1];
            if (timeToMinutes(task.startTime) < timeToMinutes(lastTaskInGroup.endTime)) {
                group.push(task);
                placed = true;
                break;
            }
        }
        if (!placed) {
            overlapGroups.push([task]);
        }
    }
    
    for (const group of overlapGroups) {
        for (let i = 0; i < group.length; i++) {
            const task = group[i];
            const total = group.length;
            const width = 100 / total;
            const left = i * width;
            layout.set(task.id, { width, left, total });
        }
    }
    
    return layout;
};


const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(
    ({ tasks, hours, visibleDays, layout, onNewTask, onDeleteTask }, ref) => {
    
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<Cell | null>(null);
    const [endCell, setEndCell] = useState<Cell | null>(null);
    
    const sortedHours = useMemo(() => [...hours].sort(), [hours]);
    const dayOrder: DaysOfWeek[] = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
    const sortedVisibleDays = useMemo(() => dayOrder.filter(day => visibleDays.includes(day)), [visibleDays, dayOrder]);

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
            let day: DaysOfWeek;
            let startTime: string;
            let endTime: string;

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
                const startDayIndex = sortedVisibleDays.indexOf(startCell.day);
                const endDayIndex = sortedVisibleDays.indexOf(endCell.day);
                day = sortedVisibleDays[Math.min(startDayIndex, endDayIndex)];
                // Note: horizontal drag-to-create spans only one hour slot by design.
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
        const handleDocMouseUp = (e: MouseEvent) => {
             if (isDragging) {
                handleMouseUp();
             }
        };
        document.addEventListener('mouseup', handleDocMouseUp);
        return () => document.removeEventListener('mouseup', handleDocMouseUp);
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
            const startDayIndex = sortedVisibleDays.indexOf(startCell.day);
            const endDayIndex = sortedVisibleDays.indexOf(endCell.day);
            const [minIdx, maxIdx] = [Math.min(startDayIndex, endDayIndex), Math.max(startDayIndex, endDayIndex)];
            for (let i = minIdx; i <= maxIdx; i++) {
                 selected[`${sortedVisibleDays[i]}-${startCell.hour}`] = true;
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
            <Table onMouseUp={handleMouseUp} className="border-collapse w-full table-fixed">
            <TableHeader>
                <TableRow className="hover:bg-card">
                    <TableHead className="w-24 md:w-28 border-r p-2 text-center sticky left-0 bg-card z-20 text-xs md:text-sm">
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
                    <TableCell className="font-semibold border-r p-2 text-center sticky left-0 bg-card z-20 text-xs md:text-sm">{rowItem}</TableCell>
                    {headers.map((colItem) => {
                        const day = layout === 'vertical' ? colItem as DaysOfWeek : rowItem as DaysOfWeek;
                        const hour = layout === 'vertical' ? rowItem : colItem;
                        const cellKey = `${day}-${hour}`;

                        const tasksInCell = tasks.filter(t => {
                             if (layout === 'vertical') {
                                return t.day === day && timeToMinutes(t.startTime) <= timeToMinutes(hour) && timeToMinutes(t.endTime) > timeToMinutes(hour);
                            } else { // horizontal
                                return t.startTime === hour && t.day === day;
                            }
                        });
                        
                        const overlapLayout = getOverlapLayout(tasksInCell);
                        
                        return (
                            <TableCell
                                key={cellKey}
                                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(day, hour); }}
                                onMouseEnter={(e) => { e.preventDefault(); handleMouseEnter(day, hour); }}
                                className={cn(
                                    "p-0 border-r align-top min-h-[4rem] h-16 md:h-20 min-w-[6rem] md:min-w-[8rem] cursor-cell transition-colors relative",
                                    selectedCells[cellKey] ? 'bg-accent/70' : 'hover:bg-accent/50'
                                )}
                            >
                                <div className={cn("absolute inset-0 flex", layout === 'vertical' ? 'flex-row' : 'flex-col')}>
                                {tasksInCell.map(task => {
                                    // Only render the task block if it starts in this cell
                                    if (task.startTime !== hour && layout === 'vertical') {
                                        return null;
                                    }
                                     if (task.day !== day && layout === 'horizontal') {
                                        return null;
                                    }

                                    const layoutProps = overlapLayout.get(task.id);
                                    if (!layoutProps) return null;

                                    const startMinutes = timeToMinutes(task.startTime);
                                    const endMinutes = timeToMinutes(task.endTime);
                                    const durationMinutes = endMinutes - startMinutes;

                                    const oneHourSlotHeight = 100; // as a percentage of the cell height
                                    const oneDaySlotWidth = 100; // as a percentage of cell width

                                    let sizeStyle: React.CSSProperties = {};
                                    let positionStyle: React.CSSProperties = {
                                        backgroundColor: task.color,
                                    };

                                    const hex = task.color.replace('#', '');
                                    const r = parseInt(hex.substring(0, 2), 16);
                                    const g = parseInt(hex.substring(2, 4), 16);
                                    const b = parseInt(hex.substring(4, 6), 16);
                                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                    const textColor = brightness > 128 ? 'black' : 'white';
                                    positionStyle.color = textColor;

                                    if (layout === 'vertical') {
                                        sizeStyle.height = `${(durationMinutes / 60) * oneHourSlotHeight}%`;
                                        sizeStyle.width = `${layoutProps.width}%`;
                                        positionStyle.left = `${layoutProps.left}%`;
                                        positionStyle.top = 0;
                                        positionStyle.zIndex = layoutProps.total > 1 ? 10 + layoutProps.left : 10;
                                    } else {
                                        // TODO: Implement horizontal multi-day span if needed
                                        sizeStyle.width = '100%'; 
                                        sizeStyle.height = `${layoutProps.width}%`;
                                        positionStyle.top = `${layoutProps.left}%`;
                                        positionStyle.left = 0;
                                        positionStyle.zIndex = layoutProps.total > 1 ? 10 + layoutProps.left : 10;
                                    }
                                    
                                    return (
                                        <div
                                            key={task.id}
                                            style={{ ...sizeStyle, ...positionStyle}}
                                            className="absolute p-1 rounded-sm text-[10px] md:text-xs overflow-hidden group border-l border-t border-black/10"
                                        >
                                            <p className="font-semibold">{task.name}</p>
                                            <p className="opacity-80">{task.startTime} - {task.endTime}</p>
                                             <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("absolute top-0 right-0 h-5 w-5 opacity-0 group-hover:opacity-100", textColor === 'black' ? 'text-destructive hover:bg-black/10' : 'text-white hover:bg-white/20')}
                                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                </div>
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
