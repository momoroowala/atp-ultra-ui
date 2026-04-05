import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO, isToday, isTomorrow } from 'date-fns';

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToUserTimezone = (
  dateStr: string,
  timeStr: string,
  storedTz: string
): Date => {
  // Parse date-only string as local date (not UTC)
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create date in the stored timezone
  const dateInStoredTz = new Date(year, month - 1, day, hours, minutes);
  const zonedDate = fromZonedTime(dateInStoredTz, storedTz);
  
  // Convert to user's timezone
  const userTz = getUserTimezone();
  return toZonedTime(zonedDate, userTz);
};

export const formatTimeInUserTZ = (
  dateStr: string,
  timeStr: string,
  storedTz: string
): string => {
  const userDate = convertToUserTimezone(dateStr, timeStr, storedTz);
  return format(userDate, 'h:mm a zzz', { timeZone: getUserTimezone() });
};

export const convertStoredDateToUserTimezone = (
  dateStr: string,
  storedTz: string | null
): Date => {
  // Fallback to America/New_York if timezone is not stored
  const timezone = storedTz || 'America/New_York';
  const userTz = getUserTimezone();
  
  // Parse as local date in the stored timezone
  const date = new Date(dateStr);
  const zonedDate = fromZonedTime(date, timezone);
  
  // Convert to user's timezone
  return toZonedTime(zonedDate, userTz);
};

export const convertStoredTimestampToUserTimezone = (
  isoTimestamp: string,
  storedTz: string | null
): Date => {
  // Fallback to America/New_York if timezone is not stored
  const timezone = storedTz || 'America/New_York';
  const userTz = getUserTimezone();
  
  // Parse ISO timestamp
  const date = parseISO(isoTimestamp);
  const zonedDate = fromZonedTime(date, timezone);
  
  // Convert to user's timezone
  return toZonedTime(zonedDate, userTz);
};

export const getCommonTimezones = () => [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
];

// Returns the date string (YYYY-MM-DD) in user's timezone
export const getDateInUserTimezone = (
  dateStr: string,
  timeStr: string,
  storedTz: string
): string => {
  const userDate = convertToUserTimezone(dateStr, timeStr, storedTz);
  return format(userDate, 'yyyy-MM-dd');
};

// Returns a formatted date label in user's timezone (Today, Tomorrow, or MMM d)
export const formatDateLabelInUserTZ = (
  dateStr: string,
  timeStr: string,
  storedTz: string
): string => {
  const userDate = convertToUserTimezone(dateStr, timeStr, storedTz);
  
  if (isToday(userDate)) return 'Today';
  if (isTomorrow(userDate)) return 'Tomorrow';
  
  return format(userDate, 'MMM d');
};

// Check if a call is upcoming (in the future) based on user's timezone
export const isCallUpcomingInUserTZ = (
  dateStr: string,
  timeStr: string,
  storedTz: string
): boolean => {
  const userDate = convertToUserTimezone(dateStr, timeStr, storedTz);
  const now = new Date();
  return userDate > now;
};
