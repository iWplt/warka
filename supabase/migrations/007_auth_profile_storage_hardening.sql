-- Auth hardening: profile signup fields, lock role/is_active, scoped designs storage

CREATE OR REPLACE FUNCTION protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role / system updates (bootstrap, admin API)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT is_admin() THEN
    NEW.role := OLD.role;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive ON profiles;
CREATE TRIGGER profiles_protect_sensitive
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_sensitive_fields();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role user_role;
  grad_year INT;
BEGIN
  meta_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );
  IF meta_role NOT IN ('student', 'representative') THEN
    meta_role := 'student'::user_role;
  END IF;

  grad_year := NULL;
  IF NEW.raw_user_meta_data->>'graduation_year' ~ '^\d+$' THEN
    grad_year := (NEW.raw_user_meta_data->>'graduation_year')::INT;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    email,
    phone,
    college,
    department,
    graduation_year
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    meta_role,
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'college'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'department'), ''),
    grad_year
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    college = COALESCE(EXCLUDED.college, profiles.college),
    department = COALESCE(EXCLUDED.department, profiles.department),
    graduation_year = COALESCE(EXCLUDED.graduation_year, profiles.graduation_year);

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "designs_auth" ON storage.objects;

CREATE POLICY designs_owner_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'designs'
    AND (is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY designs_owner_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'designs'
    AND (is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY designs_owner_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'designs'
    AND (is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY designs_owner_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'designs'
    AND (is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

DROP POLICY IF EXISTS logos_owner_update ON storage.objects;
CREATE POLICY logos_owner_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND (is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
  );
