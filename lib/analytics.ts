/**
 * analytics.ts
 * 
 * Simplified analytics utility for RoasFlow video conferencing application.
 * This version only logs to console for development purposes.
 */

// Import environment utilities
import { env } from '@/lib/env';

// Define event categories for better organization
export enum EventCategory {
  MEETING = 'meeting',
  USER = 'user',
  MEDIA = 'media',
  NAVIGATION = 'navigation',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  RECORDING = 'recording',
  WEBINAR = 'webinar',
}

// Define event actions for type safety
export enum MeetingEvent {
  CREATE = 'create',
  JOIN = 'join',
  LEAVE = 'leave',
  END = 'end',
  SCHEDULE = 'schedule',
  CANCEL = 'cancel',
  INVITE = 'invite',
  SHARE_LINK = 'share_link',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
}

export enum MediaEvent {
  CAMERA_TOGGLE = 'camera_toggle',
  MIC_TOGGLE = 'mic_toggle',
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_STOP = 'screen_share_stop',
  DEVICE_CHANGE = 'device_change',
  LAYOUT_CHANGE = 'layout_change',
}

export enum RecordingEvent {
  START = 'start',
  STOP = 'stop',
  DOWNLOAD = 'download',
  SHARE = 'share',
  VIEW = 'view',
}

export enum WebinarEvent {
  MODE_TOGGLE = 'mode_toggle',
  MODE_DETECTED = 'mode_detected',
  PARTICIPANT_MANAGEMENT = 'participant_management',
  QUESTION_ASKED = 'question_asked',
  QUESTION_ANSWERED = 'question_answered',
  POLL_CREATED = 'poll_created',
  POLL_VOTED = 'poll_voted',
  POLL_ENDED = 'poll_ended',
}

export enum PerformanceEvent {
  TIME_TO_INTERACTIVE = 'time_to_interactive',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT = 'largest_contentful_paint',
  FIRST_INPUT_DELAY = 'first_input_delay',
  CUMULATIVE_LAYOUT_SHIFT = 'cumulative_layout_shift',
  CALL_SETUP_TIME = 'call_setup_time',
  CALL_QUALITY = 'call_quality',
  VIDEO_FREEZE = 'video_freeze',
  AUDIO_ISSUE = 'audio_issue',
}

// Define event properties types for better type checking
export interface MeetingEventProperties {
  meetingId?: string;
  meetingType?: 'instant' | 'scheduled' | 'personal_room';
  duration?: number;
  participantCount?: number;
  hasVideo?: boolean;
  hasAudio?: boolean;
  hasScreenShare?: boolean;
  isRecording?: boolean;
  isWebinar?: boolean;
  startTime?: string;
  endTime?: string;
  [key: string]: any;
}

export interface MediaEventProperties {
  deviceType?: 'camera' | 'microphone' | 'speaker' | 'screen';
  deviceId?: string;
  deviceName?: string;
  enabled?: boolean;
  resolution?: string;
  [key: string]: any;
}

export interface PerformanceEventProperties {
  value: number;
  unit?: 'ms' | 'score' | 'percent' | 'count';
  browser?: string;
  os?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  [key: string]: any;
}

export interface UserEventProperties {
  userId?: string;
  userRole?: 'host' | 'participant' | 'guest';
  [key: string]: any;
}

export interface ErrorEventProperties {
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  componentName?: string;
  [key: string]: any;
}

