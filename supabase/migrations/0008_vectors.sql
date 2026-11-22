-- Text vectors (pgvector). Embeddings come from the edge functions, never the browser.
create extension if not exists vector with schema extensions;

create table public.text_vectors (
  kind text not null check (kind in ('recipe')),
  id text not null,
  content text not null,
  -- text-embedding-3-small is 1536 numbers per text
  embedding extensions.vector(1536) not null,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
create index text_vectors_embedding_idx on public.text_vectors using hnsw (embedding extensions.vector_cosine_ops);

-- Shared reference text, not personal data: signed-in users read it, only the service role (edge function) writes.
alter table public.text_vectors enable row level security;
create policy "read vectors" on public.text_vectors for select to authenticated using (true);
grant select on public.text_vectors to authenticated;

-- Nearest texts of one kind to a query vector. similarity is 1 for identical meaning, near 0 for unrelated.
create function public.match_text(query_embedding extensions.vector(1536), match_kind text, match_count int default 5)
returns table (id text, similarity float)
language sql stable security invoker
set search_path = public, extensions
as $$
  select t.id, 1 - (t.embedding <=> query_embedding) as similarity
  from public.text_vectors t
  where t.kind = match_kind
  order by t.embedding <=> query_embedding
  limit least(match_count, 20);
$$;
grant execute on function public.match_text(extensions.vector, text, int) to authenticated;
