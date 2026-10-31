export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
    name: import.meta.env.VITE_APP_NAME || 'CampOS',
  },
  ai: {
    provider: import.meta.env.VITE_AI_PROVIDER || '',
    enabled: import.meta.env.VITE_ENABLE_AI === 'true',
  },
  features: {
    marketplace: import.meta.env.VITE_ENABLE_MARKETPLACE !== 'false',
    studyGroups: import.meta.env.VITE_ENABLE_STUDY_GROUPS !== 'false',
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.anonKey && 
    config.supabase.url !== 'https://your-project.supabase.co');
}
