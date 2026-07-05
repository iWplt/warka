-- Product bundles (admin-managed packages)

CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  image_path TEXT,
  discount_percent INT NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle ON product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_active ON product_bundles(is_active, sort_order);

ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_bundles_read ON product_bundles;
CREATE POLICY product_bundles_read ON product_bundles FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS product_bundles_admin ON product_bundles;
CREATE POLICY product_bundles_admin ON product_bundles FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS product_bundle_items_read ON product_bundle_items;
CREATE POLICY product_bundle_items_read ON product_bundle_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_bundles b
      WHERE b.id = bundle_id AND (b.is_active = true OR is_admin())
    )
  );

DROP POLICY IF EXISTS product_bundle_items_admin ON product_bundle_items;
CREATE POLICY product_bundle_items_admin ON product_bundle_items FOR ALL
  USING (is_admin());

-- Seed default bundles (items linked to first active product per type)
INSERT INTO product_bundles (slug, name_ar, name_en, discount_percent, sort_order)
VALUES
  ('essential', 'باقة التخرج الأساسية', 'Essential Graduation Bundle', 8, 1),
  ('complete', 'باقة التخرج الكاملة', 'Complete Graduation Bundle', 12, 2),
  ('premium', 'باقة التخرج الفاخرة', 'Premium Graduation Bundle', 15, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_bundle_items (bundle_id, product_id, sort_order)
SELECT b.id, p.id, v.ord
FROM product_bundles b
JOIN (VALUES
  ('essential', 'sash'::product_type, 1),
  ('essential', 'cap'::product_type, 2),
  ('complete', 'sash'::product_type, 1),
  ('complete', 'cap'::product_type, 2),
  ('complete', 'gown'::product_type, 3),
  ('premium', 'sash'::product_type, 1),
  ('premium', 'cap'::product_type, 2),
  ('premium', 'gown'::product_type, 3),
  ('premium', 'suit'::product_type, 4)
) AS v(slug, ptype, ord) ON b.slug = v.slug
JOIN LATERAL (
  SELECT id FROM products
  WHERE product_type = v.ptype AND active = true
  ORDER BY sort_order, created_at
  LIMIT 1
) p ON true
ON CONFLICT (bundle_id, product_id) DO NOTHING;
