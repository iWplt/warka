-- Link batch roster rows to student login profiles
ALTER TABLE batch_students
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);
