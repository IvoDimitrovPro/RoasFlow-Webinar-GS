'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';

export const useStreamVideoClient = () => {
  const { user, isLoaded } = useUser();
  const [client, setClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      // Wait for user to load
      return;
    }

    // Function to initialize the client
    const initClient = async () => {
      try {
        if (user) {
          // User is authenticated, use their credentials
          console.log('Creating client for authenticated user:', user.id);
          
          // Fetch token from our API
          const response = await fetch('/api/stream/token');
          
          if (!response.ok) {
            throw new Error('Failed to fetch token');
          }
          
          const { token, userId } = await response.json();
          
          if (!token) {
            throw new Error('Token is empty');
          }

          // Initialize the Stream Video client
          const streamClient = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY || '',
            user: {
              id: user.id,
              name: user.fullName || user.username || user.id,
              image: user.imageUrl,
            },
            token,
          });

          setClient(streamClient);
          return streamClient;
        } else {
          // User is not authenticated, create a guest token
          console.log('User not authenticated, creating guest token');
          
          // Fetch token from our API
          const response = await fetch('/api/stream/guest-token');
          
          if (!response.ok) {
            throw new Error('Failed to fetch guest token');
          }
          
          const { token, userId } = await response.json();
          
          if (!token || !userId) {
            throw new Error('Guest token or userId is empty');
          }

          console.log('Got guest token for userId:', userId);

          // Initialize the Stream Video client
          const streamClient = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY || '',
            user: {
              id: userId,
              name: 'Guest',
              image: 'https://getstream.io/random_svg/?name=Guest',
            },
            token,
          });

          setClient(streamClient);
          return streamClient;
        }
      } catch (error) {
        console.error('Error initializing Stream client:', error);
        return null;
      }
    };

    // Initialize the client
    const clientPromise = initClient();

    // Cleanup function
    return () => {
      clientPromise.then(streamClient => {
        if (streamClient) {
          streamClient.disconnectUser();
          setClient(null);
        }
      });
    };
  }, [isLoaded, user]);

  return client;
};
