# CampOS user and role management UX contract

## Business authority
- The current task decision is to support both account invitations and management of roles for existing accounts.
- Both College Admin and Super Admin may grant/revoke roles, with different authority boundaries.
- Existing schema and authorization helpers are college-scoped. A Super Admin assignment in this project is still evaluated within the user's college; this is not a cross-college/global control plane.
- College Admin may manage member roles but may not grant/revoke College Admin or Super Admin.
- Super Admin may grant/revoke College Admin. Super Admin itself is bootstrap-only.
- No administrator may change their own role assignments.
- A college must retain at least one active College Admin.

## Sources
- supabase/migrations/001_initial_schema.sql — role and scope constraints.
- supabase/migrations/002_secure_onboarding_and_rls.sql — profile onboarding, pending approval, college-role checks and RLS.
- supabase/BOOTSTRAP_ADMIN.md — first administrator bootstrap.
- supabase/migrations/003_user_role_management.sql — current server-side role-management authority.

## Observable flows
### Invite account
1. Authorized College Admin or Super Admin opens Administration → Users & roles.
2. Enters name, email and college-issued ID.
3. Server validates the caller and sends a Supabase Auth invitation.
4. Auth trigger creates a pending profile and least-privilege student role.
5. Invitee verifies email; administrator separately approves campus access.
6. Success or actionable error is shown in the invitation panel.

### Grant role
1. Authorized administrator selects an existing account, role and academic scope.
2. Server validates actor, target college, role authority and scope ownership.
3. Role assignment is inserted idempotently and audited.
4. Account list refreshes and shows the new role/scope.

### Revoke role
1. Administrator selects the remove control beside a role assignment.
2. Server revalidates authority and scope; the browser cannot directly delete role rows.
3. The final active College Admin cannot be removed.
4. Account list refreshes; failures remain visible and can be retried.

## State and recovery
- Lists expose loading, error, empty and filtered-empty states.
- Mutations disable duplicate submission while pending.
- Invitation errors do not imply account creation succeeded.
- Role mutations are idempotent on grant; revoke reports stale assignments.
- Role list and search are refreshed after successful mutations.
- A user with pending verification remains restricted even if a role assignment exists.

## Accessibility
- Use labelled native inputs and selects.
- Keep focus indicators visible and controls keyboard-operable.
- Expose status and error feedback through live regions.
- Do not rely on color alone for status or role meaning.
