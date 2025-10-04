import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabaseConfig } from "./config";

type CookieStore = ReturnType<typeof cookies> & {
  set?: (name: string, value: string, options?: CookieOptions) => void;
};

export const createClient = (cookieStore: CookieStore) => {
  const { url, anonKey } = assertSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set?.(name, value, options as CookieOptions | undefined)
          );
        } catch (error) {
          // Pemanggilan dari Server Component tidak mendukung penulisan cookie.
          // Session akan diperbarui oleh middleware.
          console.warn("Gagal menyetel cookie Supabase dari Server Component.", error);
        }
      },
    },
  });
};
