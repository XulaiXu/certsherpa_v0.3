# CertSherpa Quiz

Single-page Next.js app (App Router) using Supabase. Shows one random question, records answer anonymously, then loads another random question.

## Setup

1. Supabase: run `supabase/schema.sql` in the SQL editor. Optionally run `supabase/seed.sql` to add sample questions.
2. Copy `.env.local.example` to `.env.local` and fill values from your Supabase project settings.
3. Install dependencies and run:

```bash
npm install
npm run dev
```

## Deploy

- Push to Git and import on Vercel. Add the two env vars in Project Settings → Environment Variables.
- Deploy.


