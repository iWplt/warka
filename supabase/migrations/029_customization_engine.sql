-- WARKA Customization & Embroidery Configuration Engine (generic — all products)

-- ─── Core config tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  style_key TEXT NOT NULL,
  style_name_ar TEXT NOT NULL,
  style_name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  preview_image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_batch_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, style_key)
);

CREATE TABLE IF NOT EXISTS customization_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  style_id UUID REFERENCES product_styles(id) ON DELETE CASCADE,
  zone_key TEXT NOT NULL,
  zone_label_ar TEXT NOT NULL,
  zone_label_en TEXT,
  content_type TEXT NOT NULL,
  allows_multiple BOOLEAN NOT NULL DEFAULT false,
  max_chars INT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customization_zones_product ON customization_zones(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_customization_zones_style ON customization_zones(style_id);

CREATE TABLE IF NOT EXISTS zone_content_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES customization_zones(id) ON DELETE CASCADE,
  option_key TEXT,
  option_name_ar TEXT NOT NULL,
  option_name_en TEXT,
  option_type TEXT NOT NULL,
  preview_image_url TEXT,
  default_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS text_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embroidery_size_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES customization_zones(id) ON DELETE CASCADE,
  min_chars INT NOT NULL DEFAULT 0,
  max_chars INT NOT NULL,
  embroidery_size_mm NUMERIC(8,2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS embroidery_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_name_ar TEXT NOT NULL,
  color_name_en TEXT,
  hex_code TEXT,
  thread_reference_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zone_color_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES customization_zones(id) ON DELETE CASCADE,
  color_id UUID REFERENCES embroidery_colors(id) ON DELETE SET NULL,
  color_source TEXT NOT NULL DEFAULT 'selectable',
  fixed_hex TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (zone_id, color_source, color_id)
);

CREATE TABLE IF NOT EXISTS gown_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  style_id UUID REFERENCES product_styles(id) ON DELETE CASCADE,
  addition_key TEXT NOT NULL,
  addition_name_ar TEXT NOT NULL,
  addition_name_en TEXT,
  color_source TEXT NOT NULL DEFAULT 'match_sash_color',
  is_optional BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, addition_key)
);

-- Order payload (zone selections per line item)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS customization_payload JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN order_items.customization_payload IS
  'Array of zone customization selections: style_id, zone_key, text, options, colors, computed_size_mm';

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE product_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_content_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE embroidery_size_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE embroidery_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_color_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE gown_additions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_styles_read ON product_styles;
CREATE POLICY product_styles_read ON product_styles FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS product_styles_admin ON product_styles;
CREATE POLICY product_styles_admin ON product_styles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS customization_zones_read ON customization_zones;
CREATE POLICY customization_zones_read ON customization_zones FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS customization_zones_admin ON customization_zones;
CREATE POLICY customization_zones_admin ON customization_zones FOR ALL USING (is_admin());

DROP POLICY IF EXISTS zone_content_options_read ON zone_content_options;
CREATE POLICY zone_content_options_read ON zone_content_options FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS zone_content_options_admin ON zone_content_options;
CREATE POLICY zone_content_options_admin ON zone_content_options FOR ALL USING (is_admin());

DROP POLICY IF EXISTS text_library_read ON text_library;
CREATE POLICY text_library_read ON text_library FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS text_library_admin ON text_library;
CREATE POLICY text_library_admin ON text_library FOR ALL USING (is_admin());

DROP POLICY IF EXISTS embroidery_size_rules_read ON embroidery_size_rules;
CREATE POLICY embroidery_size_rules_read ON embroidery_size_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY embroidery_size_rules_public ON embroidery_size_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS embroidery_size_rules_admin ON embroidery_size_rules;
CREATE POLICY embroidery_size_rules_admin ON embroidery_size_rules FOR ALL USING (is_admin());

DROP POLICY IF EXISTS embroidery_colors_read ON embroidery_colors;
CREATE POLICY embroidery_colors_read ON embroidery_colors FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS embroidery_colors_admin ON embroidery_colors;
CREATE POLICY embroidery_colors_admin ON embroidery_colors FOR ALL USING (is_admin());

DROP POLICY IF EXISTS zone_color_options_read ON zone_color_options;
CREATE POLICY zone_color_options_read ON zone_color_options FOR SELECT USING (true);

DROP POLICY IF EXISTS zone_color_options_admin ON zone_color_options;
CREATE POLICY zone_color_options_admin ON zone_color_options FOR ALL USING (is_admin());

DROP POLICY IF EXISTS gown_additions_read ON gown_additions;
CREATE POLICY gown_additions_read ON gown_additions FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS gown_additions_admin ON gown_additions;
CREATE POLICY gown_additions_admin ON gown_additions FOR ALL USING (is_admin());

-- ─── Seed: colors + text library ────────────────────────────────────────────

