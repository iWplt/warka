-- Products catalog, saved student designs, profile email, storage policies

-- Profile email (synced from auth.users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Products (bilingual catalog; complements price_catalog)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type product_type NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO products (product_type, name_ar, name_en, price, active)
SELECT
  pc.product_type,
  CASE pc.product_type
    WHEN 'sash' THEN 'وشاح التخرج'
    WHEN 'cap' THEN 'قبعة التخرج'
    WHEN 'gown' THEN 'روب التخرج'
    ELSE 'تصميم مخصص'
  END,
  pc.label,
  pc.base_price,
  pc.active
FROM price_catalog pc
ON CONFLICT (product_type) DO UPDATE SET
  price = EXCLUDED.price,
  name_en = EXCLUDED.name_en,
  active = EXCLUDED.active;

-- Saved designs (student design studio JSON + preview)
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_type product_type NOT NULL,
  name TEXT,
  design_json JSONB NOT NULL DEFAULT '{}',
  preview_image TEXT,
  preview_path TEXT,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_id UUID REFERENCES designs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_designs_student ON designs(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_design ON orders(design_id);

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_read ON products FOR SELECT TO authenticated
  USING (active = true OR is_admin());

CREATE POLICY products_admin ON products FOR ALL
  USING (is_admin());

-- RLS: designs
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY designs_student_own ON designs FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY designs_admin ON designs FOR ALL
  USING (is_admin());

CREATE POLICY designs_rep_read ON designs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.design_id = designs.id AND o.representative_id = auth.uid()
    )
  );

-- Storage: logos (private) and exports (private)
CREATE POLICY logos_owner_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'logos' AND (
      is_admin() OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY logos_owner_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND (
      is_admin() OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY logos_owner_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND (
      is_admin() OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY exports_admin ON storage.objects FOR ALL
  USING (bucket_id = 'exports' AND is_admin());

CREATE POLICY exports_auth_read ON storage.objects FOR SELECT
  USING (bucket_id = 'exports' AND auth.role() = 'authenticated');

CREATE POLICY templates_admin_write ON storage.objects FOR UPDATE
  USING (bucket_id = 'templates' AND is_admin());

CREATE POLICY templates_admin_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'templates' AND is_admin());
