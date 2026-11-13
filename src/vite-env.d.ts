/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MAX_PDF_MB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
