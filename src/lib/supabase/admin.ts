import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client for server jobs that run without a signed-in user (the scheduled YouTube
 * sync). It bypasses RLS, so it is used only after the caller has been authorised — by the cron
 * secret or by a team session with publish rights. Never import this into client code.
 */
export function createSupabaseServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicEnv.supabaseUrl || !key) return null;
  return createClient(publicEnv.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
