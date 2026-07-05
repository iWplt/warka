-- Step 2: RLS for embroidery role (runs after 025 is committed)

CREATE POLICY orders_embroidery_select ON orders
  FOR SELECT
  USING (
    get_user_role() = 'embroidery'::user_role
    AND status NOT IN ('cancelled')
  );

CREATE POLICY order_items_embroidery ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND get_user_role() = 'embroidery'::user_role
        AND o.status NOT IN ('cancelled', 'delivered')
    )
  );
