'use server';

import { suggestSchedule, SuggestScheduleInput } from '@/ai/flows/suggest-schedule';
import { z } from 'zod';

const formSchema = z.object({
  activities: z.string().min(1, 'Please enter at least one activity.'),
  priorities: z.string().optional(),
  timeConstraints: z.string().min(1, 'Please enter your time constraints.'),
});

export async function suggestScheduleAction(prevState: any, formData: FormData) {
  try {
    const parsed = formSchema.safeParse({
      activities: formData.get('activities'),
      priorities: formData.get('priorities'),
      timeConstraints: formData.get('timeConstraints'),
    });

    if (!parsed.success) {
      return { message: 'Invalid form data. Please fill all required fields.', schedule: null };
    }
    
    const { activities, priorities, timeConstraints } = parsed.data;

    const input: SuggestScheduleInput = {
      activities: activities.split(/,|\n/).map(s => s.trim()).filter(Boolean),
      priorities: priorities ? priorities.split(/,|\n/).map(s => s.trim()).filter(Boolean) : [],
      timeConstraints: timeConstraints,
    };

    const result = await suggestSchedule(input);
    
    return { message: 'Success', schedule: result.schedule };
  } catch (error) {
    console.error(error);
    return { message: 'An error occurred while suggesting a schedule.', schedule: null };
  }
}
