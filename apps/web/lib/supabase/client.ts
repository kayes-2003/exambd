"use client";
import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client — uses the public anon key only.
// RLS policies (see supabase/migrations/0001_init.sql) are what actually keep this safe;
// the anon key alone grants no special access.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
