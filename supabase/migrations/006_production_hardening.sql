-- Production hardening: employee RLS scope, indexes, order history audit

-- Tighten employee order access to printing pipeline only
DROP POLICY IF EXISTS orders_employee_view ON orders;
DROP POLICY IF EXISTS orders_employee_update ON orders;

CREATE POLICY orders_employee_printing_select ON orders FOR SELECT USING (
  get_user_role() = 'employee'
  AND employee_has_permission('printing:view')
  AND status IN (
    'ready_for_printing',
    'printing',
    'printed',
    'ready_for_delivery',
    'delivered'
  )
);

CREATE POLICY orders_employee_printing_update ON orders FOR UPDATE USING (
  get_user_role() = 'employee'
  AND employee_has_permission('printing:status')
  AND status IN ('ready_for_printing', 'printing', 'printed', 'ready_for_delivery')
);

-- Representatives: explicit read-only on orders they own (already covered by orders_rep)

-- Designs: employees with design permission can read designs linked to printing orders
CREATE POLICY design_sub_employee_printing ON design_submissions FOR SELECT USING (
  get_user_role() = 'employee'
  AND employee_has_permission('design:view')
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND o.status IN ('ready_for_printing', 'printing', 'printed', 'ready_for_delivery')
  )
);

-- Composite index for employee printing queue
CREATE INDEX IF NOT EXISTS idx_orders_printing_queue
  ON orders(status, created_at DESC)
  WHERE archived = false
    AND status IN ('ready_for_printing', 'printing', 'printed', 'ready_for_delivery');

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
  ON order_status_history(order_id, created_at DESC);

-- Ensure status history always records actor
COMMENT ON TABLE order_status_history IS 'Audit trail: every status change with actor and timestamp';
