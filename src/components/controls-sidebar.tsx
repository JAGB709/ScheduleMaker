'use client';

import { Palette, CalendarDays, Trash2, PlusCircle, PenSquare, Rows, Columns } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CreateTaskForm from '@/components/create-task-form';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import type { DaysOfWeek, Task, ScheduleLayout } from '@/app/page';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { useState } from 'react';
import CustomizationPanel from './customization-panel';

interface ControlsSidebarProps {
  visibleDays: DaysOfWeek[];
  onToggleDay: (day: DaysOfWeek) => void;
  hours: string[];
  onAddHour: (hour: string) => void;
  onRemoveHour: (hour: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  layout: ScheduleLayout;
  onLayoutChange: (layout: ScheduleLayout) => void;
}

const allDays: DaysOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ControlsSidebar({ 
  visibleDays, onToggleDay, hours, onAddHour, onRemoveHour, onAddTask, layout, onLayoutChange 
}: ControlsSidebarProps) {
  const [newHour, setNewHour] = useState('');

  const handleAddHour = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHour(newHour);
    setNewHour('');
  };

  return (
    <>
      <SidebarHeader>
        <h2 className="text-lg font-semibold pl-2">Dashboard</h2>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <Accordion type="multiple" defaultValue={['create-task', 'view-options']} className="w-full">
           <AccordionItem value="create-task" className="border-b">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-primary" />
                <span>Create Task</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <CreateTaskForm hours={hours} visibleDays={visibleDays} onAddTask={onAddTask} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="view-options" className="border-b">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>View Options</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 space-y-6">
              <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="layout-switch" className="font-semibold">Swap Axes</Label>
                    <div className="flex items-center gap-2">
                        <Rows className="h-4 w-4 text-muted-foreground"/>
                        <Switch 
                            id="layout-switch"
                            checked={layout === 'horizontal'}
                            onCheckedChange={(checked) => onLayoutChange(checked ? 'horizontal' : 'vertical')}
                        />
                        <Columns className="h-4 w-4 text-muted-foreground"/>
                    </div>
                  </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Visible Days</h4>
                <div className="grid grid-cols-2 gap-2">
                  {allDays.map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={visibleDays.includes(day)}
                        onCheckedChange={() => onToggleDay(day)}
                      />
                      <Label htmlFor={`day-${day}`} className="text-sm font-normal cursor-pointer">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Manage Hours</h4>
                 <form onSubmit={handleAddHour} className="flex items-center gap-2 mb-2">
                    <Input 
                      type="time"
                      value={newHour}
                      onChange={(e) => setNewHour(e.target.value)}
                      className="h-9"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                </form>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                    {hours.map(hour => (
                        <div key={hour} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-sidebar-accent group">
                            <span>{hour}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onRemoveHour(hour)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="customize" className="border-b-0">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Customize</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <CustomizationPanel />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
    </>
  );
}
