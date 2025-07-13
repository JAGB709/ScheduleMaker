// src/ai/flows/suggest-schedule.ts
'use server';
/**
 * @fileOverview A schedule suggestion AI agent.
 *
 * - suggestSchedule - A function that handles the schedule suggestion process.
 * - SuggestScheduleInput - The input type for the suggestSchedule function.
 * - SuggestScheduleOutput - The return type for the suggestSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleInputSchema = z.object({
  activities: z.array(z.string()).describe('A list of activities to schedule.'),
  priorities: z.array(z.string()).describe('A list of priorities for the activities.'),
  timeConstraints: z.string().describe('Time constraints for the schedule, such as available hours.'),
});
export type SuggestScheduleInput = z.infer<typeof SuggestScheduleInputSchema>;

const SuggestScheduleOutputSchema = z.object({
  schedule: z.string().describe('The suggested schedule.'),
});
export type SuggestScheduleOutput = z.infer<typeof SuggestScheduleOutputSchema>;

export async function suggestSchedule(input: SuggestScheduleInput): Promise<SuggestScheduleOutput> {
  return suggestScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSchedulePrompt',
  input: {schema: SuggestScheduleInputSchema},
  output: {schema: SuggestScheduleOutputSchema},
  prompt: `You are an AI schedule assistant. Generate an optimized weekly schedule based on the user's activities, priorities, and time constraints.

Follow these strict formatting rules for your output:
1.  List each day of the week from Monday to Sunday.
2.  Each day must end with a colon, e.g., "Monday:".
3.  Under each day, list the scheduled items.
4.  Each item must be on a new line and start with a hyphen '-'.
5.  Each item must be formatted as "TIME - ACTIVITY", for example: "- 09:00 AM - Morning Stand-up". If no specific time is relevant, use a general time like "Morning", "Afternoon", or "Evening".
6. Do not add any extra text, introduction or conclusion. Only output the schedule.

Activities: {{{activities}}}
Priorities: {{{priorities}}}
Time Constraints: {{{timeConstraints}}}

Generate an optimized schedule:`,
});

const suggestScheduleFlow = ai.defineFlow(
  {
    name: 'suggestScheduleFlow',
    inputSchema: SuggestScheduleInputSchema,
    outputSchema: SuggestScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
