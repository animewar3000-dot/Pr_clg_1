# CampusIQ — AI-Powered Digital Campus Platform

## Overview

CampusIQ is a comprehensive digital campus management and student community platform designed to connect an entire college through a single unified ecosystem. It provides real-time communication, academic resource management, campus services, and AI-powered assistance.

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

## Features

### Core Modules
- **Authentication & Identity** — Supabase Auth with institutional verification, unique CampusIQ IDs
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
Run the migrations in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

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

1. **Supabase Required** — The application requires a configured Supabase project. Without it, the setup guide is displayed.

2. **AI Services** — The AI assistant requires a configured AI provider (OpenAI/Anthropic) with API credentials. Without configuration, the interface is available but responses require backend integration.

3. **Email Verification** — Requires Supabase email provider configuration for account verification.

4. **File Storage** — Requires properly configured Supabase Storage buckets with appropriate policies.

5. **Real-time** — Requires Supabase Realtime to be enabled for the relevant tables.

6. **Background Jobs** — Scheduled tasks (event reminders, ticket escalation) require pg_cron or external scheduling.

7. **Multi-college** — Architecture supports multi-tenancy but initial deployment targets a single college.

## Security Notes

- All database access is protected by Row Level Security policies
- Users cannot modify their own roles or verification status
- Private messages are only accessible to conversation participants
- File uploads are validated server-side
- Audit logs track administrative actions
- Suspended accounts are blocked at the database level

## License

Proprietary — CampusIQ Platform
