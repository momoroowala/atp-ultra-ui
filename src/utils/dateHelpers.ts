import { format, addDays, addWeeks, isToday, isTomorrow } from 'date-fns';

export const parseDateAsLocal = (dateString: string | Date): Date => {
  // Handle Date objects directly
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Handle string dates - parse as local date (not UTC)
  if (typeof dateString === 'string') {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Fallback for unexpected types
  return new Date();
};

export const formatDateLabel = (dateStr: string): string => {
  const date = parseDateAsLocal(dateStr);
  
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  
  return format(date, 'MMM d');
};

export const generateRecurringDates = (
  startDateStr: string,
  endDateStr: string,
  pattern: 'daily' | 'weekly' | 'biweekly'
): string[] => {
  const dates: string[] = [];
  const startDate = parseDateAsLocal(startDateStr);
  const endDate = parseDateAsLocal(endDateStr);
  
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    
    switch (pattern) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }
  
  return dates;
};

export const generateRecurringDatesByCount = (
  startDateStr: string,
  pattern: 'daily' | 'weekly' | 'biweekly',
  count: number
): string[] => {
  const dates: string[] = [];
  const startDate = parseDateAsLocal(startDateStr);
  
  let currentDate = startDate;
  
  for (let i = 0; i < count; i++) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    
    switch (pattern) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }
  
  return dates;
};
