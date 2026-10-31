# CampOS — Campus Operating System

## Overview

CampOS is a comprehensive digital campus management and student community platform designed to connect an entire college through a single unified ecosystem. It provides real-time communication, academic resource management, campus services, and AI-powered assistance.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  TypeScript • Vite • Tailwind CSS • TanStack    │
│  React Router • React Hook Form • Zod           │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────┐
│              Supabase Backend                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │   Auth   │ │PostgreSQL│ │   Realtime   │    │
│  │  (JWT)   │ │  + RLS   │ │ (WebSocket)  │    │
│  └──────────┘ └──────────┘ └──────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Storage  │ │  Edge    │ │   pgvector   │    │
│  │ (Files)  │ │Functions │ │   (AI/RAG)   │    │
│  └──────────┘ └──────────┘ └──────────────┘    │
└─────────────────────────────────────────────────┘
```

## Product status

CampOS is under active development. The public landing page, authentication UI, application shell and first dashboard data queries are implemented. The database schema is an initial draft and must be reviewed/applied against the target Supabase project. Several modules are UI foundations and are not yet verified end-to-end. Do not use this deployment with real student data until the security and RLS checklist is completed.

### Implemented frontend surfaces

- Public landing page and responsive navigation
- Login, registration, password recovery and password reset screens
- Student dashboard with Supabase-backed announcements, notifications and room-membership queries
- Initial page surfaces for rooms, messaging, resources, Lost & Found, Request Desk, announcements, events, clubs, marketplace, study groups, timetable, feedback, administration and AI

### Planned / incomplete production workflows

- Server-side registration provisioning and first-admin bootstrap
- Complete role- and membership-scoped RLS policies for every table
- Verified real-time messaging and private conversation workflows
- Secure Storage policies and signed file access
- Complete service, academic, events and moderation workflows
- Permission-aware AI document ingestion, retrieval and citations

## Features

### Core Modules
- **Authentication & Identity** — Supabase Auth with institutional verification, unique CampOS IDs
- **Campus Communication** — Real-time rooms, channels, and group discussions
- **Private Messaging** — Direct messages, group conversations, message requests
- **Academic Hub** — Resource upload/download, subject organization, bookmarks
- **Lost & Found** — Item reports, claims, verification workflows
- **Request Desk** — Maintenance tickets, assignments, status tracking
- **Announcements** — Official institutional notices with scoped visibility
- **Events** — Event creation, registration, capacity management
- **Clubs** — Student organizations, memberships, leadership
- **Marketplace** — Student-to-student item exchange
- **Study Groups** — Academic collaboration groups
- **Timetable** — Class schedules, room assignments
- **Feedback** — Anonymous and attributed feedback submission
- **AI Assistant** — RAG-powered campus information retrieval

### Security
- Row Level Security on all tables
- College-scoped data isolation
- Role-based access control (8 roles)
- Server-side authorization enforcement
- Secure file storage with access policies
- Audit logging

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project
- (Optional) AI provider API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Set up the database:**
Run every migration in `supabase/migrations/` in numeric order in your Supabase SQL Editor. Start with `001_initial_schema.sql`, then `002_secure_onboarding_and_rls.sql`. The second migration adds the auth-user profile trigger and stricter RLS policies. Registration will reject users until a college row exists with a matching college code and email domain.

4. **Create storage buckets:**
In Supabase Dashboard → Storage, create these buckets:
- `resources` (for academic files)
- `avatars` (for profile pictures)
- `item-images` (for lost & found photos)
- `listings` (for marketplace images)
- `ticket-attachments` (for request desk files)

5. **Enable authentication:**
In Supabase Dashboard → Authentication → Providers, enable Email provider.

6. **Run the application:**
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

### Key Tables
- `colleges` — Institutional entities
- `profiles` — User profiles linked to auth.users
- `role_assignments` — RBAC permissions
- `rooms` / `messages` — Communication
- `conversations` / `conversation_members` — Private messaging
- `resources` — Academic materials
- `item_reports` / `item_claims` — Lost & Found
- `tickets` / `ticket_categories` — Request Desk
- `announcements` — Official notices
- `events` / `event_registrations` — Event management
- `clubs` / `club_memberships` — Student organizations
- `marketplace_listings` — Student marketplace
- `study_groups` / `study_group_members` — Study groups
- `timetable_entries` — Class schedules
- `notifications` — User notifications
- `feedback_submissions` — Feedback system
- `audit_logs` — Security audit trail

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| Student | Basic access, messaging, resources, services |
| Faculty | Student interaction, resource publishing, announcements |
| Class Representative | Section-level communication, coordination |
| Club Moderator | Club management, event organization |
| Support Staff | Ticket handling, maintenance |
| Department Admin | Department-level management |
| College Admin | Full college management |
| Super Admin | Cross-college administration |

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **State:** TanStack Query (server state), React Context (auth)
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **AI:** Provider-agnostic (OpenAI/Anthropic compatible)

## Project Structure

```
src/
├── App.tsx              # Root component with routing
├── main.tsx             # Entry point
├── vite-env.d.ts        # Vite type declarations
├── lib/
│   ├── config.ts        # Environment configuration
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # Domain type definitions
│   └── validations.ts   # Zod validation schemas
├── contexts/
│   └── AuthContext.tsx   # Authentication context
├── components/
│   └── Layout.tsx       # App layout with navigation
└── pages/
    ├── auth/            # Login, Register, Password Reset
    ├── communication/   # Rooms, Messages
    ├── academic/        # Resources
    ├── services/        # Lost & Found, Request Desk
    ├── campus/          # Announcements, Events, Clubs, etc.
    ├── ai/              # AI Assistant
    ├── admin/           # Administration
    ├── DashboardPage.tsx
    ├── ProfilePage.tsx
    └── SetupGuidePage.tsx

supabase/
└── migrations/
    └── 001_initial_schema.sql
```

## Known Limitations & Dependencies

1. **Supabase Required** — Netlify has the frontend URL and publishable key configured. Database schema/migrations and RLS policies still need to be applied and verified against the target project.

2. **AI Services** — The AI assistant requires a configured AI provider (OpenAI/Anthropic) with API credentials. Without configuration, the interface is available but responses require backend integration.

3. **Email Verification** — Requires Supabase email provider configuration for account verification.

4. **File Storage** — Requires private buckets and tested Storage policies; bucket creation alone is not sufficient.

5. **Real-time** — Requires Supabase Realtime to be enabled for the relevant tables.

6. **Background Jobs** — Scheduled tasks (event reminders, ticket escalation) require pg_cron or external scheduling.

7. **Multi-college** — Architecture supports multi-tenancy but initial deployment targets a single college.

## Security Notes

The initial migration enables RLS on only a subset of tables and its first-pass policies are not yet sufficient for production use. Do not treat the security statements in the original product specification as completed controls. A follow-up migration and role-by-role authorization tests are required before storing real student information.

## License

Proprietary — CampOS Platform
