# PHYGITAL — Production Deployment Guide

## 1. Supabase Database & Storage
1. Create a Supabase project and link it via `supabase link --project-ref <PROJECT_REF>`.
2. Push all SQL migrations in order:
   ```bash
   supabase db push
   ```
3. Configure PostgreSQL settings for `pg_cron` (`app.supabase_functions_url` and `app.service_role_key` via Supabase Vault).

## 2. Supabase Edge Functions & Secrets
Set server-side secrets (never expose these in frontend `.env`!):
```bash
supabase secrets set GEMINI_API_KEY="your-key" GEMINI_MODEL="gemini-2.5-flash" EPHEMERAL_MEDIA_BUCKET="ephemeral-media"
```
Deploy all five Edge Functions:
```bash
supabase functions deploy companion-dialogue
supabase functions deploy analyze-object
supabase functions deploy transcribe-audio
supabase functions deploy purge-expired-media
supabase functions deploy complete-quest
```

## 3. Frontend PWA Hosting (Google Cloud Run)
A Cloud Run-ready [Dockerfile](file:///d:/Promptwars/Dockerfile) and [nginx.conf.template](file:///d:/Promptwars/nginx.conf.template) are included for source-based deployment:
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud run deploy phygital --source . --region us-central1 --allow-unauthenticated
```

## 4. Alternative Static PWA Hosting
1. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_DEV_SANDBOX_MODE=false` in your hosting provider (Vercel / Cloudflare Pages / Netlify).
2. Build with `npm run build` and deploy `dist/`.
