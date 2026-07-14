-- Security hardening: ensure RLS is enabled on all public application tables.
-- NOTE: This app is single-shop multi-role (not SaaS tenant_id). Isolation is
-- auth.uid() + role helpers.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'orders',
    'order_items',
    'payments',
    'notifications',
    'activity_log',
    'batches',
    'batch_students',
    'design_submissions',
    'products',
    'price_catalog',
    'student_addresses',
    'representative_invite_codes',
    'employee_permissions',
    'custom_roles',
    'app_settings',
    'fonts',
    'production_photos',
    'product_bundles',
    'product_bundle_items',
    'message_templates',
    'notification_log'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_own_or_admin" ON public.notifications;

    CREATE POLICY "notifications_select_own" ON public.notifications
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_admin());

    CREATE POLICY "notifications_update_own" ON public.notifications
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "notifications_insert_own_or_admin" ON public.notifications
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_log') THEN
    DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
    DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;

    CREATE POLICY "activity_log_select" ON public.activity_log
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_admin());

    CREATE POLICY "activity_log_insert" ON public.activity_log
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders') THEN
    DROP POLICY IF EXISTS "orders_select_public_all" ON public.orders;
  END IF;
END $$;

-- Match server action payload in src/server/actions/leads.ts
CREATE TABLE IF NOT EXISTS public.bulk_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university TEXT NOT NULL,
  student_count INTEGER NOT NULL,
  coordinator_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bulk_leads_admin_select" ON public.bulk_leads;
DROP POLICY IF EXISTS "bulk_leads_anon_insert" ON public.bulk_leads;
DROP POLICY IF EXISTS "bulk_leads_authenticated_insert" ON public.bulk_leads;
DROP POLICY IF EXISTS "bulk_leads_service_insert" ON public.bulk_leads;

CREATE POLICY "bulk_leads_admin_select" ON public.bulk_leads
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Public lead form uses anon/authenticated session client; allow insert only
CREATE POLICY "bulk_leads_insert_anyone" ON public.bulk_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.bulk_leads IS 'Bulk-order contact leads; admin read only via RLS';
