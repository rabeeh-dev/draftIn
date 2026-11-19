# draftin — Authentication-First LinkedIn Content SaaS

DraftIn is a high-conversion LinkedIn post creation and preview studio engineered with a secure, authentication-first SaaS architecture.

---

## 🚀 Key Architectural Pillars

1. **Mandatory Google OAuth Authentication**
   - Unauthenticated visitors cannot access drafts, the writing editor, or private creator workspaces.
   - All private workspaces require a valid Supabase session established via Google OAuth (`signInWithOAuth({ provider: 'google' })`).
   - Clean OAuth exchange handler at `/auth/callback` preserving intended destination (`returnUrl`).

2. **Strict Route Separation & Independent Layouts**
   - **Public Area**:
     - `/login` — Dedicated Google authentication studio.
     - `/auth/callback` — Reactive Supabase session restorer & OAuth token exchange.
     - `/` — Intelligent landing redirector based on authenticated session and role.
   - **User Workspace (`/app/*`)**:
     - Protected by `AuthGuard`.
     - `/app` or `/app/editor` — Main TipTap editor and live LinkedIn desktop/mobile feed preview.
     - `/app/drafts` — Saved drafts library.
     - `/app/profile` — Author profile customizer (name, headline, avatar).
     - `/app/settings` — Workspace preferences, cache management, and account actions.
   - **Admin Application (`/admin/*`)**:
     - Protected by `AdminGuard` verifying backend administrator privileges.
     - `/admin` or `/admin/users` — Metric overview cards, creator table, role & status controls.
     - `/admin/users/:id` — Deep-linked creator inspection modal.
     - `/admin/activity` — Immutable audit log of administrative actions.
     - `/admin/settings` — Platform infrastructure, OAuth configuration, and RLS status.

3. **Data Isolation (Backend & Client)**
   - **Database (Supabase PostgreSQL)**:
     - All drafts enforce `auth.uid() = user_id` across SELECT, INSERT, UPDATE, and DELETE Row Level Security (RLS) policies.
     - Profiles enforce owner-only modification while authorized administrators can view and moderate creators.
   - **Browser Cache (LocalStorage)**:
     - Client offline draft cache is strictly scoped to `draftin_drafts_<user_id>`.
     - Cross-account cache leakage is completely prevented during logout or account switching.

4. **Audit Logging & Secure Admin Authorization**
   - Administrator status is verified from secure backend claims (`app_metadata.role === 'admin'` or `profiles.role === 'admin'`).
   - Administrative moderation actions (role toggles, account suspensions, account deletions) are logged to the audit event stream.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Base UI primitives, Lucide icons
- **Editor**: TipTap rich-text editor with LinkedIn Unicode character conversion
- **Backend & Auth**: Supabase Auth (Google OAuth) + PostgreSQL with Row Level Security (RLS)
- **Testing**: Vitest + React Testing Library (96 passing tests)

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔐 Google OAuth Configuration in Supabase

1. In the [Google Cloud Console](https://console.cloud.google.com/):
   - Configure OAuth consent screen.
   - Create an OAuth 2.0 Client ID (Web Application).
   - Add Authorized redirect URI:
     ```
     https://<your-supabase-project-id>.supabase.co/auth/v1/callback
     ```
2. In the [Supabase Dashboard](https://supabase.com/dashboard):
   - Navigate to **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Google**.
   - Enable Google, paste the Client ID and Secret.
   - Under **URL Configuration**, add your application callback to the **Redirect URLs Allowlist**:
     - Development: `http://localhost:5173/auth/callback`
     - Production: `https://your-domain.com/auth/callback`

---

## 👑 Assigning Administrator Privileges

To grant a creator administrator privileges:

### Method A: Via Supabase SQL Editor (Recommended)
```sql
-- Update profile role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@yourcompany.com';

-- Update user app_metadata for JWT claims
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourcompany.com';
```

---

## 📦 Database Migrations

Apply the database migrations in `supabase/migrations/`:

1. `20261117_initial_schema.sql` — Profiles, drafts, and initial RLS policies.
2. `20261119_auth_first_and_admin.sql` — Admin role columns, admin RLS access policies, and audit log table.

---

## 🧪 Testing & Verification

```bash
# Run Vitest test suite
npm test

# Build production bundle
npm run build

# Run ESLint
npm run lint
```
