'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { suggestScheduleAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast"

interface AiSchedulerProps {
  onSuggestion: (suggestion: string) => void;
}

const initialState = {
  message: null,
  schedule: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generate Schedule
    </Button>
  );
}

export default function AiScheduler({ onSuggestion }: AiSchedulerProps) {
  const [state, formAction] = useFormState(suggestScheduleAction, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    if (state?.schedule) {
      onSuggestion(state.schedule);
    }
    if (state?.message && state.message !== 'Success') {
      toast({
        title: "Something went wrong",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, onSuggestion, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="activities">Activities</Label>
        <Textarea
          id="activities"
          name="activities"
          placeholder="e.g., Team meeting, Code review, Gym"
          required
          rows={3}
        />
        <p className="text-xs text-muted-foreground">List activities, separated by commas or new lines.</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="priorities">Priorities (Optional)</Label>
        <Input
          id="priorities"
          name="priorities"
          placeholder="e.g., Finish project report"
        />
         <p className="text-xs text-muted-foreground">What's most important this week?</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="timeConstraints">Time Constraints</Label>
        <Input
          id="timeConstraints"
          name="timeConstraints"
          placeholder="e.g., Work 9am-5pm, free on weekends"
          defaultValue="Work 9am to 5pm on weekdays. Free on weekends."
          required
        />
        <p className="text-xs text-muted-foreground">When are you available?</p>
      </div>
      <SubmitButton />
    </form>
  );
}
