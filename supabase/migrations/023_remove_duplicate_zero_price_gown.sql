-- Remove orphaned zero-price gown rows when a priced gown product already exists.
DELETE FROM products p
WHERE p.product_type = 'gown'
  AND COALESCE(p.price, 0) = 0
  AND p.active = true
  AND EXISTS (
    SELECT 1
    FROM products p2
    WHERE p2.product_type = 'gown'
      AND p2.id <> p.id
      AND COALESCE(p2.price, 0) > 0
      AND p2.active = true
  );
