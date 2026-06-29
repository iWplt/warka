-- Student access codes + representative invite codes

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_access_code
  ON profiles (access_code)
  WHERE access_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS representative_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_email TEXT,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_invite_codes_code ON representative_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_rep_invite_codes_active ON representative_invite_codes(is_active);

CREATE TRIGGER rep_invite_codes_updated_at
  BEFORE UPDATE ON representative_invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE representative_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_invite_codes_admin ON representative_invite_codes FOR ALL
  USING (is_admin());

-- Students may read their own access_code via profile; codes resolved server-side only
