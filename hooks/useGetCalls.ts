import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true);

      try {
        // https://getstream.io/video/docs/react/guides/querying-calls/#filters
        const { calls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });

        setCalls(calls);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id]);

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  // Modified to exclude recently started meetings (less than 1 hour ago) from endedCalls
  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    if (!!endedAt) return true; // Explicitly ended meetings
    if (!startsAt) return false; // No start time
    
    const startTime = new Date(startsAt);
    // Only consider it ended if it started more than 1 hour ago
    return startTime < oneHourAgo;
  });

  // Modified to include upcoming meetings AND recently started meetings (within the last hour)
  const upcomingCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    if (!!endedAt) return false; // Explicitly ended meetings are not upcoming
    if (!startsAt) return false; // No start time
    
    const startTime = new Date(startsAt);
    // Include if it's in the future OR if it started less than 1 hour ago
    return startTime > oneHourAgo;
  });

  return { endedCalls, upcomingCalls, callRecordings: calls, isLoading };
};
