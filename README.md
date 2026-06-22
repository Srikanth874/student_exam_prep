# Educational AI Web App

A production-ready dark themed educational AI starter built with Next.js 15, React, TypeScript, Tailwind CSS, Supabase Authentication, Supabase Storage-ready upload UI, n8n webhook service scaffolding, and a Gemini placeholder.

## Getting Started

```bash
npm install
npm run dev
```

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
N8N_WEBHOOK_URL=
```

## Supabase Setup

Enable Email/Password sign-in in Supabase Auth. The dashboard file upload UI expects a storage bucket named `study-materials`; create it before enabling live uploads.

## App Routes

- `/` landing page
- `/login` email/password sign in
- `/register` email/password registration
- `/dashboard` protected generation dashboard

## Integration Notes

- `src/services/n8n.ts` reads `N8N_WEBHOOK_URL` from environment variables and never hardcodes webhook URLs.
- `src/services/gemini.ts` contains a placeholder for future Gemini integration.
- Payments, admin panels, vector databases, and extra features are intentionally omitted.
