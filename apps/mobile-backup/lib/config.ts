import Constants from 'expo-constants'

// Try to get environment variables from multiple sources
const getEnvVar = (key: string): string | undefined => {
  // Try process.env first
  if (process.env[key]) {
    return process.env[key]
  }
  
  // Try expo constants (works in development and production)
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key]
  }
  
  // For development, try accessing from __DEV__ globals
  if (__DEV__ && (global as any).__DEV_ENV__?.[key]) {
    return (global as any).__DEV_ENV__[key]
  }
  
  return undefined
}

export const config = {
  supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL') || 'https://eboaupdriwdsixnmslxz.supabase.co',
  supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVib2F1cGRyaXdkc2l4bm1zbHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjc5MzMsImV4cCI6MjA2MTY0MzkzM30.0citArLpidYi19hSdUeYe4JGRRBJHwSb8Alh5QkUEec'
}

// Validation
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    supabaseUrl: !!config.supabaseUrl,
    supabaseAnonKey: !!config.supabaseAnonKey,
    processEnv: {
      url: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
      key: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  })
  throw new Error('Supabase configuration is required')
} 