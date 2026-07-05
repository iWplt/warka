-- Milestone 7: Production photos + student notification

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'production_ready';

CREATE TABLE IF NOT EXISTS order_production_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_production_photos_order
  ON order_production_photos(order_id, created_at DESC);

ALTER TABLE order_production_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_production_photos_select ON order_production_photos
  FOR SELECT USING (
    is_admin()
    OR employee_has_permission('printing:view')
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_production_photos.order_id
        AND o.student_id = auth.uid()
    )
  );

CREATE POLICY order_production_photos_insert ON order_production_photos
  FOR INSERT WITH CHECK (
    is_admin()
    OR employee_has_permission('printing:status')
    OR employee_has_permission('printing:mark_printed')
  );

CREATE POLICY order_production_photos_delete ON order_production_photos
  FOR DELETE USING (is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('production-photos', 'production-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY production_photos_admin_employee_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'production-photos'
    AND (
      is_admin()
      OR employee_has_permission('printing:status')
      OR employee_has_permission('printing:mark_printed')
    )
  );

CREATE POLICY production_photos_student_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'production-photos'
    AND EXISTS (
      SELECT 1
      FROM order_production_photos opp
      JOIN orders o ON o.id = opp.order_id
      WHERE opp.image_path = storage.objects.name
        AND o.student_id = auth.uid()
    )
  );

CREATE POLICY production_photos_staff_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'production-photos'
    AND (
      is_admin()
      OR employee_has_permission('printing:view')
    )
  );

COMMENT ON TABLE order_production_photos IS 'Finished product photos uploaded before delivery';
