'use client';

import { useState } from 'react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';

interface WebinarModeToggleProps {
  isWebinar: boolean;
  setIsWebinar: (value: boolean) => void;
}

const WebinarModeToggle = ({ isWebinar, setIsWebinar }: WebinarModeToggleProps) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-sky-500 bg-dark-3 p-4 text-white">
      <div className="flex items-center gap-2">
        <Label htmlFor="webinar-mode" className="text-base font-medium text-white cursor-pointer">
          Webinar Mode
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-sky-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-dark-2 text-white border border-sky-500">
              <p>
                In webinar mode, only the host can use audio and video by default. The host can grant
                permission to specific participants.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700 cursor-pointer" onClick={() => setIsWebinar(!isWebinar)}>
        <span className={`${isWebinar ? 'translate-x-6 bg-sky-500' : 'translate-x-1 bg-gray-400'} inline-block h-4 w-4 transform rounded-full transition-transform`} />
        <Switch
          id="webinar-mode"
          checked={isWebinar}
          onCheckedChange={setIsWebinar}
          className="sr-only" // Hide the actual switch but keep it accessible
        />
      </div>
    </div>
  );
};

export default WebinarModeToggle;
