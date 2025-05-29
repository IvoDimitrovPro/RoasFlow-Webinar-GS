'use client';

import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info, Loader2 } from 'lucide-react';
import { useStreamVideoClient } from '@/hooks/useStreamVideoClient';
import { useToast } from './ui/use-toast';
import analytics, { WebinarEvent } from '@/lib/analytics';
import { useGetCallById } from '@/hooks/useGetCallById';
import { useUser } from '@clerk/nextjs';

interface WebinarModeToggleProps {
  isWebinar: boolean;
  setIsWebinar: (value: boolean) => void;
  callId: string;
}

const WebinarModeToggle = ({ isWebinar, setIsWebinar, callId }: WebinarModeToggleProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { client } = useStreamVideoClient();
  const { call } = useGetCallById(callId);
  const { toast } = useToast();
  const { user } = useUser();

  // Check if current user is host/has permissions
  useEffect(() => {
    if (!call) return;
    
    const checkPermissions = async () => {
      try {
        // Check if user has permission to update call settings
        // Using string-based permission check instead of OwnCapability enum
        const hasPermission = call.permissionsContext?.hasPermission('update-call-settings');
        setIsHost(hasPermission);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setIsHost(false);
      }
    };
    
    checkPermissions();
  }, [call]);

  const toggleWebinarMode = async (newValue: boolean) => {
    if (!call || !client || !isHost) return;
    
    setIsLoading(true);
    
    try {
      // Track event start
      analytics.trackWebinarEvent(
        WebinarEvent.MODE_TOGGLE, 
        { 
          meetingId: callId,
          enabled: newValue,
          userId: user?.id
        }
      );
      
      // Update call settings to change permissions
      await call.update({
        settings: {
          // In webinar mode, only hosts can publish by default
          // Using string literals instead of CallPermission enum
          permissions: newValue ? [
            // Hosts can do everything
            { role: 'host', name: 'send-audio' },
            { role: 'host', name: 'send-video' },
            { role: 'host', name: 'screenshare' },
            { role: 'host', name: 'create-reaction' },
            
            // Participants need explicit permission for audio/video
            { role: 'participant', name: 'create-reaction' },
            { role: 'participant', name: 'request-permission' },
            
            // Guests can only watch
            { role: 'guest', name: 'create-reaction' },
            { role: 'guest', name: 'request-permission' },
          ] : [
            // Regular meeting mode - everyone can participate
            { role: 'host', name: 'send-audio' },
            { role: 'host', name: 'send-video' },
            { role: 'host', name: 'screenshare' },
            { role: 'host', name: 'create-reaction' },
            
            { role: 'participant', name: 'send-audio' },
            { role: 'participant', name: 'send-video' },
            { role: 'participant', name: 'screenshare' },
            { role: 'participant', name: 'create-reaction' },
            
            { role: 'guest', name: 'send-audio' },
            { role: 'guest', name: 'send-video' },
            { role: 'guest', name: 'create-reaction' },
          ],
          // Set custom field for webinar mode
          custom: {
            ...call.state.settings?.custom,
            isWebinarMode: newValue
          }
        }
      });
      
      // If turning on webinar mode, mute all non-host participants
      if (newValue) {
        // Get all non-host participants
        const participants = Array.from(call.participants.values())
          .filter(participant => 
            participant.userId !== user?.id && 
            participant.roles?.indexOf('host') === -1
          );
        
        // Mute audio for all non-host participants
        for (const participant of participants) {
          if (participant.publishedTracks.audio) {
            await call.muteUser({
              userId: participant.userId,
              audioMuted: true
            });
          }
        }
        
        toast({
          title: "Webinar mode enabled",
          description: "All participants have been muted. Only hosts can speak.",
        });
      } else {
        // When turning off webinar mode, we don't automatically unmute everyone
        // as that could be disruptive, but we allow them to unmute themselves
        toast({
          title: "Meeting mode enabled",
          description: "All participants can now unmute themselves.",
        });
      }
      
      // Update local state
      setIsWebinar(newValue);
      
      // Track successful completion
      analytics.trackWebinarEvent(
        WebinarEvent.MODE_TOGGLE, 
        { 
          meetingId: callId,
          enabled: newValue,
          success: true,
          userId: user?.id,
          participantCount: call.participants.size
        }
      );
    } catch (error) {
      console.error("Error toggling webinar mode:", error);
      
      // Track error
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        'WebinarModeToggle',
        { meetingId: callId, attemptedMode: newValue }
      );
      
      toast({
        title: "Error changing mode",
        description: "Could not change meeting mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show toggle if user isn't a host
  if (!isHost) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-sky-500 bg-dark-3 p-4 text-white">
      <div className="flex items-center gap-2">
        <Label htmlFor="webinar-mode" className="text-base font-medium text-white cursor-pointer">
          {isLoading ? 'Changing mode...' : 'Webinar Mode'}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-sky-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-dark-2 text-white border border-sky-500">
              <p>
                In webinar mode, only hosts can use audio and video by default. Hosts can grant
                permission to specific participants. Enabling webinar mode will mute all participants.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div 
        className={`relative inline-flex h-6 w-11 items-center rounded-full ${isLoading ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-700 cursor-pointer'}`} 
        onClick={() => !isLoading && toggleWebinarMode(!isWebinar)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
        ) : (
          <span 
            className={`${
              isWebinar ? 'translate-x-6 bg-sky-500' : 'translate-x-1 bg-gray-400'
            } inline-block h-4 w-4 transform rounded-full transition-transform`} 
          />
        )}
        <Switch
          id="webinar-mode"
          checked={isWebinar}
          onCheckedChange={toggleWebinarMode}
          disabled={isLoading}
          className="sr-only" // Hide the actual switch but keep it accessible
        />
      </div>
    </div>
  );
};

export default WebinarModeToggle;
