/**
 * Server-side Supabase client
 * Uses SUPABASE_API_KEY for backend operations (bypasses RLS)
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/database.types';

/**
 * Validate required environment variables
 */
function validateEnv(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_API_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!supabaseKey) {
    throw new Error('Missing SUPABASE_API_KEY environment variable');
  }

  return { supabaseUrl, supabaseKey };
}

/**
 * Create a server-side Supabase client
 * This client uses the secret key and bypasses RLS policies
 */
export function createServerClient() {
  const { supabaseUrl, supabaseKey } = validateEnv();

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Get a singleton server Supabase client
 */
let serverClientInstance: ReturnType<typeof createServerClient> | null = null;

export function getSupabaseClient() {
  if (!serverClientInstance) {
    serverClientInstance = createServerClient();
  }
  return serverClientInstance;
}
