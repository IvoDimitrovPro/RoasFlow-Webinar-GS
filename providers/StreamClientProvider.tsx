'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();

  const createGuestToken = async () => {
    if (!API_KEY) throw new Error('Stream API key is missing');

    console.log('Creating guest token...');
    const response = await fetch('/api/stream/guest-token');
    const responseText = await response.text();
    console.log('Guest token response:', responseText);

    try {
      const { token, userId } = JSON.parse(responseText);
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: userId,
          name: 'Guest',
        },
        tokenProvider: () => token,
      });

      setVideoClient(client);
    } catch (error) {
      console.error('Error parsing guest token response:', error);
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      // Wait for user to load
      return;
    }

    if (user) {
      // User is authenticated, use their credentials
      console.log('Creating client for authenticated user:', user.id);
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: user?.id,
          name: user?.username || user?.id,
          image: user?.imageUrl,
        },
        tokenProvider,
      });

      setVideoClient(client);
    } else {
      // User is not authenticated, create a guest token
      console.log('User not authenticated, creating guest token');
      createGuestToken();
    }
  }, [user, isLoaded]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
