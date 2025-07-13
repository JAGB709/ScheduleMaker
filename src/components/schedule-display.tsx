import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScheduleData } from '@/app/page';

interface ScheduleDisplayProps {
  schedule: ScheduleData;
  onUpdateActivity: (day: keyof ScheduleData, index: number, newActivity: string) => void;
}

const ScheduleDisplay = forwardRef<HTMLDivElement, ScheduleDisplayProps>(({ schedule, onUpdateActivity }, ref) => {
  const daysOfWeek = Object.keys(schedule) as (keyof ScheduleData)[];

  return (
    <div ref={ref} className="bg-background p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => (
          <Card key={day} className="flex flex-col border shadow-sm">
            <CardHeader className="p-3">
              <CardTitle className="text-base font-semibold text-center">{day}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2 flex-1">
              {schedule[day] && schedule[day].length > 0 ? (
                schedule[day].map((item, index) => (
                  <div key={index} className="p-2.5 rounded-lg border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200">
                    <div className="flex flex-col gap-2">
                      <p 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateActivity(day, index, e.currentTarget.textContent || '')}
                        className="text-sm font-medium leading-snug outline-none focus:ring-1 focus:ring-ring rounded-sm -m-0.5 p-0.5"
                      >
                        {item.activity}
                      </p>
                      <Badge variant="secondary" className="whitespace-nowrap self-start">{item.time}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-muted-foreground h-full flex items-center justify-center rounded-md border-2 border-dashed min-h-[6rem]">
                  No activities.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

ScheduleDisplay.displayName = 'ScheduleDisplay';

export default ScheduleDisplay;
