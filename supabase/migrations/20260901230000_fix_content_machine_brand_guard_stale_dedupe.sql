-- Fix content_machine_brand_guard: exclude archived/soft-deleted rows from the
-- Match Fit redirect dedupe check.
--
-- This function existed live on the database (Supabase project kxijunwgbrlfzvgkhklo)
-- but was never checked into a tracked migration -- this file adds it to source
-- control for the first time, capturing the fixed version applied live 2026-09-01
-- (JB direct live order, this session).
--
-- Bug: the EXISTS check that decides whether a Match Fit slot (week_start/day_index/
-- post_type) has "already been generated" did not filter deleted_at, so once a
-- week's batch got archived (JB rejecting a bad AXON batch, 2026-08-31 22:52 UTC),
-- every later automated regeneration attempt for that same week silently no-op'd
-- forever -- it kept finding the archived row and concluding nothing needed to be
-- generated. Confirmed live via a throwaway diagnostic insert before and after this
-- fix (blocked before, landed after, for the same week_start/day_index/post_type).
--
-- Fix: add "and deleted_at is null" to the EXISTS check, so an archived/rejected
-- slot is treated as available again.

CREATE OR REPLACE FUNCTION public.content_machine_brand_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_week_start date;
  v_day_index int;
  v_post_type text;
  v_exists boolean;
begin
  if new.brand_slug = 'ni' or new.brand_slug in
    ('bridgeai','gapscan','grantbot','replyflow','signaldesk','ni-store','ni-webdesign') then
    return new;
  end if;

  if new.brand_slug = 'match-fit' then
    -- redirect: Match Fit content never lives in the NI Content Machine
    v_week_start := (date_trunc('week', coalesce(new.scheduled_at, now())))::date;
    v_day_index := coalesce(new.day_index,0);
    v_post_type := case when new.post_type in ('Carousel','Static','Video','Text') then new.post_type else 'Text' end;

    select exists(
      select 1 from match_fit_content_calendar_posts
      where week_start = v_week_start and day_index = v_day_index and post_type = v_post_type
        and deleted_at is null
    ) into v_exists;

    if not v_exists then
      insert into match_fit_content_calendar_posts
        (week_start, post_date, day_index, post_type, target_group, platforms, caption, visual_prompt,
         hashtags, media_url, media_status, status, theme, scheduled_at)
      values (
        v_week_start,
        v_week_start + v_day_index,
        v_day_index,
        v_post_type,
        coalesce(new.target_group,'Join the Team'),
        coalesce((select string_agg(x, ', ') from jsonb_array_elements_text(new.platforms) x),'Instagram'),
        coalesce(new.caption,''),
        new.visual_prompt,
        coalesce((select array_agg(h) from jsonb_array_elements_text(new.hashtags) h),'{}'),
        new.image_url,
        case when new.image_url is not null then 'ready' else 'none' end,
        'draft',
        new.theme_name,
        new.scheduled_at
      );
    end if;

    return null; -- swallow the insert into content_machine_posts
  end if;

  raise exception 'content_machine_posts only accepts brand_slug=ni or a registered NI product slug (got %)', new.brand_slug;
end $function$;
