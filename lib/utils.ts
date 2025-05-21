import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const addToCalendar = (event: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  link: string;
}) => {
  try {
    // Format dates for Google Calendar (remove dashes, colons, and decimal parts)
    const start = event.startTime.replace(/[-:]/g, '').replace(/\.\d+/g, '');
    const end = event.endTime.replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.append('action', 'TEMPLATE');
    calendarUrl.searchParams.append('text', event.title);
    calendarUrl.searchParams.append('details', `${event.description}\n\nJoin the meeting here: ${event.link}`);
    calendarUrl.searchParams.append('dates', `${start}/${end}`);

    window.open(calendarUrl.toString(), '_blank');
  } catch (error) {
    console.error('Error opening calendar:', error);
  }
};
