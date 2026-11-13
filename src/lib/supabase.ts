import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until both environment variables are set (see README). */
export const isConfigured = Boolean(url && key);

export const SUPABASE_URL = (url ?? 'https://placeholder.supabase.co').replace(/\/+$/, '');
export const SUPABASE_KEY = key ?? 'placeholder-anon-key';
export const BUCKET = 'academic-resources';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
