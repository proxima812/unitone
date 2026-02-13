import { createClient } from "@supabase/supabase-js";
import { env, getRequiredEnv } from "@/lib/env";

export function getSupabaseServerClient() {
  const url = env.supabaseUrl || getRequiredEnv("PUBLIC_SUPABASE_URL");
  const key = env.supabaseServiceRoleKey || env.supabaseAnonKey || getRequiredEnv("PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
