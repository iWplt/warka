-- Student delivery / contact addresses (optional; orders work without them)

CREATE TABLE IF NOT EXISTS student_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'المنزل',
  address_line TEXT NOT NULL,
  city TEXT,
  phone TEXT,
  college TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_addresses_student ON student_addresses(student_id);

ALTER TABLE student_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_addresses_select_own ON student_addresses
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY student_addresses_insert_own ON student_addresses
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY student_addresses_update_own ON student_addresses
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY student_addresses_delete_own ON student_addresses
  FOR DELETE USING (auth.uid() = student_id);

CREATE POLICY student_addresses_admin_all ON student_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
