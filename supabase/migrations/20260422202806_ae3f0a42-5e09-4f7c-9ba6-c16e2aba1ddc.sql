CREATE TABLE public.avatar_upload_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status_code integer,
  error_message text,
  file_name text,
  file_size bigint,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avatar_upload_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own avatar_upload_errors"
  ON public.avatar_upload_errors FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own avatar_upload_errors"
  ON public.avatar_upload_errors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all avatar_upload_errors"
  ON public.avatar_upload_errors FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_avatar_upload_errors_user_created
  ON public.avatar_upload_errors (user_id, created_at DESC);