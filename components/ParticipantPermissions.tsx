'use client';

import { useState, useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { Mic, MicOff, Video, VideoOff, UserPlus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const ParticipantPermissions = () => {
  const call = useCall();
  const { useParticipants, useLocalParticipant, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const customData = useCallCustomData();
  const [permissionsMap, setPermissionsMap] = useState<Record<string, { audio: boolean; video: boolean }>>({});
  const [isWebinar, setIsWebinar] = useState(false);

  // Check if the current user is the host/creator of the call
  const isHost = localParticipant && call?.state.createdBy && localParticipant.userId === call.state.createdBy.id;

  // Initialize webinar mode from call custom data
  useEffect(() => {
    if (customData) {
      setIsWebinar(customData.isWebinar || false);
    }
  }, [customData]);

  // Initialize permissions map
  useEffect(() => {
    if (participants.length > 0) {
      const initialPermissions: Record<string, { audio: boolean; video: boolean }> = {};
      
      participants.forEach((participant) => {
        // In webinar mode, only the host has permissions by default
        const isParticipantHost = participant.userId === call?.state.createdBy?.id;
        initialPermissions[participant.userId] = {
          audio: isParticipantHost || !isWebinar,
          video: isParticipantHost || !isWebinar,
        };
      });
      
      setPermissionsMap(initialPermissions);
    }
  }, [participants, call?.state.createdBy?.id, isWebinar]);

  // If not in webinar mode or not the host, don't show this component
  if (!isWebinar || !isHost) return null;

  const togglePermission = (userId: string, type: 'audio' | 'video') => {
    setPermissionsMap((prev) => {
      const newPermissions = { ...prev };
      if (newPermissions[userId]) {
        newPermissions[userId] = {
          ...newPermissions[userId],
          [type]: !newPermissions[userId][type],
        };
      }
      return newPermissions;
    });

    // Send permission update to the participant
    const participant = participants.find(p => p.userId === userId);
    if (participant) {
      // Use Stream's SDK to update permissions
      // This is a placeholder - actual implementation depends on Stream's API
      if (type === 'audio') {
        if (permissionsMap[userId]?.audio) {
          // Revoke permission
          call?.muteAudioOfUser(userId);
        } else {
          // Grant permission
          // Note: This doesn't automatically enable their audio, it just allows them to unmute
          // The participant would need to unmute themselves
        }
      } else if (type === 'video') {
        if (permissionsMap[userId]?.video) {
          // Revoke permission
          call?.muteVideoOfUser(userId);
        } else {
          // Grant permission
          // Note: This doesn't automatically enable their video, it just allows them to turn it on
          // The participant would need to enable their camera themselves
        }
      }
    }
  };

  return (
    <div className="bg-dark-2 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Participant Permissions</h3>
      <ScrollArea className="h-[300px] pr-4">
        {participants.map((participant) => {
          const isParticipantHost = participant.userId === call?.state.createdBy?.id;
          
          // Skip the host in the permissions list
          if (isParticipantHost) return null;
          
          return (
            <div key={participant.userId} className="flex items-center justify-between py-2 border-b border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  {participant.name?.[0] || participant.userId[0]}
                </div>
                <span className="text-sm">{participant.name || participant.userId}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Switch
                    id={`audio-${participant.userId}`}
                    checked={permissionsMap[participant.userId]?.audio || false}
                    onCheckedChange={() => togglePermission(participant.userId, 'audio')}
                  />
                  <Label htmlFor={`audio-${participant.userId}`} className="sr-only">
                    Audio permission
                  </Label>
                  {permissionsMap[participant.userId]?.audio ? (
                    <Mic className="h-4 w-4 text-green-500" />
                  ) : (
                    <MicOff className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Switch
                    id={`video-${participant.userId}`}
                    checked={permissionsMap[participant.userId]?.video || false}
                    onCheckedChange={() => togglePermission(participant.userId, 'video')}
                  />
                  <Label htmlFor={`video-${participant.userId}`} className="sr-only">
                    Video permission
                  </Label>
                  {permissionsMap[participant.userId]?.video ? (
                    <Video className="h-4 w-4 text-green-500" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
};

export default ParticipantPermissions;
