/**
 * StreamPass venture hub — NI-Brain reads for AXON operator page.
 * Sector 1B / theNIlabs. Read-only monitoring — no writes, no external calls.
 * Per locked spec (AXON as Admin Portal — JB Architecture, 2026-07-09):
 * `/ventures/streampass` shows build status, domain, cron health.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NI_BRAIN_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kxijunwgbrlfzvgkhklo.supabase.co';

function sb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export type StreamPassHubSnapshot = {
  profiles: number;
  trackedTitles: number;
  watchRooms: number;
  watchlistRows: number;
  hasAppRoute: boolean;
};

/**
 * Everything here is a live count from the streampass_* tables — no invented
 * metrics. `hasAppRoute` is hardcoded false because there is no /streampass
 * app route in this repo yet (confirmed 2026-08-13, NI Repo Agent) — schema
 * exists, product UI does not.
 */
export async function fetchStreamPassHub(): Promise<StreamPassHubSnapshot> {
  const client = sb();

  const [{ count: profiles }, { count: trackedTitles }, { count: watchRooms }, { count: watchlistRows }] =
    await Promise.all([
      client.from('streampass_profiles').select('id', { count: 'exact', head: true }),
      client.from('streampass_tracked_titles').select('id', { count: 'exact', head: true }),
      client.from('streampass_watch_rooms').select('id', { count: 'exact', head: true }),
      client.from('streampass_watchlist').select('id', { count: 'exact', head: true }),
    ]);

  return {
    profiles: profiles ?? 0,
    trackedTitles: trackedTitles ?? 0,
    watchRooms: watchRooms ?? 0,
    watchlistRows: watchlistRows ?? 0,
    hasAppRoute: false,
  };
}
