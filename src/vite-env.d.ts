/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AI_PROVIDER: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENABLE_AI: string;
  readonly VITE_ENABLE_MARKETPLACE: string;
  readonly VITE_ENABLE_STUDY_GROUPS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