// Main analytics class
class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};

  constructor() {
    // Only enable in development or if explicitly configured
    this.isEnabled = true;
  }

  /**
   * Initialize analytics with user information
   */
  public init(userId?: string, userProperties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    if (userId) {
      this.userId = userId;
      this.setUserProperties(userProperties || {});
    }

    // Track initial page view
    this.trackPageView();
  }

  /**
   * Set user properties for all future events
   */
  public setUserProperties(properties: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    this.userProperties = {
      ...this.userProperties,
      ...properties,
    };

    console.log('[Analytics] Set user properties:', this.userProperties);
  }

  /**
   * Track page view with optional custom properties
   */
  public trackPageView(properties: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    
    this.trackEvent({
      category: EventCategory.NAVIGATION,
      action: 'page_view',
      label: pathname,
      properties: {
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        title: typeof document !== 'undefined' ? document.title : '',
        ...properties,
      },
    });
  }

  /**
   * Track meeting events
   */
  public trackMeetingEvent(
    action: MeetingEvent,
    properties: MeetingEventProperties = {}
  ): void {
    if (!this.isEnabled) return;

    this.trackEvent({
      category: EventCategory.MEETING,
      action,
      label: properties.meetingId || '',
      properties,
    });
  }

  /**
   * Track media events (camera, mic, screen share)
   */
  public trackMediaEvent(
    action: MediaEvent,
    properties: MediaEventProperties = {}
  ): void {
    if (!this.isEnabled) return;

    this.trackEvent({
      category: EventCategory.MEDIA,
      action,
      label: properties.deviceType || '',
      properties,
    });
  }

  /**
   * Track recording events
   */
  public trackRecordingEvent(
    action: RecordingEvent,
    properties: MeetingEventProperties = {}
  ): void {
    if (!this.isEnabled) return;

    this.trackEvent({
      category: EventCategory.RECORDING,
      action,
      label: properties.meetingId || '',
      properties,
    });
  }

  /**
   * Track webinar-specific events
   */
  public trackWebinarEvent(
    action: WebinarEvent,
    properties: MeetingEventProperties = {}
  ): void {
    if (!this.isEnabled) return;

    this.trackEvent({
      category: EventCategory.WEBINAR,
      action,
      label: properties.meetingId || '',
      properties,
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    action: PerformanceEvent,
    properties: PerformanceEventProperties
  ): void {
    if (!this.isEnabled) return;

    this.trackEvent({
      category: EventCategory.PERFORMANCE,
      action,
      label: `${properties.value}${properties.unit || ''}`,
      properties,
    });
  }

  /**
   * Track errors
   */
  public trackError(error: Error, componentName?: string, additionalData?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const properties: ErrorEventProperties = {
      errorMessage: error.message,
      errorStack: error.stack,
      componentName,
      ...additionalData,
    };

    this.trackEvent({
      category: EventCategory.ERROR,
      action: 'error',
      label: componentName ? `${componentName}: ${error.message}` : error.message,
      properties,
    });

    // Also log to console for easier debugging
    console.error('[Analytics] Error:', error);
  }

  /**
   * Generic event tracking method
   */
  private trackEvent({
    category,
    action,
    label = '',
    properties = {},
  }: {
    category: EventCategory;
    action: string;
    label?: string;
    properties?: Record<string, any>;
  }): void {
    if (!this.isEnabled) return;

    // Combine with user properties
    const eventProperties = {
      ...this.userProperties,
      ...properties,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    };

    // Log to console
    console.log(`[Analytics] ${category} > ${action} > ${label}`, eventProperties);
  }

  /**
   * Track video call quality metrics
   */
  public trackCallQuality(meetingId: string, metrics: {
    jitter?: number;
    packetsLost?: number;
    roundTripTime?: number;
    audioLevel?: number;
    frameRate?: number;
    resolution?: string;
  }): void {
    if (!this.isEnabled) return;

    this.trackPerformance(PerformanceEvent.CALL_QUALITY, {
      value: metrics.packetsLost || 0,
      unit: 'count',
      meetingId,
      ...metrics,
    });
  }

  /**
   * Track call setup time (time from clicking join to being in the call)
   */
  public trackCallSetupTime(meetingId: string, setupTimeMs: number): void {
    if (!this.isEnabled) return;

    this.trackPerformance(PerformanceEvent.CALL_SETUP_TIME, {
      value: setupTimeMs,
      unit: 'ms',
      meetingId,
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export default instance
export default analytics;
