-- Storage buckets (run after enabling storage in Supabase)

INSERT INTO storage.buckets (id, name, public) VALUES
  ('templates', 'templates', true),
  ('designs', 'designs', true),
  ('logos', 'logos', false),
  ('qr-codes', 'qr-codes', true),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "templates_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'templates' AND auth.role() = 'authenticated');

CREATE POLICY "templates_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'templates' AND is_admin());

CREATE POLICY "designs_auth" ON storage.objects FOR ALL
  USING (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "qr_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "qr_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');
