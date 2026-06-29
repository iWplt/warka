-- Allow public (anonymous) read of active price catalog rows for storefront / landing

DROP POLICY IF EXISTS price_read ON price_catalog;
CREATE POLICY price_read ON price_catalog FOR SELECT
  USING (active = true OR is_admin());
