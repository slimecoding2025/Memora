-- Run in the Supabase SQL editor AFTER 0001_init.sql.
create extension if not exists vector;

-- New capture types
alter table public.memories drop constraint if exists memories_type_check;
alter table public.memories add constraint memories_type_check
  check (type in ('note','idea','link','quote','image','document','voice'));

-- Semantic search (text-embedding-3-small = 1536 dimensions)
alter table public.memories add column if not exists embedding vector(1536);
create index if not exists memories_embedding_idx on public.memories using hnsw (embedding vector_cosine_ops);

-- Indexing a memory must not bump its version; editing text marks it for re-indexing.
create or replace function public.touch_memory() returns trigger language plpgsql as $$
begin
  if to_jsonb(new) - 'embedding' = to_jsonb(old) - 'embedding' then return new; end if;
  if new.embedding is not distinct from old.embedding
     and (new.title is distinct from old.title or new.content is distinct from old.content) then
    new.embedding = null;
  end if;
  new.updated_at = now(); new.version = old.version + 1;
  return new;
end $$;

-- SECURITY INVOKER: row level security still limits results to the caller's own memories.
create or replace function public.match_memories(query_embedding vector(1536), match_count int default 8)
returns table (id uuid, title text, content text, similarity float)
language sql stable security invoker as $$
  select m.id, m.title, m.content, 1 - (m.embedding <=> query_embedding)
  from public.memories m
  where m.is_archived = false and m.embedding is not null
  order by m.embedding <=> query_embedding
  limit least(match_count, 20)
$$;
