# CampOS — Campus Operating System

CampOS is a single-college campus management and student community web application built as a college SSPD project. It brings common student, faculty and administration activities into one place.

**Live demo:** https://campos-nu.vercel.app/  
**Repository:** https://github.com/animewar3000-dot/Pr_clg_1

> **Project status:** Active student project / demo. Some screens and workflows are still being developed or need live testing. Do not use it for real student records or a full-college rollout until the security checklist has been completed.

## What CampOS includes

The frontend contains these areas:

- **Dashboard and profile** — campus overview and personal profile.
- **Authentication** — email/password sign-in, registration and password recovery through Supabase Auth.
- **Communication** — campus rooms and direct messages.
- **Academic** — learning resources, assignments and submissions.
- **Campus** — announcements, events, clubs, timetable, study groups and feedback.
- **Student services** — Lost & Found and Request Desk.
- **Marketplace** — student listings.
- **Administration** — college administration and account-verification screens.
- **AI assistant screen** — interface foundation; AI backend and retrieval are not yet complete.

The presence of a screen does not mean every workflow is fully connected or production-tested. See [the security test matrix](supabase/SECURITY_TEST_MATRIX.md) for the current verification status.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Data fetching | TanStack Query |
| Forms and validation | React Hook Form, Zod |
| Backend | Supabase |
| Database | PostgreSQL with Row Level Security |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Hosting | Vercel |

## Run locally

### Requirements

- Node.js 18 or newer
- npm
- A Supabase project with the CampOS migrations applied

### 1. Clone the repository

```bash
git clone https://github.com/animewar3000-dot/Pr_clg_1.git
cd Pr_clg_1
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Set the following values in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=CampOS
```

Use the Supabase project URL and its publishable (or legacy anon) key. These frontend values are public by design; never put a Supabase service-role key or other private secret in a `VITE_` variable or commit it to Git.

### 3. Apply database migrations

In the Supabase SQL Editor, apply the files in `supabase/migrations/` in numeric order:

1. `001_initial_schema.sql`
2. `002_secure_onboarding_and_rls.sql`

If using the newer college student ID/admin additions, also review and apply `003_college_student_id_and_jd_admin.sql` according to its contents and the current database state. Do not re-run migrations on an already configured database unless you understand their effects.

For first-college and first-administrator setup, read [supabase/BOOTSTRAP_ADMIN.md](supabase/BOOTSTRAP_ADMIN.md). Use verified college information. For a demo without college-issued email accounts, the bootstrap guide explains the manual-verification approach.

### 4. Start the development server

```bash
npm run dev
```

Vite prints the local URL in the terminal (normally http://localhost:5173).

## Useful commands

```bash
npm run dev        # Start local development
npm run build      # Create the production build in dist/
npm run typecheck  # Run TypeScript checks
```

## Deployment

The project is deployed on **Vercel**.

- Production URL: https://campos-nu.vercel.app/
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment settings for every deployment environment you use (Production, Preview and Development), then trigger a new deployment after changing them.

The repository also contains `vercel.json` for the Vite build and client-side route fallback. Do not put private backend credentials in frontend environment variables.

## Database and security

Important project documentation:

- [Database migrations](supabase/migrations/)
- [First-college and first-admin bootstrap](supabase/BOOTSTRAP_ADMIN.md)
- [Security test matrix](supabase/SECURITY_TEST_MATRIX.md)

CampOS uses Supabase Row Level Security and role assignments to scope campus data. However, the security matrix explicitly distinguishes automated database smoke tests from checks that still need to be completed against the live Supabase project with separate user accounts.

Before using real student information, complete the live checks for each role, cross-college access, private messaging, file storage, email verification, password recovery and realtime subscriptions. The current AI assistant is not a completed RAG service, and some provisioned Storage buckets still need their feature-specific policies and workflows.

## Project structure

```text
src/
├── App.tsx
├── main.tsx
├── components/       # Shared layout and UI components
├── contexts/         # Authentication context
├── lib/              # Supabase client, config, types and validation
└── pages/
    ├── academic/     # Resources and assignments
    ├── admin/        # Administration
    ├── ai/           # AI assistant interface
    ├── auth/         # Login, registration and password flows
    ├── campus/       # Announcements, events, clubs, timetable, etc.
    ├── communication/# Rooms and messages
    └── services/     # Lost & Found and Request Desk

supabase/
├── migrations/       # Ordered SQL migrations
├── tests/            # Database smoke tests
├── BOOTSTRAP_ADMIN.md
└── SECURITY_TEST_MATRIX.md
```

## Contributing

1. Create a feature branch.
2. Keep changes focused and test the affected workflow.
3. Run `npm run build` and `npm run typecheck`.
4. Open a pull request with a short description and screenshots for UI changes.

## License

Proprietary — CampOS Platform.
