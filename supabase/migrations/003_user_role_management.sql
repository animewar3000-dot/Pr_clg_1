-- CampOS user and role management.
-- All privileged changes are performed through guarded RPCs; clients cannot
-- write role_assignments directly.

REVOKE INSERT, UPDATE, DELETE ON public.role_assignments FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_campus_users(p_college_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
  SELECT p_college_id IS NOT NULL
    AND p_college_id = app_private.current_college_id()
    AND app_private.has_college_role(
      p_college_id, ARRAY['college_admin', 'super_admin']
    );
$$;

CREATE OR REPLACE FUNCTION public.list_managed_campus_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  email text,
  campus_id text,
  account_status text,
  created_at timestamptz,
  email_verified boolean,
  role_assignments jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_college_id uuid;
BEGIN
  v_college_id := app_private.current_college_id();
  IF v_college_id IS NULL OR NOT public.can_manage_campus_users(v_college_id) THEN
    RAISE EXCEPTION 'College administrator permission required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.email,
    p.campus_id,
    p.account_status,
    p.created_at,
    (u.email_confirmed_at IS NOT NULL),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'role', ra.role,
          'scope_type', ra.scope_type,
          'scope_id', ra.scope_id,
          'scope_label', COALESCE(c.name, d.name, pr.name, s.name, ra.scope_type),
          'granted_at', ra.granted_at
        ) ORDER BY ra.role, ra.scope_type
      ) FILTER (WHERE ra.id IS NOT NULL),
      '[]'::jsonb
    )
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.role_assignments ra ON ra.user_id = p.id
  LEFT JOIN public.colleges c ON ra.scope_type = 'college' AND c.id = ra.scope_id
  LEFT JOIN public.departments d ON ra.scope_type = 'department' AND d.id = ra.scope_id
  LEFT JOIN public.programs pr ON ra.scope_type = 'program' AND pr.id = ra.scope_id
  LEFT JOIN public.sections s ON ra.scope_type = 'section' AND s.id = ra.scope_id
  WHERE p.college_id = v_college_id
  GROUP BY p.id, p.display_name, p.email, p.campus_id,
           p.account_status, p.created_at, u.email_confirmed_at
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_campus_scope_options(p_scope_type text)
RETURNS TABLE (id uuid, label text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_college_id uuid;
BEGIN
  v_college_id := app_private.current_college_id();
  IF v_college_id IS NULL OR NOT public.can_manage_campus_users(v_college_id) THEN
    RAISE EXCEPTION 'College administrator permission required';
  END IF;

  IF p_scope_id IS NULL THEN
    RAISE EXCEPTION 'A role scope is required';
  END IF;

  IF p_scope_type = 'college' THEN
    RETURN QUERY SELECT c.id, c.name FROM public.colleges c WHERE c.id = v_college_id;
  ELSIF p_scope_type = 'department' THEN
    RETURN QUERY
      SELECT d.id, d.name FROM public.departments d
      WHERE d.college_id = v_college_id ORDER BY d.name;
  ELSIF p_scope_type = 'program' THEN
    RETURN QUERY
      SELECT pr.id, pr.name
      FROM public.programs pr
      JOIN public.departments d ON d.id = pr.department_id
      WHERE d.college_id = v_college_id ORDER BY pr.name;
  ELSIF p_scope_type = 'section' THEN
    RETURN QUERY
      SELECT s.id, s.name
      FROM public.sections s
      JOIN public.programs pr ON pr.id = s.program_id
      JOIN public.departments d ON d.id = pr.department_id
      WHERE d.college_id = v_college_id ORDER BY s.name;
  ELSE
    RAISE EXCEPTION 'Unsupported role scope';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_campus_role(
  p_user_id uuid,
  p_role text,
  p_scope_type text,
  p_scope_id uuid,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_college_id uuid;
  v_target_college_id uuid;
  v_is_super_admin boolean;
  v_is_college_admin boolean;
  v_target_status text;
  v_admin_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_college_id := app_private.current_college_id();
  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'College administrator permission required';
  END IF;

  -- Serialize role changes, then re-check authority in case another admin changed it while waiting.
  PERFORM pg_advisory_xact_lock(hashtext(v_college_id::text));
  v_is_super_admin := app_private.has_college_role(v_college_id, ARRAY['super_admin']);
  v_is_college_admin := app_private.has_college_role(v_college_id, ARRAY['college_admin']);

  IF NOT (v_is_super_admin OR v_is_college_admin) THEN
    RAISE EXCEPTION 'College administrator permission required';
  END IF;

  IF p_user_id IS NULL OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot change their own role assignments';
  END IF;
  IF p_role IS NULL OR p_role NOT IN (
    'student', 'faculty', 'class_representative', 'club_moderator',
    'support_staff', 'department_admin', 'college_admin'
  ) THEN
    RAISE EXCEPTION 'Unsupported role';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('grant', 'revoke') THEN
    RAISE EXCEPTION 'Action must be grant or revoke';
  END IF;

  IF p_role = 'college_admin' AND NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only a super administrator can grant or revoke college administrator access';
  END IF;

  SELECT p.college_id, p.account_status
  INTO v_target_college_id, v_target_status
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF v_target_college_id IS NULL
     OR v_target_college_id <> v_college_id
     OR v_target_status NOT IN ('active', 'pending_verification') THEN
    RAISE EXCEPTION 'Target account must be an active or pending member of your college';
  END IF;

  IF p_scope_type = 'college' THEN
    IF p_scope_id <> v_college_id THEN
      RAISE EXCEPTION 'The selected college scope is invalid';
    END IF;
  ELSIF p_scope_type = 'department' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = p_scope_id AND d.college_id = v_college_id
    ) THEN RAISE EXCEPTION 'Department scope is outside your college'; END IF;
  ELSIF p_scope_type = 'program' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.programs pr
      JOIN public.departments d ON d.id = pr.department_id
      WHERE pr.id = p_scope_id AND d.college_id = v_college_id
    ) THEN RAISE EXCEPTION 'Program scope is outside your college'; END IF;
  ELSIF p_scope_type = 'section' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.programs pr ON pr.id = s.program_id
      JOIN public.departments d ON d.id = pr.department_id
      WHERE s.id = p_scope_id AND d.college_id = v_college_id
    ) THEN RAISE EXCEPTION 'Section scope is outside your college'; END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported role scope';
  END IF;

  IF p_role = 'college_admin' AND p_scope_type <> 'college' THEN
    RAISE EXCEPTION 'College administrator access must use college scope';
  END IF;
  IF p_role = 'department_admin' AND p_scope_type <> 'department' THEN
    RAISE EXCEPTION 'Department administrator access must use department scope';
  END IF;
  IF p_role = 'class_representative' AND p_scope_type <> 'section' THEN
    RAISE EXCEPTION 'Class representative access must use section scope';
  END IF;

  IF p_action = 'grant' THEN
    INSERT INTO public.role_assignments (user_id, role, scope_type, scope_id, granted_by)
    VALUES (p_user_id, p_role, p_scope_type, p_scope_id, auth.uid())
    ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(), 'role.granted', 'profile', p_user_id,
      jsonb_build_object('role', p_role, 'scope_type', p_scope_type, 'scope_id', p_scope_id)
    );
  ELSE
    IF p_role = 'college_admin' THEN
      SELECT count(*) INTO v_admin_count
      FROM public.role_assignments ra
      JOIN public.profiles p ON p.id = ra.user_id
      WHERE ra.role = 'college_admin'
        AND ra.scope_type = 'college'
        AND ra.scope_id = v_college_id
        AND p.college_id = v_college_id
        AND p.account_status = 'active';
      IF v_admin_count <= 1 AND v_target_status = 'active' THEN
        RAISE EXCEPTION 'The last active college administrator cannot be removed';
      END IF;
    END IF;

    DELETE FROM public.role_assignments
    WHERE user_id = p_user_id
      AND role = p_role
      AND scope_type = p_scope_type
      AND scope_id = p_scope_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'That role assignment no longer exists';
    END IF;

    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(), 'role.revoked', 'profile', p_user_id,
      jsonb_build_object('role', p_role, 'scope_type', p_scope_type, 'scope_id', p_scope_id)
    );
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_campus_users(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_managed_campus_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_campus_scope_options(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.manage_campus_role(uuid, text, text, uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_manage_campus_users(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_managed_campus_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_campus_scope_options(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_campus_role(uuid, text, text, uuid, text) TO authenticated;
