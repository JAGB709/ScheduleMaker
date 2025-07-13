
'use client';
import { forwardRef, useMemo, useState, useEffect, MouseEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import type { Task, DaysOfWeek, ScheduleLayout } from '@/app/schedule/[id]/page';
import { cn } from '@/lib/utils';
import { CellActionDialog } from './cell-action-dialog';
import { EditTaskDialog } from './edit-task-dialog';

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
    
    // This logic needs to be refined for better visual grouping
    // For now, we'll just group tasks that start at the same time or overlap.
    const columns: Task[][] = [];
    for (const task of sortedTasks) {
        let placed = false;
        for (const col of columns) {
            const lastTaskInCol = col[col.length - 1];
            if (timeToMinutes(task.startTime) >= timeToMinutes(lastTaskInCol.endTime)) {
                col.push(task);
                placed = true;
                break;
            }
        }
        if (!placed) {
            columns.push([task]);
        }
    }
    
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        for (const task of col) {
            layout.set(task.id, {
                width: 100 / columns.length,
                left: i * (100 / columns.length),
                total: columns.length,
            });
        }
    }
    
    return layout;
};


const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(
    ({ tasks, hours, visibleDays, layout, onNewTask, onDeleteTask, onUpdateTask }, ref) => {
    
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<Cell | null>(null);
    const [endCell, setEndCell] = useState<Cell | null>(null);
    
    const [isActionDialogOpen, setActionDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCellTasks, setSelectedCellTasks] = useState<Task[]>([]);
    const [selectedCellInfo, setSelectedCellInfo] = useState<Cell | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    const sortedHours = useMemo(() => [...hours].sort(), [hours]);
    const dayOrder: DaysOfWeek[] = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
    const sortedVisibleDays = useMemo(() => dayOrder.filter(day => visibleDays.includes(day)), [visibleDays, dayOrder]);

    const handleCellClick = (e: MouseEvent, day: DaysOfWeek, hour: string, tasksInCell: Task[]) => {
        e.preventDefault();
        // Prevent dialog from opening when starting a drag
        if (e.detail > 0 && !isDragging) {
             if (tasksInCell.length > 0) {
                setSelectedCellTasks(tasksInCell);
                setSelectedCellInfo({day, hour});
                setActionDialogOpen(true);
            }
        }
    };
    
    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setActionDialogOpen(false);
        setEditDialogOpen(true);
    };
    
    const handleCreateNewInSlot = () => {
        if (!selectedCellInfo) return;
        const taskName = window.prompt('Enter task name:');
        if (taskName) {
            const startTime = selectedCellInfo.hour;
            const nextHourIndex = sortedHours.indexOf(startTime) + 1;
            let endTime;
            if (nextHourIndex < sortedHours.length) {
                endTime = sortedHours[nextHourIndex];
            } else {
                const lastHourMinutes = timeToMinutes(startTime) + 60;
                const endHour = Math.floor(lastHourMinutes / 60).toString().padStart(2, '0');
                const endMinute = (lastHourMinutes % 60).toString().padStart(2, '0');
                endTime = `${endHour}:${endMinute}`;
            }
            onNewTask({ name: taskName, day: selectedCellInfo.day, startTime, endTime, color: '#A9A9A9' });
        }
        setActionDialogOpen(false);
    };

    const handleMouseDown = (day: DaysOfWeek, hour: string) => {
      setTimeout(() => {
          setIsDragging(true);
          const cell = { day, hour };
          setStartCell(cell);
          setEndCell(cell);
      }, 150); // Small delay to distinguish click from drag
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
        const handleDocMouseUp = () => {
             if (isDragging) {
                handleMouseUp();
             } else {
                setStartCell(null);
                setEndCell(null);
                setIsDragging(false);
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
            <Table onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="border-collapse w-full table-fixed">
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
                        
                        const tasksStartingInCell = tasksInCell.filter(t => {
                            if (layout === 'vertical') {
                                return t.startTime === hour;
                            } else {
                                return t.day === day;
                            }
                        });

                        const tasksForThisCellLayout = tasks.filter(t => t.day === day && timeToMinutes(t.startTime) < timeToMinutes(hour) + 60 && timeToMinutes(t.endTime) > timeToMinutes(hour));
                        const overlapLayout = getOverlapLayout(tasksForThisCellLayout);
                        
                        return (
                            <TableCell
                                key={cellKey}
                                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(day, hour); }}
                                onMouseEnter={(e) => { e.preventDefault(); handleMouseEnter(day, hour); }}
                                onClick={(e) => handleCellClick(e, day, hour, tasksInCell)}
                                className={cn(
                                    "p-0 border-r align-top min-h-[4rem] h-16 md:h-20 min-w-[6rem] md:min-w-[8rem] cursor-pointer transition-colors relative",
                                    selectedCells[cellKey] ? 'bg-accent/70' : 'hover:bg-accent/50',
                                    tasksInCell.length > 0 && !selectedCells[cellKey] ? 'bg-muted/20' : ''
                                )}
                            >
                                <div className={cn("absolute inset-0 flex", layout === 'vertical' ? 'flex-row' : 'flex-col')}>
                                {tasksStartingInCell.map(task => {
                                    const layoutProps = overlapLayout.get(task.id);
                                    if (!layoutProps) return null;

                                    const startMinutes = timeToMinutes(task.startTime);
                                    const endMinutes = timeToMinutes(task.endTime);
                                    const durationMinutes = endMinutes - startMinutes;

                                    const oneHourSlotHeight = 100; // as a percentage of the cell height
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
                                        positionStyle.zIndex = 10 + layoutProps.left;
                                    } else {
                                        sizeStyle.width = '100%';
                                        sizeStyle.height = `${layoutProps.width}%`;
                                        positionStyle.top = `${layoutProps.left}%`;
                                        positionStyle.left = 0;
                                        positionStyle.zIndex = 10 + layoutProps.left;
                                    }
                                    
                                    return (
                                        <div
                                            key={task.id}
                                            style={{ ...sizeStyle, ...positionStyle}}
                                            className="absolute p-1 rounded-sm text-[10px] md:text-xs overflow-hidden group border-l border-t border-black/10 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent cell click from firing
                                                handleCellClick(e as any, day, hour, tasksInCell);
                                            }}
                                        >
                                            <p className="font-semibold">{task.name}</p>
                                            <p className="opacity-80">{task.startTime} - {task.endTime}</p>
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
         <CellActionDialog
            isOpen={isActionDialogOpen}
            onClose={() => setActionDialogOpen(false)}
            tasks={selectedCellTasks}
            onEdit={handleEditClick}
            onDelete={onDeleteTask}
            onCreateNew={handleCreateNewInSlot}
        />
        {taskToEdit && (
            <EditTaskDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setTaskToEdit(null);
                }}
                task={taskToEdit}
                onUpdateTask={onUpdateTask}
                hours={sortedHours}
                visibleDays={sortedVisibleDays}
            />
        )}
        </div>
    );
});

ScheduleDisplay.displayName = 'ScheduleDisplay';

export default ScheduleDisplay;
