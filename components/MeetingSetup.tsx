'use client';
import { useEffect, useState } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
  const call = useCall();
  const { useCallEndedAt, useCallStartsAt, useCallCustomData, useLocalParticipant } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const customData = useCallCustomData();
  const localParticipant = useLocalParticipant();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  // Check if this is a webinar and if the current user is the host
  const isWebinar = customData?.isWebinar || false;
  const isHost = localParticipant && call?.state.createdBy && localParticipant.userId === call.state.createdBy.id;

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  const formatTime = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    if (!callStartsAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const startTime = new Date(callStartsAt);
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft(formatTime(diff));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [callStartsAt]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${new Date(callStartsAt).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
        description={timeLeft ? `Starting in: ${timeLeft}` : undefined}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>

      {isWebinar && !isHost && (
        <div className="mb-4 rounded-md bg-blue-900 p-4 text-center">
          <p className="text-sm">
            This is a webinar. Your camera and microphone will be disabled by default.
            The host may grant you permission to speak during the webinar.
          </p>
        </div>
      )}

      <VideoPreview />
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled || (isWebinar && !isHost)}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
            disabled={isWebinar && !isHost}
          />
          Join with mic and camera off
        </label>
        <DeviceSettings />
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={() => {
          // If this is a webinar and the user is not the host, force mic and camera off
          if (isWebinar && !isHost) {
            call.camera.disable();
            call.microphone.disable();
          }

          // Check if the call is already joined
          if (call.state.status !== 'joined') {
            try {
              call.join();
            } catch (error) {
              console.error('Error joining call:', error);
              // If we get an "Already joined" error, we can still proceed
            }
          }
          setIsSetupComplete(true);
        }}
      >
        Join meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;
