import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing PUBLIC_SUPABASE_URL/PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  return client;
}
