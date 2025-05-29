'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, UserPlus, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import ParticipantPermissions from './ParticipantPermissions';
import WebinarModeToggle from './WebinarModeToggle';
import ParticipantManagement from './ParticipantManagement';
import { cn } from '@/lib/utils';
import analytics, { WebinarEvent } from '@/lib/analytics';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isWebinar, setIsWebinar] = useState(false);
  const call = useCall();
  const {
    useCallCallingState,
    useCallCustomData,
    useLocalParticipant
  } = useCallStateHooks();

  const customData = useCallCustomData();
  const localParticipant = useLocalParticipant();
  const callId = call?.id || '';

  // Check if the current user is the host/creator of the call
  const isHost = localParticipant && call?.state.createdBy && localParticipant.userId === call.state.createdBy.id;

  // Initialize webinar mode from call custom data
  useEffect(() => {
    if (customData) {
      // Check for both legacy isWebinar and new isWebinarMode fields
      const webinarModeEnabled = customData.isWebinar || 
                                (call?.state.settings?.custom?.isWebinarMode) || 
                                false;
      
      setIsWebinar(webinarModeEnabled);

      // If in webinar mode and not the host, disable audio and video
      if (webinarModeEnabled && !isHost && call) {
        call.camera.disable();
        call.microphone.disable();
      }
      
      // Track webinar mode state for analytics
      if (webinarModeEnabled) {
        analytics.trackWebinarEvent(
          WebinarEvent.MODE_DETECTED, 
          { 
            meetingId: callId,
            enabled: true,
          }
        );
      }
    }
  }, [customData, isHost, call, callId]);

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  // Handle webinar mode change
  const handleWebinarModeChange = (newValue: boolean) => {
    setIsWebinar(newValue);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      {/* Webinar mode toggle - only visible to hosts */}
      {isHost && callId && (
        <div className="absolute top-4 right-4 z-10 max-w-xs">
          <WebinarModeToggle 
            isWebinar={isWebinar} 
            setIsWebinar={handleWebinarModeChange} 
            callId={callId}
          />
        </div>
      )}
      
      <div className="relative flex size-full items-center justify-center">
        <div className=" flex size-full max-w-[1400px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showPermissions,
          })}
        >
          <div className="h-full overflow-auto">
            {isHost && callId ? (
              <ParticipantManagement callId={callId} isWebinarMode={isWebinar} />
            ) : (
              <ParticipantPermissions />
            )}
          </div>
        </div>
      </div>
      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button
          type="button"
          title="Toggle Participants"
          onClick={() => {
            setShowParticipants((prev) => !prev);
            if (showPermissions) setShowPermissions(false);
          }}
        >
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>

        {/* Show permissions button for host */}
        {isHost && (
          <button
            type="button"
            title="Manage Participant Permissions"
            onClick={() => {
              setShowPermissions((prev) => !prev);
              if (showParticipants) setShowParticipants(false);
            }}
          >
            <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <UserPlus size={20} className="text-white" />
            </div>
          </button>
        )}

        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
