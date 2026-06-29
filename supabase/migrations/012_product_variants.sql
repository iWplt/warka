-- Product color variants (images per color) + fabric options (standard / premium)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fabric_options JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS fabric_type TEXT;

COMMENT ON COLUMN products.color_variants IS
  'Array of { key, label_ar, label_en, hex, images[], fabric_images?: { premium?: string[] } }';
COMMENT ON COLUMN products.fabric_options IS
  'Array of { key, label_ar, label_en, price_adjustment, description_ar?, description_en? }';
COMMENT ON COLUMN order_items.fabric_type IS 'Selected fabric key e.g. standard | premium';
