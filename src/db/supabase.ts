import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * The one database client, and it is the service role.
 *
 * The browser never talks to Postgres (see the first migration): route
 * handlers do, as a trusted server. RLS denies every API role, and the service
 * role gets through because it bypasses RLS *and* holds explicit table grants.
 * `server-only` makes importing this from a client component a build error,
 * so the key cannot end up in a bundle by accident.
 */
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    // No user sessions exist here; don't try to persist or refresh one.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
