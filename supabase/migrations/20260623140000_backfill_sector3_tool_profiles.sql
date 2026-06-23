-- Backfill Sector 3 tool profiles for existing auth.users (Signal Desk, GapScan, BridgeAI)

INSERT INTO public.signaldesk_profiles (id, email, tier, signals_used_this_month, signals_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.signaldesk_profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.gapscan_profiles (id, email, tier, scans_used_this_month, scans_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.gapscan_profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.bridgeai_profiles (id, email, tier, workflows_used_this_month, workflows_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.bridgeai_profiles p ON p.id = u.id
WHERE p.id IS NULL;
