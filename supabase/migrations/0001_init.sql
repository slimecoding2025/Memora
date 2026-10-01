-- MEMORA initial schema. Run in Supabase SQL editor (or `supabase db push`).
create extension if not exists pg_trgm;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '' check (char_length(content) <= 20000),
  type text not null default 'note' check (type in ('note','idea','link','quote')),
  source_url text check (char_length(source_url) <= 2000),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(source_url,''))
  ) stored
);
create index memories_search_idx on public.memories using gin (search);
create index memories_title_trgm on public.memories using gin (title gin_trgm_ops);
create index memories_user_created on public.memories (user_id, created_at desc);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  unique (user_id, name)
);

create table public.memory_tags (
  memory_id uuid not null references public.memories(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (memory_id, tag_id)
);

-- AI usage log: metadata only, never prompt content. Suggestions stay separate from user content.
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  feature text not null,
  status text not null,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);
create index ai_generations_user_time on public.ai_generations (user_id, created_at desc);

create or replace function public.touch_memory() returns trigger language plpgsql as $$
begin new.updated_at = now(); new.version = old.version + 1; return new; end $$;
create trigger memories_touch before update on public.memories
  for each row execute function public.touch_memory();

-- Row Level Security
alter table public.collections enable row level security;
alter table public.memories enable row level security;
alter table public.tags enable row level security;
alter table public.memory_tags enable row level security;
alter table public.ai_generations enable row level security;

create policy "own collections" on public.collections for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own memories" on public.memories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tags" on public.tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own memory_tags" on public.memory_tags for all
  using (exists (select 1 from public.memories m where m.id = memory_id and m.user_id = auth.uid())
     and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.memories m where m.id = memory_id and m.user_id = auth.uid())
     and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid()));
create policy "read own ai log" on public.ai_generations for select using (user_id = auth.uid());
create policy "insert own ai log" on public.ai_generations for insert with check (user_id = auth.uid());

-- Private file bucket; files live under <user_id>/...
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
  on conflict (id) do nothing;
create policy "own files" on storage.objects for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
