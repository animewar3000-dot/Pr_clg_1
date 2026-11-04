-- CampOS: college enrollment ID and initial JD College tenant/admin setup.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college_student_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_college_student_id_unique
  ON public.profiles (college_id, upper(college_student_id))
  WHERE college_student_id IS NOT NULL;

CREATE OR REPLACE FUNCTION app_private.bootstrap_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_college_id uuid;
  v_display_name text;
  v_college_code text;
  v_student_id text;
BEGIN
  v_college_code := upper(trim(coalesce(NEW.raw_user_meta_data ->> 'college_code', '')));
  v_display_name := trim(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''));
  v_student_id := upper(trim(coalesce(NEW.raw_user_meta_data ->> 'college_student_id', '')));

  IF v_college_code = '' OR v_display_name = '' OR v_student_id = '' OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Registration requires full name, email, college code and college student ID';
  END IF;

  SELECT c.id INTO v_college_id
  FROM public.colleges c
  WHERE upper(c.code) = v_college_code
    AND (c.email_domain = '*' OR lower(c.email_domain) = lower(split_part(NEW.email, '@', 2)))
  LIMIT 1;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'College code or email domain is not recognized';
  END IF;

  INSERT INTO public.profiles (
    id, college_id, college_student_id, display_name, email, account_status
  ) VALUES (
    NEW.id, v_college_id, v_student_id, v_display_name, lower(NEW.email), 'pending_verification'
  );

  INSERT INTO public.role_assignments (
    user_id, role, scope_type, scope_id, granted_by
  ) VALUES (
    NEW.id, 'student', 'college', v_college_id, NEW.id
  );

  RETURN NEW;
END;
$$;

INSERT INTO public.colleges (name, code, email_domain, timezone)
VALUES ('JD College of Engineering', '04138', '*', 'Asia/Kolkata')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, email_domain = EXCLUDED.email_domain, timezone = EXCLUDED.timezone;

WITH target_college AS (SELECT id FROM public.colleges WHERE code = '04138'),
admin_user AS (
  SELECT id, email, coalesce(raw_user_meta_data ->> 'display_name', 'CampOS Administrator') AS display_name
  FROM auth.users WHERE lower(email) = 'animewar3000@gmail.com'
)
INSERT INTO public.profiles (id, college_id, college_student_id, display_name, email, account_status)
SELECT u.id, c.id, 'BT260047CS', u.display_name, lower(u.email), 'active'
FROM admin_user u CROSS JOIN target_college c
ON CONFLICT (id) DO UPDATE SET
  college_id = EXCLUDED.college_id,
  college_student_id = EXCLUDED.college_student_id,
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  account_status = 'active',
  updated_at = now();

INSERT INTO public.role_assignments (user_id, role, scope_type, scope_id, granted_by)
SELECT p.id, 'college_admin', 'college', p.college_id, p.id
FROM public.profiles p JOIN auth.users u ON u.id = p.id
WHERE lower(u.email) = 'animewar3000@gmail.com'
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;
