# Samadhan 🏛️

> **A Next-Gen Civic Infrastructure Reporting Platform**

Connects citizens with government authorities to resolve issues like potholes, streetlights, and drainage with real-time tracking and location verification.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-2ea44f?style=for-the-badge&logo=vercel)](https://samadhan-three.vercel.app/)

> [!IMPORTANT]
> **Backend Status Notice**: The live demo uses a free-tier Supabase backend which pauses after inactivity. If the demo isn't loading data, please follow the [Quick Start](#quick-start) guide to run the full application locally with your own Supabase credentials.

![Banner](https://img.shields.io/badge/Status-Maintained-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📸 Screenshotsures

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

---

## 🚀 Future Scope

- **AI Image Analysis**: Automatically verify the severity of reported potholes/issues using Computer Vision.
- **Offline Mode**: Allow reporting issues in low-connectivity areas with background sync.
- **Public Leaderboard**: Gamification to reward the most active citizens.

## 🎓 Learning Outcomes

This project was built to demonstrate proficiency in:
- **Full Stack Development**: Next.js App Router & Server Actions.
- **Database Architecture**: Complex relationships & RLS policies in PostgreSQL (Supabase).
- **Modern UI/UX**: Implementing a custom Glassmorphism design system with Tailwind CSS.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
