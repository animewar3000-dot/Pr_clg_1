# CampOS first-college and first-admin bootstrap

This is a one-time operator procedure. Run it only from the Supabase SQL Editor while signed in as the project owner. Do not expose database-owner credentials to the browser.

## 1. Register the institution

Replace every placeholder with verified information from the college administration:

```sql
INSERT INTO public.colleges (name, code, email_domain)
VALUES (
  'OFFICIAL COLLEGE NAME',
  'OFFICIAL_SHORT_CODE',
  'official-college-email-domain.edu'
)
ON CONFLICT (code) DO NOTHING;
```

The email domain must be the domain students are expected to use, without the @ symbol. If the college does not issue official email accounts, set `email_domain` to `*`; registration will still require email verification and manual administrator approval. In that mode, the administrator must verify each student's college identity before approving access.

## 2. Apply database migrations

Apply these files in numeric order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_secure_onboarding_and_rls.sql`
3. `supabase/migrations/003_user_role_management.sql`

Migration 002 creates pending profiles and least-privilege student role assignments from Supabase Auth signup metadata, enables RLS on all application tables, replaces the first-pass permissive policies, and creates private Storage buckets. It also adds admin verification and direct-message RPCs.

## 3. Create the first college administrator

First, register the designated administrator through the CampOS registration page using the official college email and the exact college code inserted in step 1. Complete Supabase email verification.

Then, in the Supabase SQL Editor, replace the placeholders below and run this one-time bootstrap:

```sql
BEGIN;

UPDATE public.profiles p
SET account_status = 'active',
    updated_at = now()
FROM public.colleges c
WHERE p.college_id = c.id
  AND upper(c.code) = upper('OFFICIAL_SHORT_CODE')
  AND lower(p.email) = lower('ADMIN_EMAIL@official-college-domain.edu')
  AND p.account_status = 'pending_verification'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL);

INSERT INTO public.role_assignments (
  user_id, role, scope_type, scope_id, granted_by
)
SELECT p.id, 'college_admin', 'college', p.college_id, p.id
FROM public.profiles p
JOIN public.colleges c ON c.id = p.college_id
WHERE upper(c.code) = upper('OFFICIAL_SHORT_CODE')
  AND lower(p.email) = lower('ADMIN_EMAIL@official-college-domain.edu')
  AND p.account_status = 'active'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL)
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

COMMIT;
```

Verify that exactly the intended account has the `college_admin` role before proceeding. Keep the SQL Editor and project-owner access restricted to trusted operators.

## 4. Verify the first administrator

Sign out and sign back in to CampOS. The administrator should see the Administration page, pending verification queue, and Users & roles workspace. Use the queue to approve pending members. Use Users & roles to invite accounts and grant scoped roles. Approval and role changes are performed by guarded database functions, not direct client updates to protected profile or role fields.

For email invitations, deploy supabase/functions/invite-campus-user with JWT verification enabled. Set the Edge Function secrets APP_URL and APP_ORIGIN for your deployment. Supabase provides SUPABASE_SERVICE_ROLE_KEY to the Edge Function runtime; never place it in frontend environment variables or source control.

College Admins can manage member roles except College Admin and Super Admin. Super Admins can also grant/revoke College Admin access. Super Admin itself is bootstrap-only and is intentionally not available in the role picker. Role changes are limited to the administrator's own college, and academic scopes are validated against that college.

## Important limitations before a campus pilot

- Confirm the college's official code and email domain with administration.
- Review all RLS policies and test them with separate student, faculty, support and administrator accounts.
- The first version of the private Storage policies fully supports academic resources only. Other private buckets are provisioned but remain intentionally inaccessible until feature-specific policies and upload flows are implemented.
- Private messaging, notifications, and every campus module still require end-to-end tests against the real Supabase project.
- Do not import real student data or invite the whole college until the security test matrix has passed.
