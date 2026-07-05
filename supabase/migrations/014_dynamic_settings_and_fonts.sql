-- Milestone 1.1: Dynamic settings engine + Milestone 1.2: Font management

-- Central key-value settings (deposit, defaults, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

INSERT INTO platform_settings (key, value) VALUES
  ('deposit', '{"mode":"percentage","percentage":30,"fixed_amount":0,"min_deposit_iqd":0}'::jsonb),
  ('batch_defaults', '{"admin_locked_fields":["sash_color","fabric_type","logo_url","embroidery_style"],"rep_editable_fields":["size","custom_text","font_family","measurements"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Admin-managed size guide (replaces hardcoded BMI logic)
CREATE TABLE IF NOT EXISTS size_guide_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT,
  size_code TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL,
  min_height_cm INT,
  max_height_cm INT,
  min_weight_kg INT,
  max_weight_kg INT,
  min_bmi NUMERIC(5,2),
  max_bmi NUMERIC(5,2),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_size_guide_product ON size_guide_entries(product_type);
CREATE INDEX IF NOT EXISTS idx_size_guide_active ON size_guide_entries(is_active, sort_order);

CREATE TRIGGER size_guide_entries_updated_at
  BEFORE UPDATE ON size_guide_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed default gown/suit sizes (admin can edit/delete freely)
INSERT INTO size_guide_entries (product_type, size_code, label_ar, label_en, min_height_cm, max_height_cm, min_weight_kg, max_weight_kg, sort_order)
SELECT * FROM (VALUES
  ('gown', 'S', 'صغير (S)', 'Small (S)', 140, 165, 40, 58, 1),
  ('gown', 'M', 'وسط (M)', 'Medium (M)', 163, 175, 50, 72, 2),
  ('gown', 'L', 'كبير (L)', 'Large (L)', 173, 185, 60, 88, 3),
  ('gown', 'XL', 'كبير جداً (XL)', 'Extra large (XL)', 180, 210, 75, 140, 4),
  ('suit', 'S', 'صغير (S)', 'Small (S)', 140, 165, 40, 58, 1),
  ('suit', 'M', 'وسط (M)', 'Medium (M)', 163, 175, 50, 72, 2),
  ('suit', 'L', 'كبير (L)', 'Large (L)', 173, 185, 60, 88, 3),
  ('suit', 'XL', 'كبير جداً (XL)', 'Extra large (XL)', 180, 210, 75, 140, 4),
  ('sash', 'standard', 'قياسي', 'Standard', NULL, NULL, NULL, NULL, 1),
  ('sash', 'long', 'طويل', 'Long', NULL, NULL, NULL, NULL, 2),
  ('cap', 'small', 'صغير', 'Small', NULL, NULL, NULL, NULL, 1),
  ('cap', 'medium', 'وسط', 'Medium', NULL, NULL, NULL, NULL, 2),
  ('cap', 'large', 'كبير', 'Large', NULL, NULL, NULL, NULL, 3)
) AS v(product_type, size_code, label_ar, label_en, min_height_cm, max_height_cm, min_weight_kg, max_weight_kg, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM size_guide_entries LIMIT 1);

-- Embroidery positions per product (admin-managed)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS embroidery_positions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.embroidery_positions IS
  'Array of { key, label_ar, label_en, sort_order, is_active }';

-- Per-batch overrides (deposit, locked fields, etc.)
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN batches.settings IS
  'Batch-level overrides: deposit, locked_fields, editable_fields, product defaults';

-- Dynamic fonts (Milestone 1.2)
CREATE TABLE IF NOT EXISTS fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  font_family_css TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fonts_active_sort ON fonts(is_active, sort_order);

CREATE TRIGGER fonts_updated_at
  BEFORE UPDATE ON fonts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Storage bucket for font files
INSERT INTO storage.buckets (id, name, public) VALUES
  ('fonts', 'fonts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY fonts_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'fonts');

CREATE POLICY fonts_admin_write ON storage.objects FOR ALL
  USING (bucket_id = 'fonts' AND is_admin());

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guide_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_public_read ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY platform_settings_admin ON platform_settings FOR ALL
  USING (is_admin());

CREATE POLICY size_guide_public_read ON size_guide_entries FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY size_guide_admin ON size_guide_entries FOR ALL
  USING (is_admin());

CREATE POLICY fonts_public_read ON fonts FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY fonts_admin ON fonts FOR ALL
  USING (is_admin());
