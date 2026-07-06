-- Catalog display: featured products for homepage + index for sorting
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_catalog_list_idx
  ON products (active, category_id, sort_order, created_at DESC);

COMMENT ON COLUMN products.is_featured IS
  'When true, product may appear in homepage featured grid (max ~8).';
