import type { NextRequest } from '../../lib/next';
import { NextResponse } from '../../lib/next';
import { readSupabaseConfig, type SupabaseConfig } from './config';

interface SupabaseSessionPayload {
  data: {
    session: unknown;
  } | null;
}

interface SupabaseAuthClient {
  getSession(): Promise<SupabaseSessionPayload>;
}

interface SupabaseClient {
  auth: SupabaseAuthClient;
}

class MockSupabaseAuthClient implements SupabaseAuthClient {
  constructor(private readonly config: SupabaseConfig) {}

  async getSession(): Promise<SupabaseSessionPayload> {
    return {
      data: {
        session: this.config,
      },
    };
  }
}

class MockSupabaseClient implements SupabaseClient {
  readonly auth: SupabaseAuthClient;

  constructor(config: SupabaseConfig) {
    this.auth = new MockSupabaseAuthClient(config);
  }
}

export interface SupabaseMiddlewareClient {
  response: NextResponse;
  supabase: SupabaseClient;
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
): SupabaseMiddlewareClient | NextResponse {
  const config = readSupabaseConfig();

  if (!config) {
    return NextResponse.next();
  }

  // Reference the request URL so lint rules treat it as used.
  void request.url;

  const response = NextResponse.next();
  const supabase = new MockSupabaseClient(config);

  return {
    response,
    supabase,
  };
}