INSERT INTO embroidery_colors (color_name_ar, color_name_en, hex_code, thread_reference_code, sort_order)
SELECT * FROM (VALUES
  ('ذهبي', 'Gold', '#C9A227', 'GOLD-001', 1),
  ('فضي', 'Silver', '#C0C0C0', 'SILV-001', 2),
  ('أسود', 'Black', '#1A1A1A', 'BLK-001', 3),
  ('أبيض', 'White', '#FFFFFF', 'WHT-001', 4),
  ('أحمر', 'Red', '#B71C1C', 'RED-001', 5)
) AS v(color_name_ar, color_name_en, hex_code, thread_reference_code, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM embroidery_colors LIMIT 1);

INSERT INTO text_library (category, content_ar, content_en, sort_order)
SELECT * FROM (VALUES
  ('quran_verse', 'وَقُل رَّبِّ زِدۡنِي عِلۡمًا', 'And say: My Lord, increase me in knowledge', 1),
  ('quran_verse', 'فَإِنَّ مَعَ الۡعُسۡرِ يُسۡرًا', 'Indeed, with hardship comes ease', 2),
  ('quote', 'النجاح حصيلة جهد وإصرار', 'Success is the result of effort and persistence', 3),
  ('saying', 'Class of 2026', 'Class of 2026', 4)
) AS v(category, content_ar, content_en, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM text_library LIMIT 1);

-- ─── Seed helper: first active product per type ─────────────────────────────

CREATE OR REPLACE FUNCTION _warka_first_product(pt product_type)
RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT id FROM products WHERE product_type = pt AND active = true
  ORDER BY sort_order, created_at LIMIT 1;
$$;

-- ─── SASH styles + zones ────────────────────────────────────────────────────

INSERT INTO product_styles (product_id, style_key, style_name_ar, style_name_en, sort_order)
SELECT _warka_first_product('sash'), v.style_key, v.name_ar, v.name_en, v.ord
FROM (VALUES
  ('american_original', 'الأورجنال الأمريكي', 'American Original', 1),
  ('triangle_both', 'مثلث أمامي وخلفي', 'Triangle Front & Back', 2),
  ('triangle_curved', 'مثلث أمامي + مقوس خلفي', 'Triangle Front + Curved Back', 3),
  ('custom_image', 'طلب خاص حسب صورة', 'Custom from Reference Image', 4)
) AS v(style_key, name_ar, name_en, ord)
WHERE _warka_first_product('sash') IS NOT NULL
ON CONFLICT (product_id, style_key) DO NOTHING;

-- Sash zones (style_id NULL = all styles)
INSERT INTO customization_zones (product_id, style_id, zone_key, zone_label_ar, zone_label_en, content_type, max_chars, is_required, sort_order)
SELECT _warka_first_product('sash'), NULL, v.zone_key, v.label_ar, v.label_en, v.content_type, v.max_chars, v.required, v.ord
FROM (VALUES
  ('left_front', 'اليسار (أمام)', 'Left Front', 'name_major', 40, true, 1),
  ('right_front', 'اليمين (أمام)', 'Right Front', 'university_info', 80, false, 2),
  ('back', 'الخلف', 'Back', 'text_library', 120, false, 3)
) AS v(zone_key, label_ar, label_en, content_type, max_chars, required, ord)
WHERE _warka_first_product('sash') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customization_zones cz
    WHERE cz.product_id = _warka_first_product('sash') AND cz.zone_key = v.zone_key AND cz.style_id IS NULL
  );

-- CAP zones
INSERT INTO customization_zones (product_id, style_id, zone_key, zone_label_ar, zone_label_en, content_type, allows_multiple, max_chars, sort_order)
SELECT _warka_first_product('cap'), NULL, v.zone_key, v.label_ar, v.label_en, v.content_type, v.multi, v.max_chars, v.ord
FROM (VALUES
  ('side_band', 'الطوق الجانبي', 'Side Band', 'name_major', true, 30, 1),
  ('top', 'الأعلى', 'Top', 'text_library', false, 60, 2)
) AS v(zone_key, label_ar, label_en, content_type, multi, max_chars, ord)
WHERE _warka_first_product('cap') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customization_zones cz
    WHERE cz.product_id = _warka_first_product('cap') AND cz.zone_key = v.zone_key
  );

-- GOWN styles
INSERT INTO product_styles (product_id, style_key, style_name_ar, style_name_en, sort_order, is_batch_locked)
SELECT _warka_first_product('gown'), v.style_key, v.name_ar, v.name_en, v.ord, v.batch_locked
FROM (VALUES
  ('plain', 'عادي (بدون كسرات)', 'Plain (no pleats)', 1, false),
  ('gulf', 'خليجي (كسرات + ردن كلوش)', 'Gulf Style', 2, false),
  ('american', 'أمريكي (كسرات صدر وظهر)', 'American Style', 3, false),
  ('batch_custom', 'خاص بالدفعة', 'Batch Custom', 4, true)
) AS v(style_key, name_ar, name_en, ord, batch_locked)
WHERE _warka_first_product('gown') IS NOT NULL
ON CONFLICT (product_id, style_key) DO NOTHING;

