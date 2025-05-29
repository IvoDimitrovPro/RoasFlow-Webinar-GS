'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStreamVideoClient } from '@/hooks/useStreamVideoClient';
import { useGetCallById } from '@/hooks/useGetCallById';
import { useUser } from '@clerk/nextjs';
import { useToast } from './ui/use-toast';
import analytics, { WebinarEvent } from '@/lib/analytics';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  UserPlus, 
  UserMinus, 
  X, 
  Search, 
  Shield, 
  AlertCircle,
  HandRaised,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

interface ParticipantManagementProps {
  callId: string;
  isWebinarMode: boolean;
}

type ParticipantAction = 'mute' | 'unmute' | 'promote' | 'demote' | 'remove' | 'grantAudio' | 'grantVideo';

const ParticipantManagement = ({ callId, isWebinarMode }: ParticipantManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: ParticipantAction;
    participant: any;
  } | null>(null);
  const [permissionRequests, setPermissionRequests] = useState<{
    userId: string;
    userName: string;
    permission: string;
    timestamp: number;
  }[]>([]);

  const { client } = useStreamVideoClient();
  const { call } = useGetCallById(callId);
  const { toast } = useToast();
  const { user } = useUser();

  // Check if current user is host
  useEffect(() => {
    if (!call) return;
    
    const checkPermissions = async () => {
      try {
        // Check if user has permission to update call settings
        const hasPermission = call.permissionsContext?.hasPermission('update-call-settings');
        setIsHost(hasPermission);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setIsHost(false);
      }
    };
    
    checkPermissions();

    // Set up listener for permission requests
    const handlePermissionRequest = (event: any) => {
      if (event.type === 'call.permission_request') {
        const { user, permission } = event.permission_request;
        
        // Add to permission requests queue
        setPermissionRequests(prev => [
          ...prev, 
          {
            userId: user.id,
            userName: user.name || 'Guest User',
            permission,
            timestamp: Date.now()
          }
        ]);

        // Show toast notification
        toast({
          title: "Permission Request",
          description: `${user.name || 'A participant'} is requesting to ${permission === 'send-audio' ? 'speak' : 'share video'}`,
        });
      }
    };

    call.on('call.permission_request', handlePermissionRequest);

    return () => {
      call.off('call.permission_request', handlePermissionRequest);
    };
  }, [call, toast]);

  // Filter participants based on search query
  const filteredParticipants = useMemo(() => {
    if (!call) return [];
    
    const participants = Array.from(call.participants.values());
    
    if (!searchQuery.trim()) return participants;
    
    return participants.filter(participant => 
      participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.userId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [call, searchQuery]);

  // Handle participant actions
  const handleParticipantAction = async (action: ParticipantAction, participant: any) => {
    // For critical actions, show confirmation dialog
    if (action === 'remove' || action === 'promote' || action === 'demote') {
      setPendingAction({ action, participant });
      setShowConfirmDialog(true);
      return;
    }
    
    await executeParticipantAction(action, participant);
  };

  // Execute the actual participant action
  const executeParticipantAction = async (action: ParticipantAction, participant: any) => {
    if (!call || !isHost) return;
    
    setIsActionLoading(true);
    
    try {
      // Track event
      analytics.trackWebinarEvent(
        WebinarEvent.PARTICIPANT_MANAGEMENT, 
        { 
          meetingId: callId,
          action,
          targetUserId: participant.userId,
          userId: user?.id
        }
      );
      
      switch (action) {
        case 'mute':
          await call.muteUser({
            userId: participant.userId,
            audioMuted: true
          });
          toast({
            title: "Participant muted",
            description: `${participant.name || 'Participant'} has been muted.`
          });
          break;
          
        case 'unmute':
          await call.muteUser({
            userId: participant.userId,
            audioMuted: false
          });
          toast({
            title: "Participant unmuted",
            description: `${participant.name || 'Participant'} can now speak.`
          });
          break;
          
        case 'grantAudio':
          await call.grantPermissions({
            user_id: participant.userId,
            permissions: ['send-audio']
          });
          toast({
            title: "Permission granted",
            description: `${participant.name || 'Participant'} can now unmute themselves.`
          });
          break;
          
        case 'grantVideo':
          await call.grantPermissions({
            user_id: participant.userId,
            permissions: ['send-video']
          });
          toast({
            title: "Permission granted",
            description: `${participant.name || 'Participant'} can now enable their camera.`
          });
          break;
          
        case 'promote':
          await call.updateUserPermissions({
            user_id: participant.userId,
            role: 'host'
          });
          toast({
            title: "Participant promoted",
            description: `${participant.name || 'Participant'} is now a host.`
          });
          break;
          
        case 'demote':
          await call.updateUserPermissions({
            user_id: participant.userId,
            role: 'participant'
          });
          toast({
            title: "Host demoted",
            description: `${participant.name || 'Host'} is now a regular participant.`
          });
          break;
          
        case 'remove':
          await call.removeUser(participant.userId);
          toast({
            title: "Participant removed",
            description: `${participant.name || 'Participant'} has been removed from the meeting.`
          });
          break;
      }
      
      // Track successful completion
      analytics.trackWebinarEvent(
        WebinarEvent.PARTICIPANT_MANAGEMENT, 
        { 
          meetingId: callId,
          action,
          targetUserId: participant.userId,
          success: true,
          userId: user?.id
        }
      );
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      
      // Track error
      analytics.trackError(
        error instanceof Error ? error : new Error(String(error)),
        'ParticipantManagement',
        { 
          meetingId: callId, 
          action, 
          targetUserId: participant.userId 
        }
      );
      
      toast({
        title: "Action failed",
        description: `Could not ${action} participant. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  // Handle permission request response
  const handlePermissionResponse = async (userId: string, permission: string, approved: boolean) => {
    if (!call || !isHost) return;
    
    setIsActionLoading(true);
    
    try {
      if (approved) {
        await call.grantPermissions({
          user_id: userId,
          permissions: [permission]
        });
        
        toast({
          title: "Permission granted",
          description: `Permission to ${permission === 'send-audio' ? 'speak' : 'share video'} was granted.`
        });
      } else {
        // Deny permission by not granting it and notifying the user
        toast({
          title: "Permission denied",
          description: `Permission request was denied.`
        });
      }
      
      // Remove from requests queue
      setPermissionRequests(prev => 
        prev.filter(req => !(req.userId === userId && req.permission === permission))
      );
      
    } catch (error) {
      console.error("Error handling permission request:", error);
      toast({
        title: "Error",
        description: "Could not process permission request.",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Don't show management UI if user isn't a host
  if (!isHost) return null;

  return (
    <div className="bg-dark-1 rounded-lg p-4 text-white">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Participant Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            placeholder="Search participants..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-dark-3 border-dark-4 text-white"
          />
        </div>
      </div>

      {/* Permission requests section */}
      {permissionRequests.length > 0 && (
        <div className="mb-4 p-3 bg-dark-3 rounded-lg border border-yellow-500/30">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <HandRaised size={16} className="text-yellow-500" />
            Permission Requests
          </h3>
          <div className="space-y-2">
            {permissionRequests.map((request, index) => (
              <div key={`${request.userId}-${request.permission}-${index}`} className="flex items-center justify-between bg-dark-4 p-2 rounded">
                <span className="text-sm">
                  {request.userName} requests to {request.permission === 'send-audio' ? 'speak' : 'share video'}
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 border-red-500/50 hover:bg-red-500/20"
                    onClick={() => handlePermissionResponse(request.userId, request.permission, false)}
                    disabled={isActionLoading}
                  >
                    Deny
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 border-green-500/50 hover:bg-green-500/20"
                    onClick={() => handlePermissionResponse(request.userId, request.permission, true)}
                    disabled={isActionLoading}
                  >
                    Allow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants list */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {searchQuery ? 'No participants found' : 'No participants in the meeting'}
            </div>
          ) : (
            filteredParticipants.map((participant) => {
              const isCurrentUser = participant.userId === user?.id;
              const isParticipantHost = participant.roles?.includes('host');
              const isMuted = participant.trackMutedByName?.get('microphone') || !participant.publishedTracks.audio;
              const hasVideoOff = participant.trackMutedByName?.get('camera') || !participant.publishedTracks.video;
              
              return (
                <div 
                  key={participant.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser ? 'bg-dark-4/50 border border-sky-500/30' : 'bg-dark-3'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-dark-4 flex items-center justify-center overflow-hidden">
                        {participant.image ? (
                          <img 
                            src={participant.image} 
                            alt={participant.name || 'Participant'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-lg font-semibold">
                            {(participant.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isParticipantHost && (
                        <div className="absolute -top-1 -right-1 bg-blue-1 rounded-full p-1">
                          <Shield size={12} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {participant.name || 'Unnamed Participant'}
                        {isCurrentUser && <span className="text-xs text-sky-400">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        {isMuted ? (
                          <MicOff size={12} className="text-red-500" />
                        ) : (
                          <Mic size={12} className="text-green-500" />
                        )}
                        {hasVideoOff ? (
                          <VideoOff size={12} className="text-red-500" />
                        ) : (
                          <Video size={12} className="text-green-500" />
                        )}
                        <span>
                          {isParticipantHost 
                            ? 'Host' 
                            : participant.roles?.includes('participant') 
                              ? 'Participant' 
                              : 'Guest'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleParticipantAction(isMuted ? 'unmute' : 'mute', participant)}
                              disabled={isActionLoading}
                            >
                              {isMuted ? (
                                <Mic size={16} className="text-gray-400" />
                              ) : (
                                <MicOff size={16} className="text-gray-400" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {isMuted ? 'Unmute participant' : 'Mute participant'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-dark-4"
                          >
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-dark-2 border-dark-4 text-white">
                          {isWebinarMode && (
                            <>
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-dark-3"
                                onClick={() => handleParticipantAction('grantAudio', participant)}
                              >
                                <Mic className="mr-2 h-4 w-4" />
                                Grant Audio Permission
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-dark-3"
                                onClick={() => handleParticipantAction('grantVideo', participant)}
                              >
                                <Video className="mr-2 h-4 w-4" />
                                Grant Video Permission
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-dark-4" />
                            </>
                          )}
                          
                          {isParticipantHost ? (
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-dark-3 text-yellow-400"
                              onClick={() => handleParticipantAction('demote', participant)}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Demote from Host
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-dark-3 text-blue-400"
                              onClick={() => handleParticipantAction('promote', participant)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Promote to Host
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator className="bg-dark-4" />
                          
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-dark-3 text-red-400"
                            onClick={() => handleParticipantAction('remove', participant)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove from Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-dark-2 text-white border-dark-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {pendingAction?.action === 'remove' && (
                "Are you sure you want to remove this participant from the meeting? They will not be able to rejoin without a new invitation."
              )}
              {pendingAction?.action === 'promote' && (
                "Are you sure you want to promote this participant to host? They will have full control over the meeting, including managing other participants."
              )}
              {pendingAction?.action === 'demote' && (
                "Are you sure you want to demote this host to a regular participant? They will lose their host privileges."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingAction(null);
              }}
              className="border-dark-4"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingAction) {
                  executeParticipantAction(pendingAction.action, pendingAction.participant);
                }
              }}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParticipantManagement;
