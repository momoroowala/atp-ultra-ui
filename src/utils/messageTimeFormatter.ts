import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';

/**
 * Format message timestamp for display:
 * - Less than 60 minutes: "X minutes ago"
 * - Today (>60 min): "Today at 2:30 PM"
 * - Yesterday: "Yesterday at 2:30 PM"
 * - Older: "Dec 15, 2024 at 2:30 PM"
 * 
 * Converts UTC timestamps to local timezone
 */
export const formatMessageTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  const minutesAgo = differenceInMinutes(now, date);
  
  // Less than 1 minute ago
  if (minutesAgo < 1) {
    return 'Just now';
  }
  
  // Less than 60 minutes ago
  if (minutesAgo < 60) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  const timeStr = format(date, 'h:mm a');
  
  // Today
  if (isToday(date)) {
    return `Today at ${timeStr}`;
  }
  
  // Yesterday
  if (isYesterday(date)) {
    return `Yesterday at ${timeStr}`;
  }
  
  // Older than yesterday
  return format(date, 'MMM d, yyyy') + ` at ${timeStr}`;
};

/**
 * Short timestamp for inline display (used in consecutive messages)
 */
export const formatShortTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return format(date, 'h:mm a');
};
