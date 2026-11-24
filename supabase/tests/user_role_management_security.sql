-- Structural security checks for the user and role management RPCs.
-- Run after applying 003_user_role_management.sql in a test database.

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.can_manage_campus_users(uuid)',
    'public.list_managed_campus_users()',
    'public.list_campus_scope_options(text)',
    'public.manage_campus_role(uuid,text,text,uuid,text)'
  ] LOOP
    IF to_regprocedure(fn) IS NULL THEN
      RAISE EXCEPTION 'Missing user-management RPC: %', fn;
    END IF;
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure(fn)) THEN
      RAISE EXCEPTION 'Expected a guarded SECURITY DEFINER RPC: %', fn;
    END IF;
    IF has_function_privilege('anon', to_regprocedure(fn), 'EXECUTE') THEN
      RAISE EXCEPTION 'Anonymous users must not execute: %', fn;
    END IF;
    IF NOT has_function_privilege('authenticated', to_regprocedure(fn), 'EXECUTE') THEN
      RAISE EXCEPTION 'Authenticated users need RPC access (function enforces authorization): %', fn;
    END IF;
  END LOOP;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.role_assignments'::regclass) THEN
    RAISE EXCEPTION 'RLS must remain enabled on role_assignments';
  END IF;

  IF has_table_privilege('authenticated', 'public.role_assignments', 'INSERT')
     OR has_table_privilege('authenticated', 'public.role_assignments', 'DELETE')
     OR has_table_privilege('authenticated', 'public.role_assignments', 'UPDATE') THEN
    RAISE EXCEPTION 'Clients must not mutate role_assignments directly';
  END IF;
END;
$$;
