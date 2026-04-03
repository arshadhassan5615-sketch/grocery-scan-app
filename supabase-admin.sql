-- 1. Add role to users
CREATE TYPE role_type AS ENUM ('admin', 'employee');

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role role_type NOT NULL DEFAULT 'employee';
-- Enable row level security on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
CREATE POLICY "admin_select_audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    ( SELECT u.role::text FROM auth.users u WHERE u.id = auth.uid() ) = 'admin'::text
  );
