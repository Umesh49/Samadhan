# Samadhan - Project Architecture

Overview of the project structure, components, and data flow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT) |
| **File Storage** | Vercel Blob |
| **Hosting** | Vercel |

---

## Folder Structure

```
samadhan/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard
│   │   └── page.tsx        # Admin UI (2000+ lines)
│   ├── api/                # API routes
│   │   └── upload/         # File upload endpoint
│   ├── auth/               # Authentication pages
│   │   ├── login/          # Login page
│   │   ├── logout/         # Logout handler
│   │   ├── sign-up/        # Registration
│   │   └── sign-up-success/# Post-registration
│   ├── dashboard/          # Government dashboard
│   ├── report/             # Citizen issue reporting
│   ├── globals.css         # Tailwind configuration
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── admin/              # Admin dashboard components
│   │   ├── admin-nav.tsx
│   │   ├── admin-overview.tsx
│   │   ├── admin-users.tsx
│   │   ├── admin-issues.tsx
│   │   ├── admin-analytics.tsx
│   │   └── admin-types.ts
│   ├── dashboard-stats.tsx # Statistics cards
│   ├── report-form.tsx     # Issue reporting
│   ├── issues-list.tsx     # Issues table (with modal)
│   ├── location-verification.tsx # GPS verification
│   ├── notification-*.tsx  # Notification system
│   └── recent-issues.tsx   # Issues feed
│
├── lib/                    # Utilities and clients
│   ├── supabase/           # Supabase configuration
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Auth middleware
│   ├── geolocation.ts      # GPS utilities
│   └── utils.ts            # Helper functions
│
├── scripts/                # Database scripts
│   └── db.sql              # Complete schema
│
├── docs/                   # Documentation
│   ├── SETUP.md            # Setup guide
│   ├── API.md              # API reference
│   └── ARCHITECTURE.md     # This file
│
├── middleware.ts           # Next.js middleware
├── .env.example            # Environment template
└── package.json            # Dependencies
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph Client["Browser (Client)"]
        UI[React Components]
        SC[Supabase Client]
    end

    subgraph Server["Next.js Server"]
        API[API Routes]
        SSR[Server Components]
        MW[Middleware]
    end

    subgraph Supabase["Supabase"]
        Auth[Authentication]
        DB[(PostgreSQL)]
        RT[Realtime]
    end

    subgraph Storage["Vercel"]
        Blob[Blob Storage]
    end

    UI --> SC
    SC --> Auth
    SC --> DB
    SC --> RT
    
    UI --> API
    API --> Blob
    
    SSR --> DB
    MW --> Auth
```

---

## User Roles & Permissions

```mermaid
graph TB
    subgraph Roles
        SA[Super Admin]
        A[Admin]
        G[Government]
        C[Citizen]
    end

    subgraph Permissions
        P1[Create Admins]
        P2[Approve Users]
        P3[Manage All Issues]
        P4[Respond to Issues]
        P5[Report Issues]
        P6[View All Issues]
    end

    SA --> P1
    SA --> P2
    SA --> P3
    SA --> P4
    
    A --> P2
    A --> P3
    A --> P4
    
    G --> P4
    G --> P6
    
    C --> P5
    C --> P6
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js App
    participant MW as Middleware
    participant Auth as Supabase Auth
    participant DB as Database

    U->>App: Visit /auth/sign-up
    U->>App: Submit registration
    App->>Auth: signUp()
    Auth->>DB: Create auth.users row
    DB->>DB: Trigger: create profiles row
    Auth-->>App: Return session
    App-->>U: Redirect based on role
```

---

## Issue Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Reported: Citizen submits
    Reported --> In_Progress: Government starts work
    Reported --> Rejected: Invalid issue
    In_Progress --> Resolved: Work completed
    In_Progress --> Reported: Needs more info
    Resolved --> [*]
    Rejected --> [*]
```

---

## Key Components

### Authentication (`lib/supabase/`)

- **client.ts**: Browser-side Supabase client for client components
- **server.ts**: Server-side client for server components/API routes
- **middleware.ts**: Session management and route protection

### Issue Reporting (`components/report-form.tsx`)

1. Captures issue details (title, description, category)
2. Gets GPS coordinates via browser geolocation
3. Uploads photo to Vercel Blob
4. Creates issue record in Supabase

### Issue Response (`components/issues-list.tsx` / `admin-issues.tsx`)

1. Government user views issue details
2. Verifies their location matches issue location
3. Uploads resolution photo
4. Calls `add_issue_response` RPC function

### Admin Dashboard (`app/admin/page.tsx`)

Acts as a coordinator ("smart container") that:
- Handles authentication and initial data fetching.
- Manages global state (tabs, user session).
- Renders modular child components:
  - `AdminNav`: Navigation and notifications.
  - `AdminOverview`: High-level stats and widgets.
  - `AdminUsers`: User approvals and management.
  - `AdminIssues`: Issue tracking and resolution.
  - `AnalyticsContent`: Charts and data visualization.

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Row Level Security** | All tables have RLS policies |
| **Role-based Access** | Enforced at database level |
| **Location Verification** | GPS matching for responses |
| **Approval Workflow** | Government users need admin approval |
| **Audit Logging** | Admin actions tracked in `admin_actions` |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin key |
| `BLOB_READ_WRITE_TOKEN` | Yes* | Vercel Blob token |
| `NEXT_PUBLIC_SITE_URL` | Yes | Site URL for auth redirects |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Yes | Dev redirect URL |

*Required for photo uploads
