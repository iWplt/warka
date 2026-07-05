-- Milestone 3: Order deposit locking + embroidery item fields

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deposit_required DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS catalog_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS embroidery_position TEXT,
  ADD COLUMN IF NOT EXISTS embroidery_style TEXT,
  ADD COLUMN IF NOT EXISTS thread_color TEXT,
  ADD COLUMN IF NOT EXISTS back_shape TEXT,
  ADD COLUMN IF NOT EXISTS embroidery_image_path TEXT,
  ADD COLUMN IF NOT EXISTS cap_side_embroidery_path TEXT,
  ADD COLUMN IF NOT EXISTS cap_top_embroidery_path TEXT,
  ADD COLUMN IF NOT EXISTS cap_side_notes TEXT,
  ADD COLUMN IF NOT EXISTS cap_top_notes TEXT;

COMMENT ON COLUMN orders.deposit_required IS 'Required deposit (arabon) in IQD';
COMMENT ON COLUMN orders.deposit_paid_at IS 'When deposit was paid — order becomes locked';
COMMENT ON COLUMN orders.is_locked IS 'True after deposit; student edits blocked unless admin unlocks';
