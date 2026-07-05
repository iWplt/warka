-- Milestone 5: Batch roster measurements + editable product fields

ALTER TABLE batch_students
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS font_family TEXT,
  ADD COLUMN IF NOT EXISTS fabric_type TEXT;

COMMENT ON COLUMN batch_students.height_cm IS 'Student height in cm (Excel import / size guide)';
COMMENT ON COLUMN batch_students.weight_kg IS 'Student weight in kg (Excel import / size guide)';
COMMENT ON COLUMN batch_students.font_family IS 'Rep-editable font choice for batch roster';
COMMENT ON COLUMN batch_students.fabric_type IS 'Admin-locked fabric default for batch roster';
