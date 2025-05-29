// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';
import { env, isProduction } from '@/lib/env';

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: isProduction ? 0.1 : 1.0,

  // Only enable in production to avoid noise in development
  enabled: isProduction,
  
  // Capture Next.js data
  integrations: [
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost', 
        /^https:\/\/roasflow\.com/,
        /^https:\/\/api\.roasflow\.com/,
      ],
    }),
    new Sentry.Replay({
      // Additional replay configuration
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capture Replay for errors and sessions
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
  replaysOnErrorSampleRate: isProduction ? 1.0 : 1.0,
  
  // Adjust this to control the events that get filtered out
  ignoreErrors: [
    // Common browser extensions errors
    /extensions\//i,
    /^chrome:\/\//i,
    // Random plugins/extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268/how-to-stop-javascript-injection-from-vodafone-proxy
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    'conduitPage',
    // Generic error code from errors outside the security sandbox
    'Script error.',
    // Avast extension error
    '_avast_submit',
  ],
  
  // Silence specific URLs from triggering errors
  denyUrls: [
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
  ],

  // Set the release version for better tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Set environment
  environment: env.NODE_ENV,
  
  // Configure breadcrumbs
  maxBreadcrumbs: 50,
  
  // Before sending an event to Sentry, this function can modify it or return null to drop it
  beforeSend(event, hint) {
    // Don't send events in development
    if (!isProduction) {
      return null;
    }
    
    // Check if it is an exception, and if so, show it in the console for easier debugging
    if (event.exception) {
      console.error('Sentry captured exception:', hint.originalException || hint.syntheticException);
    }
    
    // Add additional context based on the event
    if (typeof window !== 'undefined') {
      event.tags = {
        ...event.tags,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        locale: navigator.language,
      };
    }
    
    return event;
  },
  
  // Hook into the error handler to get more context
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb;
  },
});

// Set user information when available
export const identifyUser = (user: { id: string; email?: string; name?: string }) => {
  if (!user?.id) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

// Clear user on logout
export const clearUserIdentity = () => {
  Sentry.setUser(null);
};
