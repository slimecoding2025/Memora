# MEMORA

Never lose an idea. Never forget what matters. A private place to capture, search and rediscover your notes, ideas, links, images, documents and voice notes.

**Stack:** React + TypeScript + Vite, Tailwind, Motion, Supabase (Auth, Postgres, Storage, RLS), PWA.

## Features
Auth, memories (create, edit with conflict protection, favorite, archive, delete), full-text search, collections, tags, timeline, graph, Ctrl+K palette, private file attachments with previews and upload progress, voice notes, Markdown toolbar with preview, offline capture queue, in-app notifications, account export, dark/light theme, installable PWA. No AI features: nothing you save is sent to a third party.

## Setup
1. Create a Supabase project. In the SQL editor run `supabase/migrations/0001_init.sql`, then `0002_media_and_semantic.sql` (its vector column is unused and harmless).
2. Under Authentication > URL Configuration add your site URL and `http://localhost:5173`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL and anon key. Never use the service-role key.
4. `npm install && npm run dev`. Tests: `npm test`.
5. Deploy: push to GitHub, import in Vercel, add the two `VITE_` variables, deploy.
