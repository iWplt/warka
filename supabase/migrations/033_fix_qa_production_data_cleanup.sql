-- 033_fix_qa_production_data_cleanup.sql
-- QA production remediation (WARKA)
-- Purpose:
--   1. Repair the corrupted Arabic sash product whose name/description were
--      stored as "????" (a non-UTF-8 client — PowerShell — inserted them).
--   2. Give that product a real production name/slug instead of "Placeholder".
--   3. Remove the two orphan DEMO batches ("Ali" + "دفعة هندسة 2026 — تجريبية")
--      and their demo batch_students. Both have no representative, no orders and
--      only a single fake "Ahmed Ali" test student.
--
-- Safety notes:
--   * Every statement is idempotent / guarded with a precise WHERE clause.
--   * No production account, order, payment or price row is touched.
--   * price_catalog is intentionally left untouched: it is a TYPE-level price
--     table (one row per product_type: sash/cap/gown/custom/suit) consumed by
--     getPriceForProduct() and admin settings — the 5 rows are all valid, not
--     orphans. UNIQUE(product_type) already prevents accumulation.
--
-- This file documents the change for review. It is applied against the remote
-- Supabase project via scripts/qa/apply-qa-cleanup.mjs (service role, UTF-8),
-- because the project has no direct psql/DATABASE_URL available locally.

BEGIN;

-- 1) Repair the Arabic sash product (canonical name from migration 005).
--    id starts with 7cceb3e9; we also match on the corruption + slug to stay safe.
UPDATE public.products
SET
  name_ar        = 'وشاح التخرج',
  name_en        = 'Graduation Sash',
  description_ar = 'وشاح تخرج فاخر بتصميم أنيق',
  description_en = 'Premium graduation sash with an elegant design',
  slug           = 'graduation-sash',
  updated_at     = now()
WHERE id = '7cceb3e9-4317-4c65-9934-edfa172bd4da'
  AND product_type = 'sash';

-- 2) Delete demo batch_students belonging to the two orphan demo batches.
DELETE FROM public.batch_students
WHERE batch_id IN (
  'a6331c18-85b4-40d8-9f9d-c2f088542cdc', -- "Ali"
  'b9935aa1-4c37-4bf9-a017-fd937f9b7bd6'  -- "دفعة هندسة 2026 — تجريبية"
)
AND student_id IS NULL   -- never touch a member linked to a real login account
AND order_id  IS NULL;   -- never touch a member tied to a real order

-- 3) Delete the two orphan demo batches — only if they are still orphan
--    (no representative and no orders referencing them).
DELETE FROM public.batches b
WHERE b.id IN (
  'a6331c18-85b4-40d8-9f9d-c2f088542cdc',
  'b9935aa1-4c37-4bf9-a017-fd937f9b7bd6'
)
AND b.representative_id IS NULL
AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.batch_id = b.id)
AND NOT EXISTS (SELECT 1 FROM public.batch_students s WHERE s.batch_id = b.id);

COMMIT;
