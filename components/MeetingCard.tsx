'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { cn, addToCalendar } from '@/lib/utils';
import { Button } from './ui/button';
import { avatarImages } from '@/constants';
import { useToast } from './ui/use-toast';

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  isInProgress?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  isRecording?: boolean;
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  isInProgress,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  isRecording,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Create a hidden anchor element for downloads
  useEffect(() => {
    if (!downloadLinkRef.current) {
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      downloadLinkRef.current = anchor;

      return () => {
        document.body.removeChild(anchor);
      };
    }
  }, []);

  // Function to trigger file download
  const downloadFile = () => {
    if (!downloadLinkRef.current || !link) return;

    try {
      const filename = title || 'recording.mp4';

      // Configure the anchor element
      downloadLinkRef.current.href = link;
      downloadLinkRef.current.download = `${filename}.mp4`;
      downloadLinkRef.current.target = '_blank';

      // Trigger the download
      downloadLinkRef.current.click();

      toast({
        title: 'Download started',
        description: 'Your recording is being downloaded',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Please try again or download manually',
      });
    }
  };

  return (
    <section className={cn(
      "flex min-h-[258px] w-full flex-col justify-between rounded-[14px] px-5 py-8 xl:max-w-[568px]",
      isInProgress ? "bg-dark-1 border border-green-500/30" : "bg-dark-1"
    )}>
      <article className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <Image src={icon} alt={isInProgress ? "in-progress" : "upcoming"} width={28} height={28} />
          {isInProgress && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
              In Progress
            </span>
          )}
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-base font-normal">{date}</p>
          </div>
        </div>
      </article>
      <article className={cn('flex justify-center relative', {})}>
        <div className="relative flex w-full max-sm:hidden">
          {avatarImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="attendees"
              width={40}
              height={40}
              className={cn('rounded-full', { absolute: index > 0 })}
              style={{ top: 0, left: index * 28 }}
            />
          ))}
          <div className="flex-center absolute left-[136px] size-10 rounded-full border-[5px] border-dark-3 bg-dark-4">
            +5
          </div>
        </div>
        {!isPreviousMeeting && (
          <div className="flex gap-2">
            <Button 
              onClick={handleClick} 
              className={cn(
                "rounded px-6", 
                isInProgress ? "bg-green-500 hover:bg-green-600" : "bg-blue-1"
              )}
            >
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: 'Link Copied',
                });
              }}
              className="bg-dark-4 px-6"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
              />
              &nbsp; Copy Link
            </Button>
            {isRecording ? (
              <Button
                onClick={downloadFile}
                className="bg-purple-1 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                <Image
                  src="/icons/download.svg" // Assuming there's a download icon, if not it will fall back
                  alt="download"
                  width={20}
                  height={20}
                  onError={(e) => {
                    // Fallback if download icon not found
                    e.currentTarget.src = "/icons/play.svg";
                  }}
                />
                &nbsp; Download
              </Button>
            ) : (
              <Button
                onClick={() => {
                  try {
                    // Parse the date string using a more robust method
                    const [datePart, timePart] = date.split(', ');
                    
                    // Extract day, month, year
                    const [day, month, year] = datePart.split('.');
                    
                    // Extract hour and minute
                    const [hour, minute] = timePart.split(':');
                    
                    // Create a valid date object (month is 0-indexed in JS)
                    const startDate = new Date(
                      parseInt(year), 
                      parseInt(month) - 1, 
                      parseInt(day), 
                      parseInt(hour), 
                      parseInt(minute)
                    );
                    
                    // Add one hour for end time
                    const endDate = new Date(startDate);
                    endDate.setHours(endDate.getHours() + 1);
                    
                    addToCalendar({
                      title,
                      description: 'Meeting',
                      startTime: startDate.toISOString(),
                      endTime: endDate.toISOString(),
                      link,
                    });
                  } catch (error) {
                    console.error('Error adding to calendar:', error);
                    toast({
                      title: 'Error adding to calendar',
                      description: 'Please try again or add manually.',
                    });
                  }
                }}
                className="bg-purple-1 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Add to Calendar
              </Button>
            )}
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
