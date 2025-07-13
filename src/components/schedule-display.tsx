
'use client';
import { forwardRef, useMemo, useState, useEffect, MouseEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import type { Task, DaysOfWeek, ScheduleLayout } from '@/app/schedule/[id]/page';
import { cn } from '@/lib/utils';
import { CellActionDialog } from './cell-action-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { CreateTaskDialog } from './create-task-dialog';

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

const getOverlapLayout = (tasks: Task[]) => {
    const sortedTasks = [...tasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || timeToMinutes(b.endTime) - timeToMinutes(a.endTime));
    
    const layout = new Map<string, { width: number; left: number; total: number }>();
    if (!sortedTasks.length) return layout;

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
    
    const totalColumns = columns.length;
    for (let i = 0; i < totalColumns; i++) {
        const col = columns[i];
        for (const task of col) {
            layout.set(task.id, {
                width: 100 / totalColumns,
                left: i * (100 / totalColumns),
                total: totalColumns
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
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    const [selectedCellTasks, setSelectedCellTasks] = useState<Task[]>([]);
    const [selectedCellInfo, setSelectedCellInfo] = useState<Cell | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    const sortedHours = useMemo(() => [...hours].sort((a,b) => timeToMinutes(a) - timeToMinutes(b)), [hours]);
    const dayOrder: DaysOfWeek[] = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
    const sortedVisibleDays = useMemo(() => dayOrder.filter(day => visibleDays.includes(day)), [visibleDays, dayOrder]);

    const handleCellClick = (e: MouseEvent, day: DaysOfWeek, hour: string) => {
        e.preventDefault();
        
        const tasksInCell = tasks.filter(t => 
            t.day === day && 
            timeToMinutes(t.startTime) < timeToMinutes(hour) + 60 && 
            timeToMinutes(t.endTime) > timeToMinutes(hour)
        );

        if (e.detail > 0 && !isDragging) {
            setSelectedCellTasks(tasksInCell);
            setSelectedCellInfo({day, hour});
            setActionDialogOpen(true);
        }
    };
    
    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setActionDialogOpen(false);
        setEditDialogOpen(true);
    };
    
    const handleCreateNewClick = () => {
      if (!selectedCellInfo) return;
      setActionDialogOpen(false);
      setCreateDialogOpen(true);
    };

    const handleMouseDown = (day: DaysOfWeek, hour: string) => {
      const dragTimeout = setTimeout(() => {
          setIsDragging(true);
          const cell = { day, hour };
          setStartCell(cell);
          setEndCell(cell);
      }, 150); 
      
      const handleMouseUpOnce = () => {
        clearTimeout(dragTimeout);
        document.removeEventListener('mouseup', handleMouseUpOnce);
      }
      document.addEventListener('mouseup', handleMouseUpOnce);
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
        
        setSelectedCellInfo(startCell);
        setCreateDialogOpen(true);
        
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
            <Table onMouseLeave={handleMouseUp} className="border-collapse w-full table-fixed">
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
                        
                        const tasksForThisCell = tasks.filter(t => t.day === day && t.startTime === hour);
                        
                        const tasksOverlappingThisCell = tasks.filter(t => t.day === day &&
                            timeToMinutes(t.startTime) < timeToMinutes(hour) + 60 &&
                            timeToMinutes(t.endTime) > timeToMinutes(hour)
                        );
                        
                        const overlapLayout = getOverlapLayout(tasksOverlappingThisCell);
                        
                        return (
                            <TableCell
                                key={cellKey}
                                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(day, hour); }}
                                onMouseEnter={(e) => { e.preventDefault(); handleMouseEnter(day, hour); }}
                                onClick={(e) => handleCellClick(e, day, hour)}
                                className={cn(
                                    "p-0 border-r align-top min-h-[4rem] h-16 md:h-20 min-w-[6rem] md:min-w-[8rem] cursor-pointer transition-colors relative",
                                    selectedCells[cellKey] ? 'bg-accent/70' : 'hover:bg-accent/50'
                                )}
                            >
                                <div className={cn("absolute inset-0")}>
                                {tasksForThisCell.map(task => {
                                    const layoutProps = overlapLayout.get(task.id);
                                    if (!layoutProps) return null;

                                    const startMinutes = timeToMinutes(task.startTime);
                                    const endMinutes = timeToMinutes(task.endTime);
                                    const durationMinutes = endMinutes - startMinutes;
                                    const topOffset = (startMinutes % 60);
                                    
                                    const cellHeightRem = 4; // h-16 = 4rem, md:h-20 = 5rem
                                    const oneMinuteInRem = (window.innerWidth < 768 ? 4 : 5) / 60;
                                    
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
                                        sizeStyle.height = `calc(${durationMinutes * oneMinuteInRem}rem - 2px)`; 
                                        sizeStyle.width = `calc(${layoutProps.width}% - 2px)`;
                                        positionStyle.left = `calc(${layoutProps.left}% + 1px)`;
                                        positionStyle.top = `${topOffset * oneMinuteInRem}rem`;
                                        positionStyle.zIndex = 10 + layoutProps.left;
                                    } else { // Horizontal layout
                                        sizeStyle.width = `calc(${durationMinutes * oneMinuteInRem}rem - 2px)`;
                                        sizeStyle.height = `calc(${layoutProps.width}% - 2px)`;
                                        positionStyle.top = `calc(${layoutProps.left}% + 1px)`;
                                        positionStyle.left = `1px`;
                                        positionStyle.zIndex = 10 + layoutProps.left;
                                    }
                                    
                                    return (
                                        <div
                                            key={task.id}
                                            style={{ ...sizeStyle, ...positionStyle}}
                                            className="absolute p-1 rounded-sm text-[10px] md:text-xs overflow-hidden group border-l border-t border-black/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCellClick(e, day, hour);
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
            onCreateNew={handleCreateNewClick}
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
        {selectedCellInfo && (
          <CreateTaskDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onAddTask={onNewTask}
            hours={sortedHours}
            visibleDays={sortedVisibleDays}
            defaultDay={selectedCellInfo.day}
            defaultStartTime={selectedCellInfo.hour}
          />
        )}
        </div>
    );
});

ScheduleDisplay.displayName = 'ScheduleDisplay';

export default ScheduleDisplay;
