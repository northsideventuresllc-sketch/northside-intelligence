-- Persist ReplyFlow generated replies so users can revisit their work.

CREATE TABLE IF NOT EXISTS public.replyflow_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_message text NOT NULL,
  tone text NOT NULL,
  scenario text NOT NULL,
  generated_reply text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS replyflow_replies_user_created_idx
  ON public.replyflow_replies(user_id, created_at DESC);

ALTER TABLE public.replyflow_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own replyflow replies"
  ON public.replyflow_replies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own replyflow replies"
  ON public.replyflow_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own replyflow replies"
  ON public.replyflow_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Store last-used preferences on the profile for continuity across sessions.
ALTER TABLE public.replyflow_profiles
  ADD COLUMN IF NOT EXISTS last_tone text,
  ADD COLUMN IF NOT EXISTS last_scenario text;
