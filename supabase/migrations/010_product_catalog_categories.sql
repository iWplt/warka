-- Run AFTER 009_add_suit_enum.sql (suit enum must be committed first)

-- Categories (sections): sash, cap, gown, suit, custom
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  product_type product_type NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO product_categories (slug, product_type, name_ar, name_en, sort_order) VALUES
  ('sash', 'sash', 'الأوشحة', 'Sashes', 1),
  ('cap', 'cap', 'القبعات', 'Caps', 2),
  ('gown', 'gown', 'الأروبة', 'Gowns', 3),
  ('suit', 'suit', 'البدلات', 'Suits', 4),
  ('custom', 'custom', 'تصاميم مخصصة', 'Custom', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO price_catalog (product_type, label, base_price, active)
SELECT 'suit', 'بدلة التخرج', 120000, true
WHERE NOT EXISTS (SELECT 1 FROM price_catalog WHERE product_type = 'suit');

-- Allow multiple products per category
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_key;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '["أسود","بيج","زيتوني","كريمي"]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Link existing rows to categories
UPDATE products p
SET category_id = c.id,
    slug = COALESCE(p.slug, p.product_type::text)
FROM product_categories c
WHERE c.product_type = p.product_type AND p.category_id IS NULL;

-- Seed default catalog items per category (one per type if missing)
INSERT INTO products (product_type, category_id, slug, name_ar, name_en, price, active, sort_order)
SELECT
  c.product_type,
  c.id,
  c.slug || '-default',
  c.name_ar,
  c.name_en,
  COALESCE(pc.base_price, 0),
  true,
  0
FROM product_categories c
LEFT JOIN price_catalog pc ON pc.product_type = c.product_type
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.category_id = c.id
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS catalog_product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_label TEXT;

-- RLS categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_categories_read ON product_categories;
CREATE POLICY product_categories_read ON product_categories FOR SELECT
  USING (active = true OR is_admin());

DROP POLICY IF EXISTS product_categories_admin ON product_categories;
CREATE POLICY product_categories_admin ON product_categories FOR ALL
  USING (is_admin());

-- Public read for active products (storefront)
DROP POLICY IF EXISTS products_read ON products;
CREATE POLICY products_read ON products FOR SELECT
  USING (active = true OR is_admin());

-- Storage: product images (public read, admin write)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
CREATE POLICY product_images_admin_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());
