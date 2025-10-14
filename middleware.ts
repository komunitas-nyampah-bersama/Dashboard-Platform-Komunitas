import type { NextRequest } from './lib/next';
import { NextResponse } from './lib/next';
import { createSupabaseMiddlewareClient } from './utils/supabase/middleware';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const result = createSupabaseMiddlewareClient(request);

  if (result instanceof NextResponse) {
    return result;
  }

  await result.supabase.auth.getSession();

  return result.response;
}
