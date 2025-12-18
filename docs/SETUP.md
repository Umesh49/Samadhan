# Samadhan - Setup Guide

Complete setup instructions to get Samadhan running on your local machine.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm**
- **Supabase account** ([Sign up free](https://supabase.com))
- **Vercel account** (optional, for blob storage) ([Sign up](https://vercel.com))

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/samadhan.git
cd samadhan

# Install dependencies
npm install
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `samadhan` (or any name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to be ready (~2 minutes)

---

## Step 3: Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:

| Setting | Where to find it |
|---------|------------------|
| **Project URL** | Under "Project URL" |
| **anon public key** | Under "Project API keys" → `anon` `public` |
| **service_role key** | Under "Project API keys" → `service_role` (click to reveal) |

---

## Step 4: Configure Environment

Create & Edit `.env` and paste your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=XXXXXX
NEXT_PUBLIC_SUPABASE_ANON_KEY=XXXX

SUPABASE_URL=XXXXX
SUPABASE_ANON_KEY=XXXXX
SUPABASE_SERVICE_ROLE_KEY=XXXXX

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Vercel Blob Storage Configuration
BLOB_READ_WRITE_TOKEN=XXXXX

```

---

## Step 5: Setup Database

1. In Supabase, go to **SQL Editor**
2. Click **"New query"**
3. Open `scripts/db.sql` from this project
4. Copy the **entire contents**
5. Paste into the SQL Editor
6. Click **"Run"**

You should see: `SAMADHAN DATABASE SCHEMA SETUP COMPLETE`

---

## Step 6: Configure Authentication

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`

---

## Step 7: Setup File Storage (Optional)

For photo uploads, you need Vercel Blob:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Create or select a project
3. Go to **Storage** → **Create Database** → **Blob**
4. Copy the `BLOB_READ_WRITE_TOKEN`
5. Add to `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

> **Note**: Without this, photo uploads won't work, but the rest of the app will function.

---

## Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## First Login

After setup, an admin account exists:

| Field | Value |
|-------|-------|
| Email | `admin@samadhan.gov` |
| Password | `Admin@123456` |
| Dashboard | `/admin` |

> ⚠️ **Change this password immediately after first login!**

---

## Next Steps

- Read [API.md](./API.md) for API documentation
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure
- Deploy to Vercel for production
