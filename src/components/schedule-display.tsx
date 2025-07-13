import { forwardRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import type { ScheduleData, DaysOfWeek } from '@/app/page';

interface ScheduleDisplayProps {
  schedule: ScheduleData;
  hours: string[];
  visibleDays: DaysOfWeek[];
  onUpdateActivity: (day: string, hour: string, newActivity: string) => void;
}

const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(({ schedule, hours, visibleDays, onUpdateActivity }, ref) => {

  const handleBlur = (day: string, hour: string, e: React.FocusEvent<HTMLTableCellElement>) => {
    onUpdateActivity(day, hour, e.currentTarget.textContent || '');
  };

  return (
    <div ref={ref} className="bg-background p-1">
      <Card className="border shadow-sm">
        <Table className="border-collapse w-full">
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
                {visibleDays.map((day) => (
                  <TableCell
                    key={`${day}-${hour}`}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur(day, hour, e)}
                    className="p-2 border-r align-top min-h-[4rem] min-w-[8rem] outline-none focus:ring-2 focus:ring-ring focus:bg-accent/50 focus:z-20"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {schedule[day]?.[hour] || ''}
                  </TableCell>
                ))}
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
