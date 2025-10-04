import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseConfig } from "./config";

export const createClient = () => {
  const { url, anonKey } = assertSupabaseConfig();
  return createBrowserClient(url, anonKey);
};
