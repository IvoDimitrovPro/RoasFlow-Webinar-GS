import { useEffect, useState } from 'react';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();

  useEffect(() => {
    console.log('useGetCallById: client initialized:', !!client);
    console.log('useGetCallById: fetching call with ID:', id);

    if (!client) {
      console.error('Stream client is not initialized.');
      setIsCallLoading(false);
      return;
    }

    const loadCall = async () => {
      try {
        // First try to get the call directly
        try {
          const callId = Array.isArray(id) ? id[0] : id;
          console.log('Trying to get call directly with ID:', callId);
          const directCall = client.call('default', callId);
          await directCall.get();
          console.log('useGetCallById: Call found directly:', directCall);
          setCall(directCall);
          setIsCallLoading(false);
          return;
        } catch (directError) {
          console.log('Could not get call directly, trying query:', directError);
        }

        // If direct get fails, try querying
        const { calls } = await client.queryCalls({
          filter_conditions: { id },
        });

        if (calls.length > 0) {
          console.log('useGetCallById: Call found via query:', calls[0]);
          setCall(calls[0]);
        } else {
          console.warn('useGetCallById: No calls found for the provided ID.');
        }
      } catch (error) {
        console.error('useGetCallById: Error querying calls:', error);
      } finally {
        setIsCallLoading(false);
      }
    };

    loadCall();
  }, [client, id]);

  return { call, isCallLoading };
};
