# MEMORA

Never lose an idea. Never forget what matters. A private place to capture, search and rediscover your notes, ideas and links.

**Stack:** React + TypeScript + Vite, Tailwind, Motion, Supabase (Auth, Postgres, Storage, RLS), OpenRouter via a Vercel serverless function, PWA.

## Setup
1. **Supabase:** create a project. In the SQL editor run `supabase/migrations/0001_init.sql`. Under Authentication > URL Configuration add your Vercel URL and `http://localhost:5173`.
2. **Env:** copy `.env.example` to `.env` and fill in the Supabase URL and anon key (Project Settings > API). Never use the service-role key.
3. **Local:** `npm install && npm run dev`. For the AI route locally use `npx vercel dev` with `OPENROUTER_API_KEY` set.
4. **Vercel:** import the GitHub repo. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, and optionally `OPENROUTER_MODEL` in Project Settings > Environment Variables, then deploy.

## Security model
- RLS on every table; `user_id` defaults to `auth.uid()` and is never sent by the client.
- `/api/ask` verifies the user's JWT, queries memories as that user (so RLS applies), sends at most 8 truncated snippets to OpenRouter, drops source IDs the model invents, logs metadata only, and rate-limits to 10 requests/minute.
- `OPENROUTER_API_KEY` exists only in server environment variables.

## Features
Auth, memories (create, edit with conflict protection, favorite, archive, delete), search, collections, tags, timeline, graph, Ctrl+K palette, private file attachments, account export, AI "Ask" (server-side OpenRouter), Markdown formatting, offline capture queue, PNG app icons, unit tests (`npm test`), PWA shell, dark/light theme.

## Setup for newer features
Run `supabase/migrations/0002_media_and_semantic.sql` after 0001. Then open Account > "Index my memories" once so Ask can search by meaning. Optional env: `OPENROUTER_EMBED_MODEL`.

## Not built yet
True WYSIWYG editing (a formatting toolbar with live preview is included), push notifications while the app is closed, offline queue for files, speech-to-text for voice notes.
