'use client';

import MeetingTypeList from '@/components/MeetingTypeList';
import { useGetCalls } from '@/hooks/useGetCalls';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const Home = () => {
  const router = useRouter();
  const now = new Date();
  const { upcomingCalls, isLoading } = useGetCalls();

  const formattedTime = now.toLocaleString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDateWithDay = now.toLocaleString('bg-BG', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const nearestUpcomingMeeting = upcomingCalls?.length
    ? [...upcomingCalls].sort((a, b) => {
        const dateA = a.state.startsAt ? new Date(a.state.startsAt).getTime() : 0;
        const dateB = b.state.startsAt ? new Date(b.state.startsAt).getTime() : 0;
        return dateA - dateB;
      })[0]
    : null;

  let formattedMeetingTime = '';
  let formattedMeetingDate = '';
  let hasStarted = false;

  if (nearestUpcomingMeeting?.state?.startsAt) {
    const meetingDate = new Date(nearestUpcomingMeeting.state.startsAt);
    hasStarted = meetingDate < now;
    
    formattedMeetingTime = meetingDate.toLocaleString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    formattedMeetingDate = meetingDate.toLocaleString('bg-BG', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover relative overflow-hidden">
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        
        <div className="relative flex h-full items-center justify-between px-6 py-8 lg:px-11">
          {/* Left side - Meeting info */}
          {isLoading ? (
            <div className="glassmorphism rounded-lg py-4 px-4 max-w-[350px]">
              <p className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Loading meetings...
              </p>
            </div>
          ) : nearestUpcomingMeeting ? (
            <div className="glassmorphism max-w-[350px] rounded-xl p-4 backdrop-blur-md border border-white/10">
              <div className="flex items-start gap-4">
                <div className={`rounded-full ${hasStarted ? 'bg-green-500/30' : 'bg-blue-1/30'} p-3 flex-shrink-0`}>
                  <Image 
                    src={hasStarted ? "/icons/play.svg" : "/icons/upcoming.svg"} 
                    alt={hasStarted ? "in-progress" : "upcoming"} 
                    width={24} 
                    height={24} 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-sky-1">
                    {hasStarted ? 'MEETING IN PROGRESS' : 'NEXT MEETING'}
                  </h3>
                  <h2 className="text-xl font-bold mt-1 line-clamp-1">
                    {nearestUpcomingMeeting.state?.custom?.description || 'Upcoming Meeting'}
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <div className={`${hasStarted ? 'bg-green-500/20' : 'bg-dark-4/50'} rounded-md px-2 py-1`}>
                      <p className="text-lg font-semibold">{formattedMeetingTime}</p>
                    </div>
                    <span className="text-sky-1 mx-1">•</span>
                    <p className="text-sm text-sky-1 line-clamp-1">{formattedMeetingDate}</p>
                  </div>
                  <Button 
                    className={`mt-3 ${hasStarted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-1 hover:bg-blue-1/80'} text-xs px-4 py-1 h-8`}
                    onClick={() => window.open(`/meeting/${nearestUpcomingMeeting.id}`, '_blank')}
                  >
                    {hasStarted ? 'Join Now' : 'Join Meeting'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glassmorphism max-w-[350px] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-dark-3 p-3">
                  <Image src="/icons/schedule.svg" alt="schedule" width={20} height={20} />
                </div>
                <div>
                  <p className="text-base font-medium">No upcoming meetings</p>
                  <p className="text-sm text-sky-1 mt-1">Schedule your next meeting</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Right side - Clock */}
          <div className="glassmorphism rounded-xl p-4 text-right backdrop-blur-md border border-white/10 max-md:hidden">
            <div className="flex flex-col items-end gap-1">
              <h1 className="text-5xl font-bold tracking-tight">{formattedTime}</h1>
              <p className="text-sm font-medium text-sky-1">{formattedDateWithDay}</p>
            </div>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;
