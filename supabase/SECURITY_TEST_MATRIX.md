# CampOS security test matrix

This matrix distinguishes automated PostgreSQL smoke coverage from checks that still require separate real Supabase accounts and a deployed project. A green local PostgreSQL migration test is not a production security approval.

| Actor | Expected access | Automated smoke coverage | Live Supabase verification |
|---|---|---|---|
| Anonymous visitor | Public landing only; no campus tables, messages or files | Not yet | Required |
| Pending student | Own profile and verification status only; no rooms, directory, resources or protected campus actions | Signup creates pending profile; pending user hidden from directory; unverified email cannot be approved | Required |
| Active student | Same-college public rooms, joined room messages, own DMs, approved resources matching visibility, own tickets, claims, submissions and notifications | Profile RLS isolation, room creation, DM creation, claim/verification, event waitlist, assignment submission | Required |
| Faculty | Student permissions plus authorized college-wide announcements and assignments they create; grade their submissions | Role helper and assignment grading RPC smoke test | Required |
| Support staff | Only tickets assigned to them or their permitted team; internal comments only for authorized staff | Policy definitions present; no full staff-queue integration test yet | Required |
| Department administrator | Department-scoped administrative queue and approved workflows; no super-admin privileges | Role helper and pending queue function definitions | Required |
| College administrator | Same-college pending verification queue; approve only email-verified users; invite accounts; grant/revoke ordinary roles in college/department/program/section scopes | Pending queue, verified-email approval, role RPC structural security checks | Required |
| Super administrator | Same-college controls plus grant/revoke College Admin access; Super Admin itself remains bootstrap-only | Role RPC structural security checks and last-admin guard | Required |
| Cross-college user | No access to another institution's records, rooms, messages, tickets, resources or storage | Same-college filters exist; dedicated cross-college negative tests still needed | Required |

## Automated checks currently in CI

- Apply migrations 001, 002 and 003 to a clean Supabase-compatible PostgreSQL database with Auth and Storage schemas.
- Verify role-management RPCs are SECURITY DEFINER, unavailable to anon, executable by authenticated callers only through their internal authorization checks, and role_assignments has no direct client INSERT/UPDATE/DELETE privileges.
- Verify College Admin cannot grant/revoke College Admin or Super Admin; Super Admin can grant/revoke College Admin but cannot grant Super Admin.
- Verify cross-college scope IDs, self-role changes and removal of the last active College Admin are rejected.
- Verify account invitation requires an authenticated College Admin or Super Admin and the Auth trigger provisions a pending profile with only the student role.
- Verify Auth signup creates a pending profile and server-generated Campus ID.
- Verify default ticket categories are seeded.
- Verify pending/unverified users are not returned in the active campus directory.
- Verify an administrator cannot approve an unverified email.
- Verify administrator approval activates a verified student.
- Verify campus room creation enrolls its creator.
- Verify direct conversation creation and conversation listing.
- Verify Lost & Found claim submission and reporter verification.
- Verify event capacity produces a waitlist instead of overbooking.
- Verify assignment submission and grading.
- Verify profile RLS returns only the authenticated user's own profile.

## Required before a real campus pilot

1. Apply migrations 001–003 to the intended Supabase project and confirm the migration history. Deploy invite-campus-user with JWT verification enabled and test invitation email delivery.
2. Test with separate accounts for each role, including a second college in a staging database.
3. Test Storage upload, signed URL expiry, cross-college path access and unauthorized object IDs.
4. Test private-room and DM access after membership removal and blocking.
5. Test expired sessions, account suspension, password recovery and email verification.
6. Test realtime subscriptions with unauthorized channel IDs.
7. Review audit logging, backup/restore, rate limits, email delivery and operational incident response.

## Known scope limitations

- The first administrator must be bootstrapped once through the owner-only SQL procedure in supabase/BOOTSTRAP_ADMIN.md.
- College/department/section directory data must be seeded from verified institution records.
- Private Storage policies are implemented for academic resources. Other provisioned buckets remain inaccessible until their feature-specific policies are added.
- AI document ingestion, embeddings, permission-aware retrieval and server-side model calls are not yet implemented.
- The current migration smoke suite uses a compatible PostgreSQL test harness, not the live Supabase project.
