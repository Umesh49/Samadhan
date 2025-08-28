# Samadhan - Civic Infrastructure Reporting App

A comprehensive civic engagement platform that connects citizens with government authorities to report and resolve infrastructure issues like potholes, broken streetlights, and other civic problems.

## Features

- **Citizen Reporting**: Citizens can report infrastructure issues with geolocated photos
- **Government Dashboard**: Government officials can manage and respond to reported issues
- **Admin Management**: Admins control government user approvals and system oversight
- **Real-time Updates**: Live notifications and status updates using Supabase
- **Geolocation Matching**: Ensures government responses are from the correct location
- **Royal Theme**: Professional government-grade interface with sophisticated styling

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS v4 with custom royal color scheme
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **File Storage**: Vercel Blob for photo uploads
- **Authentication**: Supabase Auth with role-based access control
- **Deployment**: Vercel

## Quick Start

### 1. Download and Install

\`\`\`bash
# Download from v0 or clone from GitHub
cd samadhan-app
npm install
\`\`\`

### 2. Environment Setup (CRITICAL)

**Copy the example environment file:**
\`\`\`bash
# Windows
copy .env.example .env.local

# Mac/Linux  
cp .env.example .env.local
\`\`\`

**Get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to Settings → API
3. Copy these values to your `.env.local`:

\`\`\`env
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### 3. Database Setup

**Run these SQL scripts in your Supabase SQL Editor (in order):**

1. `scripts/001_create_profiles.sql` - User profiles and roles
2. `scripts/002_create_issues.sql` - Issue reporting tables
3. `scripts/003_create_issue_responses.sql` - Government responses
4. `scripts/004_create_triggers.sql` - Database triggers
5. `scripts/005_create_indexes.sql` - Performance indexes
6. `scripts/006_add_admin_roles.sql` - Admin role system
7. `scripts/007_create_admin_functions.sql` - Admin functions
8. `scripts/008_create_initial_admin.sql` - Creates first admin user

### 4. Authentication Setup

**In Supabase Dashboard → Authentication → URL Configuration:**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

### 5. Start Development

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` - you should see the Samadhan homepage.

## User Access

### Initial Admin Login
After running database scripts, login with:
- **Email**: `admin@samadhan.gov`
- **Password**: `Admin@123456`
- **Dashboard**: `/admin`

**⚠️ Change this password immediately after first login!**

### User Registration Flow
- **Citizens**: Register directly at `/auth/sign-up`
- **Government Officials**: Register at `/auth/sign-up` → Admin approval required
- **Admins**: Created by existing admins in admin dashboard

## Project Structure

\`\`\`
samadhan-app/
├── app/
│   ├── admin/              # Admin dashboard (/admin)
│   ├── auth/               # Authentication pages
│   │   ├── login/          # Login page
│   │   └── sign-up/        # Registration page
│   ├── dashboard/          # Government dashboard
│   ├── report/             # Issue reporting page
│   ├── api/                # API routes
│   │   └── upload/         # File upload endpoint
│   ├── globals.css         # Tailwind CSS v4 configuration
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/
│   ├── admin-nav.tsx       # Admin navigation
│   ├── dashboard-stats.tsx # Dashboard statistics
│   ├── enhanced-report-form.tsx # Issue reporting form
│   ├── issue-modal.tsx     # Issue details modal
│   ├── issues-list.tsx     # Issues list component
│   ├── location-verification.tsx # GPS verification
│   ├── notification-bell.tsx # Notification system
│   ├── notification-provider.tsx # Notification context
│   ├── real-time-status.tsx # Real-time status indicator
│   ├── recent-issues.tsx   # Recent issues display
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── geolocation.ts      # GPS utilities
│   └── supabase/           # Supabase configuration
│       ├── client.ts       # Client-side Supabase
│       ├── middleware.ts   # Auth middleware
│       └── server.ts       # Server-side Supabase
├── scripts/                # Database setup scripts
├── middleware.ts           # Next.js middleware
├── .env.example           # Environment template
└── package.json           # Dependencies
\`\`\`

## Common Issues & Solutions

### ❌ "NEXT_PUBLIC_SUPABASE_URL is not set"

**Problem**: Environment variables not configured
**Solution**: 
1. Ensure `.env.local` exists in project root
2. Copy actual values from Supabase dashboard
3. Restart dev server: `npm run dev`

### ❌ "Failed to construct 'URL': Invalid URL"

**Problem**: Supabase URL is placeholder text
**Solution**: Replace `https://your-project-id.supabase.co` with your actual Supabase URL

### ❌ Database connection errors

**Problem**: Database scripts not executed
**Solution**: Run all 8 SQL scripts in Supabase SQL Editor in order

### ❌ Photo upload fails

**Problem**: Vercel Blob not configured
**Solution**: 
1. Create Vercel Blob store
2. Add `BLOB_READ_WRITE_TOKEN` to `.env.local`

## Development Commands

\`\`\`bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
# Run SQL scripts in Supabase dashboard SQL editor
\`\`\`

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `issue-modal.tsx`)
- **Pages**: `page.tsx` in folder structure
- **API Routes**: `route.ts` in folder structure
- **Utilities**: `camelCase.ts` (e.g., `geolocation.ts`)
- **Database Scripts**: `###_description.sql` (numbered order)

## Deployment to Vercel

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add Environment Variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXT_PUBLIC_SITE_URL` (your production domain)
4. **Deploy**

## Core Features

### Citizen Workflow
1. Register → Login → Report Issue → Upload Photo → Add GPS Location → Submit
2. Track issue status and receive notifications
3. View government responses and resolution photos

### Government Workflow  
1. Admin approves registration → Login → View assigned issues → Update status → Upload resolution photo → Submit response
2. Location verification ensures responses are from correct location

### Admin Workflow
1. Login → Approve government users → Manage all issues → Create additional admins → System oversight

## Support

For issues:
1. Check browser console for errors
2. Verify `.env.local` has correct values
3. Ensure all database scripts executed successfully
4. Check Supabase project status

## License

MIT License - feel free to use for civic projects.
