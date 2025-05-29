// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';
import { env, isProduction } from '@/lib/env';

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust sampling rates for server monitoring
  // Lower in production to reduce overhead
  tracesSampleRate: isProduction ? 0.2 : 1.0,
  
  // Only enable in production to avoid noise in development
  enabled: isProduction,
  
  // Capture Next.js API routes and server components
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Prisma(),
    new Sentry.Integrations.Node(),
  ],

  // Performance monitoring for API routes
  tracePropagationTargets: [
    'localhost', 
    /^https:\/\/roasflow\.com/,
    /^https:\/\/api\.roasflow\.com/,
  ],
  
  // Adjust this to control the events that get filtered out
  ignoreErrors: [
    // Common server-side errors to ignore
    'SequelizeConnectionError',
    'SequelizeConnectionRefusedError',
    'SequelizeHostNotFoundError',
    'SequelizeHostNotReachableError',
    'SequelizeInvalidConnectionError',
    'SequelizeConnectionTimedOutError',
    'TimeoutError',
    // Stream.io specific errors that might be transient
    'StreamVideoError',
    'StreamConnectionError',
  ],
  
  // Set the release version for better tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Set environment
  environment: env.NODE_ENV,
  
  // Configure breadcrumbs
  maxBreadcrumbs: 50,
  
  // Before sending an event to Sentry
  beforeSend(event, hint) {
    // Don't send events in development
    if (!isProduction) {
      return null;
    }
    
    // Check if it is an exception, and if so, show it in the console for easier debugging
    if (event.exception) {
      console.error('[Server] Sentry captured exception:', 
        hint.originalException || hint.syntheticException
      );
    }
    
    // Filter out specific error types or add custom logic
    const error = hint.originalException as Error;
    if (error && error.name === 'NotFoundError') {
      // Don't report 404 errors to Sentry
      return null;
    }
    
    // Add additional server context
    event.tags = {
      ...event.tags,
      server: true,
      nodeVersion: process.version,
      serverName: process.env.VERCEL_REGION || process.env.SERVER_NAME || 'unknown',
    };
    
    return event;
  },
  
  // Configure HTTP request data capturing
  // Be careful not to include sensitive data
  beforeBreadcrumb(breadcrumb, hint) {
    // For HTTP requests, remove authorization and other sensitive headers
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      // Clone the data to avoid modifying the original object
      const data = { ...breadcrumb.data };
      
      // Remove sensitive headers
      if (data.headers) {
        const headers = { ...data.headers };
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'set-cookie',
          'x-auth-token',
          'x-api-key',
        ];
        
        sensitiveHeaders.forEach(header => {
          if (headers[header]) {
            headers[header] = '[Filtered]';
          }
        });
        
        data.headers = headers;
      }
      
      // Remove request/response bodies as they might contain sensitive data
      if (data.body) {
        data.body = '[Filtered]';
      }
      
      breadcrumb.data = data;
    }
    
    return breadcrumb;
  },
});

// Set server name for better identification in Sentry
Sentry.setTags({
  serverName: process.env.VERCEL_REGION || process.env.SERVER_NAME || 'unknown',
  deploymentType: process.env.VERCEL ? 'vercel' : 'custom',
});

// Export Sentry to be used in API routes and server components
export { Sentry };
