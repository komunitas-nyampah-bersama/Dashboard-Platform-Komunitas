import { type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  await supabase.auth.getSession();
  return response;
}
