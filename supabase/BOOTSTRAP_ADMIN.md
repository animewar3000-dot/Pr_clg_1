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

The email domain must be the domain students are expected to use, without the @ symbol. Do not use a personal Gmail domain for a real campus deployment.

## 2. Apply database migrations

Apply these files in numeric order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_secure_onboarding_and_rls.sql`

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
  AND p.account_status = 'pending_verification';

INSERT INTO public.role_assignments (
  user_id, role, scope_type, scope_id, granted_by
)
SELECT p.id, 'college_admin', 'college', p.college_id, p.id
FROM public.profiles p
JOIN public.colleges c ON c.id = p.college_id
WHERE upper(c.code) = upper('OFFICIAL_SHORT_CODE')
  AND lower(p.email) = lower('ADMIN_EMAIL@official-college-domain.edu')
  AND p.account_status = 'active'
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

COMMIT;
```

Verify that exactly the intended account has the `college_admin` role before proceeding. Keep the SQL Editor and project-owner access restricted to trusted operators.

## 4. Verify the first administrator

Sign out and sign back in to CampOS. The administrator should see the Administration page and the pending verification queue. Use the queue to approve other pending students. Approval is performed by the `approve_campus_user` database function, not by direct client updates to protected profile fields.

## Important limitations before a campus pilot

- Confirm the college's official code and email domain with administration.
- Review all RLS policies and test them with separate student, faculty, support and administrator accounts.
- The first version of the private Storage policies fully supports academic resources only. Other private buckets are provisioned but remain intentionally inaccessible until feature-specific policies and upload flows are implemented.
- Private messaging, notifications, and every campus module still require end-to-end tests against the real Supabase project.
- Do not import real student data or invite the whole college until the security test matrix has passed.
