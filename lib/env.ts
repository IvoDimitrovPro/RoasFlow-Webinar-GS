import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  
  // Stream.io Video
  NEXT_PUBLIC_STREAM_API_KEY: z.string().min(1, 'Stream API key is required'),
  STREAM_SECRET_KEY: z.string().min(1, 'Stream secret key is required'),
  
  // Analytics and Monitoring (optional for now)
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Feature Flags (optional for now)
  NEXT_PUBLIC_ENABLE_RECORDINGS: z.string().optional().transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_WEBINAR_MODE: z.string().optional().transform(val => val === 'true'),
});

/**
 * Validate environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path}: ${err.message}`).join('\n  ');
      
      throw new Error(
        `❌ Invalid or missing environment variables:\n  ${missingVars}\n` +
        `Please check your .env file or environment configuration.`
      );
    }
    
    throw error;
  }
}

/**
 * Validated environment variables
 */
export const env = validateEnv();

/**
 * Type definition for environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if we're in a production environment
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in a development environment
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in a test environment
 */
export const isTest = env.NODE_ENV === 'test';
