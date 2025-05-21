'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const now = new Date();

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [],
      );

      const recordings = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(recordings);
    };

    if (type === 'recordings') {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => {
          // Check if meeting has already started but is less than 1 hour old
          const startsAt = (meeting as Call).state?.startsAt;
          const meetingStartTime = startsAt ? new Date(startsAt.toString()) : null;
          const hasStarted = meetingStartTime ? meetingStartTime < now : false;

          return (
            <MeetingCard
              key={(meeting as Call).id || (meeting as CallRecording).url}
              icon={
                type === 'ended'
                  ? '/icons/previous.svg'
                  : type === 'upcoming'
                  ? hasStarted ? '/icons/play.svg' : '/icons/upcoming.svg'
                    : '/icons/recordings.svg'
              }
              title={
                (meeting as Call).state?.custom?.description ||
                (meeting as CallRecording).filename?.substring(0, 20) ||
                'No Description'
              }
              date={
                (() => {
                  const callStartsAt = (meeting as Call).state?.startsAt;
                  if (callStartsAt) {
                    return new Date(callStartsAt.toString()).toLocaleString('bg-BG', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                  }

                  const recordingStartTime = (meeting as CallRecording).start_time;
                  if (recordingStartTime) {
                    return new Date(recordingStartTime).toLocaleString('bg-BG', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                  }

                  return 'No date available';
                })()
              }
              isPreviousMeeting={type === 'ended'}
              isInProgress={hasStarted && type === 'upcoming'}
              isRecording={type === 'recordings'}
              link={
                type === 'recordings'
                  ? (meeting as CallRecording).url
                  : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
              }
              buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
              buttonText={type === 'recordings' ? 'Play' : hasStarted ? 'Join Now' : 'Start'}
              handleClick={
                type === 'recordings'
                  ? () => window.open(`${(meeting as CallRecording).url}`, '_blank')
                  : () => window.open(`/meeting/${(meeting as Call).id}`, '_blank')
              }
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
