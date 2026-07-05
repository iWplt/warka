-- Step 1: add enum value (must commit before policies reference it — see 026)

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'embroidery';
