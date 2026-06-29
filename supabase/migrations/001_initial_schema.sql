-- Graduation Printing Shop Management System - Initial Schema

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'representative', 'student');
CREATE TYPE order_type AS ENUM ('individual', 'group');
CREATE TYPE order_status AS ENUM (
  'new',
  'pending_review',
  'designing',
  'awaiting_approval',
  'needs_modification',
  'ready_for_printing',
  'printing',
  'printed',
  'ready_for_delivery',
  'delivered',
  'cancelled'
);
CREATE TYPE product_type AS ENUM ('sash', 'cap', 'gown', 'custom');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'zain_cash');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE design_submission_status AS ENUM ('pending', 'approved', 'needs_modification', 'rejected');
CREATE TYPE batch_status AS ENUM ('draft', 'confirmed', 'completed', 'archived');
CREATE TYPE notification_type AS ENUM (
  'new_order',
  'new_group_order',
  'design_uploaded',
  'modification_requested',
  'design_approved',
  'ready_for_printing',
  'printing_started',
  'ready_for_delivery',
  'payment_received',
  'general'
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  department TEXT,
  stage TEXT,
  class_name TEXT,
  graduation_year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  locale TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom role presets for employees
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee permissions (granular RBAC)
CREATE TABLE employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, permission_key)
);

-- Price catalog
CREATE TABLE price_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type product_type NOT NULL,
  label TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  size_pricing JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Design templates
CREATE TABLE design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type product_type NOT NULL,
  name TEXT NOT NULL,
  preview_url TEXT,
  template_url TEXT,
  template_config JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Graduation batches (groups)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  college TEXT,
  department TEXT,
  graduation_year INTEGER,
  representative_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status batch_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Batch students
CREATE TABLE batch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  size TEXT,
  sash_color TEXT,
  cap_type TEXT,
  custom_text TEXT,
  notes TEXT,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  order_id UUID,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order number sequence
CREATE SEQUENCE order_number_seq START 1;

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  type order_type NOT NULL DEFAULT 'individual',
  status order_status NOT NULL DEFAULT 'new',
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  representative_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  shop_notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  qr_code_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE batch_students
  ADD CONSTRAINT batch_students_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_type product_type NOT NULL,
  size TEXT,
  sash_color TEXT,
  cap_type TEXT,
  custom_text TEXT,
  special_notes TEXT,
  font_family TEXT,
  logo_url TEXT,
  template_id UUID REFERENCES design_templates(id) ON DELETE SET NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order modifications log
CREATE TABLE order_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Design submissions
CREATE TABLE design_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES design_templates(id) ON DELETE SET NULL,
  customizations JSONB NOT NULL DEFAULT '{}',
  preview_url TEXT,
  status design_submission_status NOT NULL DEFAULT 'pending',
  modification_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto order number trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'GRD-' || EXTRACT(YEAR FROM now())::TEXT || '-' ||
      LPAD(nextval('order_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER design_submissions_updated_at BEFORE UPDATE ON design_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: employee has permission
CREATE OR REPLACE FUNCTION employee_has_permission(perm_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employee_permissions ep
    JOIN profiles p ON p.id = ep.employee_id
    WHERE ep.employee_id = auth.uid()
      AND ep.permission_key = perm_key
      AND ep.granted = true
      AND p.is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  is_admin() OR id = auth.uid() OR
  (get_user_role() = 'employee' AND employee_has_permission('orders:view'))
);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (is_admin());

-- Custom roles - admin only
CREATE POLICY custom_roles_admin ON custom_roles FOR ALL USING (is_admin());
CREATE POLICY custom_roles_read ON custom_roles FOR SELECT USING (is_admin() OR get_user_role() = 'employee');

-- Employee permissions - admin manages, employees read own
CREATE POLICY emp_perm_admin ON employee_permissions FOR ALL USING (is_admin());
CREATE POLICY emp_perm_read_own ON employee_permissions FOR SELECT USING (employee_id = auth.uid());

-- Price catalog - all authenticated read, admin write
CREATE POLICY price_read ON price_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY price_admin ON price_catalog FOR ALL USING (is_admin());

-- Design templates
CREATE POLICY templates_read ON design_templates FOR SELECT TO authenticated USING (active = true OR is_admin());
CREATE POLICY templates_admin ON design_templates FOR ALL USING (is_admin() OR employee_has_permission('design:templates'));

-- Batches
CREATE POLICY batches_rep ON batches FOR ALL USING (
  is_admin() OR representative_id = auth.uid()
);
CREATE POLICY batches_read_employee ON batches FOR SELECT USING (
  get_user_role() = 'employee' AND employee_has_permission('orders:view')
);

-- Batch students
CREATE POLICY batch_students_rep ON batch_students FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND b.representative_id = auth.uid()
  )
);
CREATE POLICY batch_students_read ON batch_students FOR SELECT USING (
  get_user_role() = 'employee' AND employee_has_permission('orders:view')
);

