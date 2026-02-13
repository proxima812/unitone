const isServer = typeof window === "undefined";
const envMap = import.meta.env as Record<string, string | undefined>;

function readEnv(name: string): string {
  if (isServer) return envMap[name] ?? "";
  return envMap[name] ?? "";
}

export function getRequiredEnv(name: string): string {
  const value = readEnv(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: readEnv("PUBLIC_SUPABASE_URL") || readEnv("URL"),
  supabaseAnonKey: readEnv("PUBLIC_SUPABASE_ANON_KEY") || readEnv("API"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  telegramBotToken: readEnv("TELEGRAM_BOT_TOKEN"),
  telegramBotUsername: readEnv("PUBLIC_TELEGRAM_BOT_USERNAME"),
  authSecret: readEnv("AUTH_SECRET") || readEnv("TELEGRAM_BOT_TOKEN"),
  authCookieName: readEnv("AUTH_COOKIE_NAME") || "u1_admin_session",
  telegramAuthMaxAgeSec: Number(readEnv("TELEGRAM_AUTH_MAX_AGE_SEC") || 600),
  supabaseArticlesTable: readEnv("SUPABASE_ARTICLES_TABLE") || "articles",
  supabaseAdminUsersTable: readEnv("SUPABASE_ADMIN_USERS_TABLE") || "admin_users",
};
