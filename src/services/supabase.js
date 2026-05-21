import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. The application will run in LocalStorage-only fallback mode.",
  );
}

// In case Supabase variables are not configured, we export null and handle it in the store
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