-- Orders
CREATE POLICY orders_admin ON orders FOR ALL USING (is_admin());
CREATE POLICY orders_student ON orders FOR SELECT USING (student_id = auth.uid());
CREATE POLICY orders_student_insert ON orders FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY orders_rep ON orders FOR ALL USING (representative_id = auth.uid());
CREATE POLICY orders_employee_view ON orders FOR SELECT USING (
  get_user_role() = 'employee' AND (
    employee_has_permission('orders:view') OR
    employee_has_permission('design:view') OR
    employee_has_permission('printing:view') OR
    employee_has_permission('delivery:view')
  )
);
CREATE POLICY orders_employee_update ON orders FOR UPDATE USING (
  get_user_role() = 'employee' AND (
    employee_has_permission('orders:edit') OR
    employee_has_permission('orders:status') OR
    assigned_employee_id = auth.uid()
  )
);

-- Order items (follow order access)
CREATE POLICY order_items_access ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (
    is_admin() OR o.student_id = auth.uid() OR o.representative_id = auth.uid() OR
    (get_user_role() = 'employee' AND employee_has_permission('orders:view'))
  ))
);

-- Order status history
CREATE POLICY order_history_read ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (
    is_admin() OR o.student_id = auth.uid() OR o.representative_id = auth.uid() OR
    (get_user_role() = 'employee' AND employee_has_permission('orders:view'))
  ))
);
CREATE POLICY order_history_insert ON order_status_history FOR INSERT WITH CHECK (
  is_admin() OR (get_user_role() = 'employee' AND employee_has_permission('orders:status'))
);

-- Order modifications
CREATE POLICY order_mods_read ON order_modifications FOR SELECT USING (
  is_admin() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (
    o.student_id = auth.uid() OR o.representative_id = auth.uid()
  ))
);
CREATE POLICY order_mods_insert ON order_modifications FOR INSERT WITH CHECK (
  is_admin() OR get_user_role() = 'employee'
);

-- Design submissions
CREATE POLICY design_sub_student ON design_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.student_id = auth.uid())
);
CREATE POLICY design_sub_rep ON design_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.representative_id = auth.uid())
);
CREATE POLICY design_sub_admin ON design_submissions FOR ALL USING (is_admin());
CREATE POLICY design_sub_employee ON design_submissions FOR ALL USING (
  get_user_role() = 'employee' AND (
    employee_has_permission('design:view') OR employee_has_permission('design:upload')
  )
);

-- Payments
CREATE POLICY payments_admin ON payments FOR ALL USING (is_admin());
CREATE POLICY payments_student_read ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.student_id = auth.uid())
);
CREATE POLICY payments_rep_read ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.representative_id = auth.uid())
);
CREATE POLICY payments_employee ON payments FOR ALL USING (
  get_user_role() = 'employee' AND (
    employee_has_permission('payments:view') OR employee_has_permission('payments:record')
  )
);

-- Notifications
CREATE POLICY notifications_own ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY notifications_admin_insert ON notifications FOR INSERT WITH CHECK (is_admin() OR get_user_role() = 'employee');

-- Activity log
CREATE POLICY activity_admin ON activity_log FOR SELECT USING (is_admin() OR employee_has_permission('reports:view'));
CREATE POLICY activity_insert ON activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Storage buckets (run in Supabase dashboard or via API)
-- templates, designs, logos, qr-codes, exports

-- Seed default prices
INSERT INTO price_catalog (product_type, label, base_price) VALUES
  ('sash', 'Graduation Sash', 25000),
  ('cap', 'Graduation Cap', 15000),
  ('gown', 'Graduation Gown', 45000),
  ('custom', 'Custom Design', 35000);

-- Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_orders_rep ON orders(representative_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_payments_order ON payments(order_id);
