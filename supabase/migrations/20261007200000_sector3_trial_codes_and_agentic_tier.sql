-- Migration: 20261007200000_sector3_trial_codes_and_agentic_tier.sql
-- Description: Unique 7-Day Free Trial Code Access System and automatic downgrade for Sector 3 IT Tools

CREATE TABLE IF NOT EXISTS public.trial_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tool_slug text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  duration_days integer NOT NULL DEFAULT 7,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text DEFAULT 'outreach',
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trial_codes_code ON public.trial_codes (code);
CREATE INDEX IF NOT EXISTS idx_trial_codes_user_id ON public.trial_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_trial_codes_expires_at ON public.trial_codes (expires_at);

ALTER TABLE public.trial_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trial_codes' AND policyname = 'Users can view their own redeemed trial codes'
  ) THEN
    CREATE POLICY "Users can view their own redeemed trial codes"
      ON public.trial_codes
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Update expire_ni_entitlements to include trial downgrades to free baseline
CREATE OR REPLACE FUNCTION public.expire_ni_entitlements()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.ni_toolkit tk
  WHERE tk.access_type IN ('tool_subscription', 'ni_plan')
    AND tk.expires_at IS NOT NULL
    AND tk.expires_at < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );

  UPDATE public.ni_subscriptions ns
  SET
    tier = 'free',
    billing_interval = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE ns.tier != 'free'
    AND ns.current_period_end IS NOT NULL
    AND ns.current_period_end + interval '48 hours' < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = ns.id
        AND p.is_master_account = true
    );

  DELETE FROM public.ni_toolkit tk
  USING public.ni_subscriptions ns
  WHERE tk.user_id = ns.id
    AND tk.access_type = 'ni_plan'
    AND ns.tier = 'free'
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );

  -- Downgrade expired tool subscriptions AND expired trials to free tier baseline
  UPDATE public.ni_toolkit tk
  SET
    access_type = 'free',
    expires_at = NULL,
    stripe_subscription_id = NULL,
    unlimited_assigned_at = NULL,
    updated_at = now()
  WHERE (tk.access_type = 'tool_subscription' OR tk.access_type = 'trial')
    AND tk.expires_at IS NOT NULL
    AND tk.expires_at < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );
END;
$function$;

-- Atomic single-use redemption RPC
CREATE OR REPLACE FUNCTION public.redeem_trial_code(
  p_code text,
  p_user_id uuid,
  p_tool_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code_record record;
  v_target_slug text;
  v_expires_at timestamp with time zone;
  v_slugs text[];
  v_slug text;
BEGIN
  p_code := UPPER(TRIM(p_code));
  
  SELECT * INTO v_code_record
  FROM public.trial_codes
  WHERE UPPER(code) = p_code
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid trial code.');
  END IF;
  
  IF v_code_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This trial code has already been redeemed.');
  END IF;
  
  IF v_code_record.tool_slug IS NOT NULL AND v_code_record.tool_slug != 'all' AND p_tool_slug IS NOT NULL THEN
    IF LOWER(v_code_record.tool_slug) != LOWER(p_tool_slug) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'This trial code is only valid for ' || v_code_record.tool_slug || '.'
      );
    END IF;
  END IF;

  v_expires_at := now() + (COALESCE(v_code_record.duration_days, 7) || ' days')::interval;

  UPDATE public.trial_codes
  SET
    used_at = now(),
    user_id = p_user_id,
    expires_at = v_expires_at,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{redeemed_for_tool}',
      to_jsonb(COALESCE(p_tool_slug, v_code_record.tool_slug, 'all'))
    )
  WHERE id = v_code_record.id;

  IF v_code_record.tool_slug = 'all' OR (v_code_record.tool_slug IS NULL AND (p_tool_slug IS NULL OR p_tool_slug = 'all')) THEN
    v_slugs := ARRAY['replyflow', 'grantbot', 'signaldesk', 'gapscan', 'bridgeai'];
  ELSE
    v_target_slug := LOWER(COALESCE(p_tool_slug, v_code_record.tool_slug));
    v_slugs := ARRAY[v_target_slug];
  END IF;

  FOREACH v_slug IN ARRAY v_slugs
  LOOP
    INSERT INTO public.ni_toolkit (user_id, tool_slug, access_type, expires_at, purchased_at, updated_at)
    VALUES (p_user_id, v_slug, 'trial', v_expires_at, now(), now())
    ON CONFLICT (user_id, tool_slug)
    DO UPDATE SET
      access_type = 'trial',
      expires_at = v_expires_at,
      updated_at = now();
      
    IF v_slug = 'replyflow' THEN
      INSERT INTO public.replyflow_profiles (id, plan, replies_used_this_month, replies_reset_at)
      VALUES (p_user_id, 'core', 0, now())
      ON CONFLICT (id) DO UPDATE SET plan = 'core';
    ELSIF v_slug = 'grantbot' THEN
      INSERT INTO public.grantbot_profiles (id, tier, grants_used_this_month, grants_reset_at)
      VALUES (p_user_id, 'pro', 0, now())
      ON CONFLICT (id) DO UPDATE SET tier = 'pro';
    ELSIF v_slug = 'signaldesk' THEN
      INSERT INTO public.signaldesk_profiles (id, tier, signals_used_this_month, signals_reset_at)
      VALUES (p_user_id, 'pro', 0, now())
      ON CONFLICT (id) DO NOTHING;
    ELSIF v_slug = 'gapscan' THEN
      INSERT INTO public.gapscan_profiles (id, tier, scans_used_this_month, scans_reset_at)
      VALUES (p_user_id, 'pro', 0, now())
      ON CONFLICT (id) DO NOTHING;
    ELSIF v_slug = 'bridgeai' THEN
      INSERT INTO public.bridgeai_profiles (id, tier, workflows_used_this_month, workflows_reset_at)
      VALUES (p_user_id, 'pro', 0, now())
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'code', p_code,
    'tools', v_slugs,
    'expires_at', v_expires_at,
    'duration_days', COALESCE(v_code_record.duration_days, 7)
  );
END;
$function$;
