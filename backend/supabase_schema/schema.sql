-- UPSC ReelCastle — book-scoped content pipeline schema.
--
-- Run this in the Supabase SQL editor once per project. After running it,
-- also create a Storage bucket named `book-uploads` (Storage tab -> New
-- bucket -> name "book-uploads" -> set to Private, since we grant access
-- via the policies below rather than making it publicly readable).

create extension if not exists pgcrypto;

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  approach_guide text,
  error_message text,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  claimed_at timestamptz
);

-- Idempotent column addition for existing databases
alter table books add column if not exists claimed_at timestamptz;

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  chapter_number int,
  title text not null,
  page_start int,
  page_end int,
  importance_label text check (importance_label in ('High', 'Medium', 'Low')),
  importance_note text,
  approach_guide text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Idempotent column addition for existing databases
alter table chapters add column if not exists error_message text;
alter table chapters add column if not exists sources jsonb not null default '[]'::jsonb;

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  title text,
  concept_type text,
  bullet_points jsonb,
  mnemonic text,
  upsc_prelims_tip text,
  diagram_url text,
  sort_order int,
  sources jsonb not null default '[]'::jsonb
);

-- Idempotent column addition for existing databases
alter table cards add column if not exists sources jsonb not null default '[]'::jsonb;

create table if not exists pyqs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  year text,
  question text,
  options jsonb,
  correct_index int,
  explanation text,
  difficulty text,
  sources jsonb not null default '[]'::jsonb
);

-- Idempotent column addition for existing databases
alter table pyqs add column if not exists sources jsonb not null default '[]'::jsonb;

create index if not exists chapters_book_id_idx on chapters(book_id);
create index if not exists cards_chapter_id_idx on cards(chapter_id);
create index if not exists pyqs_chapter_id_idx on pyqs(chapter_id);

-- Row Level Security: this is the actual abuse boundary given there is no
-- login. Anonymous visitors can create a new pending book (upload) and read
-- everything, but can never write chapters/cards/pyqs directly — only the
-- worker, using the service-role key (which bypasses RLS entirely and is
-- never shipped to the browser), writes those.

alter table books enable row level security;
alter table chapters enable row level security;
alter table cards enable row level security;
alter table pyqs enable row level security;

create policy "anon can read books" on books
  for select using (true);
create policy "anon can queue a book upload" on books
  for insert with check (status = 'pending');

create policy "anon can read chapters" on chapters
  for select using (true);
create policy "anon can read cards" on cards
  for select using (true);
create policy "anon can read pyqs" on pyqs
  for select using (true);

-- Storage: the `book-uploads` bucket allows anonymous INSERT (upload) but no
-- public SELECT (no free redistribution of the raw textbook PDFs). Create
-- the bucket in the dashboard as Private first, then run:

create policy "anon can upload books" on storage.objects
  for insert to anon
  with check (bucket_id = 'book-uploads');

-- The worker reads uploaded PDFs using the service-role key, which bypasses
-- this policy entirely.

-- Bucket-level enforcement (the actual security boundary — there's no auth,
-- so PDF-only + a size cap is the only real guardrail on public uploads):
update storage.buckets
set file_size_limit = 52428800, -- 50MB
    allowed_mime_types = array['application/pdf']
where id = 'book-uploads';
