-- Group order personalization: per-item locked vs student-editable fields

CREATE TABLE IF NOT EXISTS product_field_permissions (
  product_type TEXT PRIMARY KEY,
  batch_locked_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_editable_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER product_field_permissions_updated_at
  BEFORE UPDATE ON product_field_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

INSERT INTO product_field_permissions (product_type, batch_locked_fields, student_editable_fields) VALUES
  ('cap', '["sash_color","fabric_type","cap_type","logo_url"]'::jsonb,
        '["cap_side_notes","cap_top_notes","embroidery_position","embroidery_style","embroidery_image_path","cap_side_embroidery_path","cap_top_embroidery_path"]'::jsonb),
  ('sash', '["sash_color","fabric_type"]'::jsonb,
        '["size","custom_text","font_family","embroidery_position","embroidery_style","thread_color","back_shape","embroidery_image_path"]'::jsonb),
  ('gown', '["sash_color","fabric_type","logo_url"]'::jsonb,
        '["size","special_notes","embroidery_position","embroidery_style"]'::jsonb),
  ('suit', '["sash_color","fabric_type","logo_url"]'::jsonb,
        '["size","special_notes","embroidery_position","embroidery_style"]'::jsonb),
  ('custom', '["sash_color","fabric_type"]'::jsonb,
        '["size","custom_text","font_family","special_notes","embroidery_position","embroidery_style","thread_color","embroidery_image_path"]'::jsonb)
ON CONFLICT (product_type) DO NOTHING;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS batch_locked_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS student_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS student_modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_modified_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN order_items.batch_locked_fields IS 'Rep/batch locked values — student cannot change via API';
COMMENT ON COLUMN order_items.student_fields IS 'Student-owned personalization snapshot (editable pre-deposit)';
COMMENT ON COLUMN orders.student_modified_at IS 'Last time student edited personal fields';