INSERT INTO customization_zones (product_id, zone_key, zone_label_ar, zone_label_en, content_type, max_chars, sort_order)
SELECT _warka_first_product('gown'), v.zone_key, v.label_ar, v.label_en, v.content_type, v.max_chars, v.ord
FROM (VALUES
  ('chest_left', 'الصدر (يسار)', 'Chest Left', 'name_major', 40, 1),
  ('chest_right', 'الصدر (يمين)', 'Chest Right', 'university_info', 80, 2),
  ('sleeve', 'الكم', 'Sleeve', 'pattern_icon', NULL, 3)
) AS v(zone_key, label_ar, label_en, content_type, max_chars, ord)
WHERE _warka_first_product('gown') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customization_zones cz
    WHERE cz.product_id = _warka_first_product('gown') AND cz.zone_key = v.zone_key
  );

-- Gown additions
INSERT INTO gown_additions (product_id, addition_key, addition_name_ar, addition_name_en, color_source, sort_order)
SELECT _warka_first_product('gown'), v.addition_key, v.name_ar, v.name_en, v.color_source, v.ord
FROM (VALUES
  ('yoke_heart', 'فتحة/قلبة بالردن + تطعيم', 'Yoke heart opening + trim', 'match_sash_color', 1),
  ('cuff_trim', 'تطعيم بزمة', 'Cuff trim', 'match_sash_color', 2),
  ('satin_trim', 'تطعيم ستان', 'Satin trim', 'match_sash_color', 3),
  ('extra_embroidery', 'تطريز/خط إضافي', 'Extra embroidery line', 'match_sash_color', 4),
  ('small_icon', 'نقشة/حرف صغير', 'Small icon/letter', 'selectable', 5),
  ('shape_frame', 'إطار حسب الشكل', 'Shape-based frame', 'selectable', 6)
) AS v(addition_key, name_ar, name_en, color_source, ord)
WHERE _warka_first_product('gown') IS NOT NULL
ON CONFLICT (product_id, addition_key) DO NOTHING;

-- Zone color defaults (match sash)
INSERT INTO zone_color_options (zone_id, color_source, sort_order)
SELECT cz.id, 'match_sash_color', 0
FROM customization_zones cz
WHERE cz.zone_key IN ('left_front', 'right_front', 'back', 'side_band', 'chest_left', 'chest_right')
  AND NOT EXISTS (
    SELECT 1 FROM zone_color_options zco
    WHERE zco.zone_id = cz.id AND zco.color_source = 'match_sash_color'
  );

-- Size rules for text zones (back, top)
INSERT INTO embroidery_size_rules (zone_id, min_chars, max_chars, embroidery_size_mm, sort_order)
SELECT cz.id, r.min_c, r.max_c, r.size_mm, r.ord
FROM customization_zones cz
CROSS JOIN (VALUES
  (1, 15, 25.0, 1),
  (16, 40, 40.0, 2),
  (41, 80, 55.0, 3),
  (81, 200, 70.0, 4)
) AS r(min_c, max_c, size_mm, ord)
WHERE cz.content_type IN ('text_library', 'name_major', 'university_info')
  AND NOT EXISTS (SELECT 1 FROM embroidery_size_rules esr WHERE esr.zone_id = cz.id);

-- Cap side_band pattern option
INSERT INTO zone_content_options (zone_id, option_key, option_name_ar, option_name_en, option_type, sort_order)
SELECT cz.id, 'butterfly', 'نقشة فراشة', 'Butterfly pattern', 'preset_pattern', 1
FROM customization_zones cz
WHERE cz.zone_key = 'side_band' AND cz.product_id = _warka_first_product('cap')
  AND NOT EXISTS (
    SELECT 1 FROM zone_content_options zco WHERE zco.zone_id = cz.id AND zco.option_key = 'butterfly'
  );

-- Cap top options
INSERT INTO zone_content_options (zone_id, option_key, option_name_ar, option_name_en, option_type, sort_order)
SELECT cz.id, v.opt_key, v.name_ar, v.name_en, v.opt_type, v.ord
FROM customization_zones cz
CROSS JOIN (VALUES
  ('library_text', 'نص من المكتبة', 'Text from library', 'preset_text', 1),
  ('upload_logo', 'رفع شعار', 'Upload logo', 'logo_upload', 2),
  ('preset_star', 'نجمة جاهزة', 'Star pattern', 'preset_pattern', 3)
) AS v(opt_key, name_ar, name_en, opt_type, ord)
WHERE cz.zone_key = 'top' AND cz.product_id = _warka_first_product('cap')
  AND NOT EXISTS (
    SELECT 1 FROM zone_content_options zco WHERE zco.zone_id = cz.id AND zco.option_key = v.opt_key
  );

DROP FUNCTION IF EXISTS _warka_first_product(product_type);
