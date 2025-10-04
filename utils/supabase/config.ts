export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const getEnv = (name: string) => {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : null;
};

export const readSupabaseConfig = (): SupabaseConfig | null => {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

export const assertSupabaseConfig = (): SupabaseConfig => {
  const config = readSupabaseConfig();

  if (!config) {
    throw new Error(
      "Environment Supabase belum lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY terisi."
    );
  }

  return config;
};

export const isSupabaseConfigured = () => readSupabaseConfig() !== null;
