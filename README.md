# Samadhan

A civic infrastructure reporting platform connecting citizens with government authorities to report and resolve issues like potholes, broken streetlights, and drainage problems.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

---

## Features

| Role | Capabilities |
|------|-------------|
| **Citizens** | Report issues with photos & GPS, track status, receive notifications |
| **Government** | Manage issues, update status, submit resolution with location verification |
| **Admins** | Approve government users, manage all data, view analytics |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-username/samadhan.git
cd samadhan
npm install

# 2. Configure environment
copy .env.example .env.local   # Windows
# Fill in your Supabase credentials

# 3. Setup database
# Run scripts/db.sql in Supabase SQL Editor

# 4. Start dev server
npm run dev
```

📖 **[Detailed Setup Guide →](docs/SETUP.md)**


---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Server-Side Secrets (Optional for local dev unless using related features)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [📋 Setup Guide](docs/SETUP.md) | Step-by-step installation |
| [🔌 API Reference](docs/API.md) | Database schema, RPC functions, real-time |
| [🏗️ Architecture](docs/ARCHITECTURE.md) | Project structure, data flow diagrams |

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui (50+ components)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (JWT)
- **Storage**: Vercel Blob
- **Deployment**: Vercel

---

## Project Structure

```
samadhan/
├── app/               # Next.js pages & API routes
│   ├── admin/         # Admin dashboard
│   ├── auth/          # Login, signup
│   ├── dashboard/     # Government dashboard
│   └── report/        # Citizen reporting
├── components/        # React components
├── lib/               # Utilities & Supabase clients
├── scripts/           # Database setup SQL
└── docs/              # Documentation
```

---

## Default Admin

After database setup:

| Field | Value |
|-------|-------|
| Email | `admin@samadhan.gov` |
| Password | `Admin@123456` |

⚠️ **Change password after first login!**

---

## License

MIT License - free to use for civic projects.
