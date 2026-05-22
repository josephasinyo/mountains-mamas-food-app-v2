import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser/client-side usage.
 * Uses the anon key — respects Row Level Security policies.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
