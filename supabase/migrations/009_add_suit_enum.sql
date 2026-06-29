-- Must run in its own transaction (PostgreSQL enum rule).
-- Supabase: run this file alone first, then 010_product_catalog_categories.sql

ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'suit';
