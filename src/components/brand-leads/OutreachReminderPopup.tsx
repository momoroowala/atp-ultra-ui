import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, Phone, Mail, X } from 'lucide-react';
import { format, isToday, isPast, formatDistanceToNowStrict } from 'date-fns';

interface OutreachReminder {
  batchId: string;
  importDate: string;
  outreachDate: string;
  followUpDate: string;
  leadCount: number;
  dismissed: boolean;
}

const STORAGE_KEY = 'brand_leads_reminders';

function getReminders(): OutreachReminder[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveReminders(reminders: OutreachReminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export const OutreachReminderPopup = () => {
  const [activeReminder, setActiveReminder] = useState<OutreachReminder | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const reminders = getReminders();
    const now = new Date();

    // Find the first non-dismissed reminder that is due
    const due = reminders.find((r) => {
      if (r.dismissed) return false;
      // Check if outreach date is today or past
      const outreachDue = r.outreachDate && (isToday(new Date(r.outreachDate)) || isPast(new Date(r.outreachDate)));
      // Check if follow-up date is today or past
      const followUpDue = r.followUpDate && (isToday(new Date(r.followUpDate)) || isPast(new Date(r.followUpDate)));
      return outreachDue || followUpDue;
    });

    if (due) {
      setActiveReminder(due);
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    if (!activeReminder) return;
    const reminders = getReminders().map((r) =>
      r.batchId === activeReminder.batchId ? { ...r, dismissed: true } : r
    );
    saveReminders(reminders);
    setOpen(false);
    setActiveReminder(null);
  };

  const snooze = (days: number) => {
    if (!activeReminder) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    const reminders = getReminders().map((r) =>
      r.batchId === activeReminder.batchId
        ? { ...r, followUpDate: newDate.toISOString().split('T')[0] }
        : r
    );
    saveReminders(reminders);
    setOpen(false);
    setActiveReminder(null);
  };

  if (!activeReminder) return null;

  const outreachDate = activeReminder.outreachDate ? new Date(activeReminder.outreachDate) : null;
  const followUpDate = activeReminder.followUpDate ? new Date(activeReminder.followUpDate) : null;
  const isOutreachDue = outreachDate && (isToday(outreachDate) || isPast(outreachDate));
  const isFollowUpDue = followUpDate && (isToday(followUpDate) || isPast(followUpDate));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Outreach Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {activeReminder.leadCount} leads imported
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(activeReminder.importDate), { addSuffix: true })}
              </span>
            </div>

            {isOutreachDue && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Did you email all of these leads?
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Outreach was scheduled for{' '}
                    {outreachDate && isToday(outreachDate)
                      ? 'today'
                      : outreachDate
                      ? format(outreachDate, 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {isFollowUpDue && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Time for phone outreach follow-up!
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                    Follow-up was set for{' '}
                    {followUpDate && isToday(followUpDate)
                      ? 'today'
                      : followUpDate
                      ? format(followUpDate, 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => snooze(1)} className="text-xs">
              Remind tomorrow
            </Button>
            <Button variant="ghost" size="sm" onClick={() => snooze(3)} className="text-xs">
              Snooze 3 days
            </Button>
            <Button size="sm" onClick={dismiss} className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
