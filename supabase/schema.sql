-- ============================================================================
-- THIÊN THẦN GỬI THÂN CHỦ — Supabase Database, Storage & RLS Migration Script
-- ============================================================================
-- Run this entire script in your Supabase Dashboard -> SQL Editor.
-- Safe to run on a fresh project (idempotent where possible).

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- 2.1. Event walls (supports multiple walls for future Nam Hòa events)
create table if not exists public.walls (
  wall_id text primary key
    check (wall_id ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  title text not null
    check (char_length(trim(title)) between 1 and 100),
  description text not null default ''
    check (char_length(description) <= 400),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2.2. Scrapbook contributions
create table if not exists public.posts (
  post_id uuid primary key default gen_random_uuid(),
  wall_id text not null references public.walls(wall_id) on delete cascade,
  sender_name text not null default ''
    check (char_length(sender_name) <= 60),
  is_anonymous boolean not null default false,
  message text not null default ''
    check (char_length(message) <= 1000),
  image_urls text[] not null default '{}'
    check (cardinality(image_urls) <= 4),
  card_style text not null
    check (card_style in ('wish', 'memory', 'letter', 'secret')),
  paper_tone text not null
    check (paper_tone in ('cream', 'butter', 'blush', 'lavender', 'sky')),
  tape_style text not null
    check (tape_style in ('striped', 'dots', 'grid', 'clip')),
  tilt_deg real not null default 0
    check (tilt_deg between -3 and 3),
  like_count integer not null default 0
    check (like_count >= 0),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),

  -- Must include at least a message or one photo
  constraint posts_content_required
    check (char_length(trim(message)) > 0 or cardinality(image_urls) > 0),

  -- Strict anonymity guarantee: real sender name is never stored when anonymous
  constraint posts_anonymous_no_name
    check (not is_anonymous or sender_name = '')
);

create index if not exists idx_posts_wall_visible_created
  on public.posts (wall_id, is_hidden, created_at desc);

-- 2.3. Visitor likes (deduplicated per visitor_id per post)
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(post_id) on delete cascade,
  visitor_id text not null
    check (char_length(visitor_id) between 4 and 120),
  created_at timestamptz not null default now(),
  primary key (post_id, visitor_id)
);

create index if not exists idx_post_likes_visitor
  on public.post_likes (visitor_id);

-- 2.4. Authorized administrators (mapped to Supabase Auth users)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. HELPER & RPC FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- 3.1. Check if current authenticated user is an authorized admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3.2. Atomic like toggle (public visitors never need direct UPDATE on posts)
create or replace function public.toggle_post_like(
  p_post_id uuid,
  p_visitor_id text
)
returns table (
  post_id uuid,
  like_count integer,
  liked_by_me boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
  v_new_count integer;
  v_liked boolean;
begin
  if p_visitor_id is null or char_length(p_visitor_id) < 4 or char_length(p_visitor_id) > 120 then
    raise exception 'Không xác định được phiên truy cập hợp lệ.';
  end if;

  -- Only allow liking published, non-hidden posts
  if not exists (
    select 1 from public.posts p
    where p.post_id = p_post_id and p.is_hidden = false
  ) then
    raise exception 'Không tìm thấy lời nhắn này.';
  end if;

  delete from public.post_likes pl
  where pl.post_id = p_post_id and pl.visitor_id = p_visitor_id;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    v_liked := false;
  else
    insert into public.post_likes (post_id, visitor_id)
    values (p_post_id, p_visitor_id)
    on conflict do nothing;
    v_liked := true;
  end if;

  select count(*)::integer
  into v_new_count
  from public.post_likes pl
  where pl.post_id = p_post_id;

  update public.posts p
  set like_count = v_new_count
  where p.post_id = p_post_id;

  return query select p_post_id, v_new_count, v_liked;
end;
$$;

grant execute on function public.toggle_post_like(uuid, text) to anon, authenticated;

-- 3.3. Return only the post IDs liked by the requesting visitor on a wall
create or replace function public.get_visitor_liked_posts(
  p_wall_id text,
  p_visitor_id text
)
returns table (post_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select pl.post_id
  from public.post_likes pl
  inner join public.posts p on p.post_id = pl.post_id
  where p.wall_id = p_wall_id
    and p.is_hidden = false
    and pl.visitor_id = p_visitor_id;
$$;

grant execute on function public.get_visitor_liked_posts(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

alter table public.walls enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.admin_users enable row level security;

-- Revoke direct table access on post_likes from client roles (use RPCs only)
revoke all on table public.post_likes from anon, authenticated;

-- WALLS policies
drop policy if exists "walls_public_read" on public.walls;
create policy "walls_public_read"
  on public.walls
  for select
  to anon, authenticated
  using (true);

drop policy if exists "walls_admin_insert" on public.walls;
create policy "walls_admin_insert"
  on public.walls
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "walls_admin_update" on public.walls;
create policy "walls_admin_update"
  on public.walls
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "walls_admin_delete" on public.walls;
create policy "walls_admin_delete"
  on public.walls
  for delete
  to authenticated
  using (public.is_admin());

-- POSTS policies
drop policy if exists "posts_public_read_visible" on public.posts;
create policy "posts_public_read_visible"
  on public.posts
  for select
  to anon, authenticated
  using (is_hidden = false or public.is_admin());

drop policy if exists "posts_public_insert_when_open" on public.posts;
create policy "posts_public_insert_when_open"
  on public.posts
  for insert
  to anon, authenticated
  with check (
    is_hidden = false
    and like_count = 0
    and (not is_anonymous or sender_name = '')
    and exists (
      select 1
      from public.walls w
      where w.wall_id = posts.wall_id
        and w.is_open = true
    )
  );

drop policy if exists "posts_admin_update" on public.posts;
create policy "posts_admin_update"
  on public.posts
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "posts_admin_delete" on public.posts;
create policy "posts_admin_delete"
  on public.posts
  for delete
  to authenticated
  using (public.is_admin());

-- ADMIN_USERS policies (users can only read their own authorization row)
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKET & POLICIES
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scrapbook-photos',
  'scrapbook-photos',
  true,
  5242880, -- 5MB max per photo
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "scrapbook_photos_public_read" on storage.objects;
create policy "scrapbook_photos_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'scrapbook-photos');

drop policy if exists "scrapbook_photos_public_upload_open_wall" on storage.objects;
create policy "scrapbook_photos_public_upload_open_wall"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'scrapbook-photos'
    and exists (
      select 1
      from public.walls w
      where w.wall_id = (storage.foldername(name))[1]
        and w.is_open = true
    )
  );

drop policy if exists "scrapbook_photos_admin_delete" on storage.objects;
create policy "scrapbook_photos_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'scrapbook-photos'
    and public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 6. SUPABASE REALTIME
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'walls'
  ) then
    alter publication supabase_realtime add table public.walls;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 7. DEFAULT NAM HÒA WALL SEED
-- ----------------------------------------------------------------------------

insert into public.walls (wall_id, title, description, is_open)
values (
  'nam-hoa',
  'THIÊN THẦN GỬI THÂN CHỦ',
  'Một lời chúc, một chiếc ảnh, một chút quan tâm. Cứ gửi hết vào đây, để tụi mình cùng làm nên một góc Nam Hòa thật đáng yêu nha!',
  true
)
on conflict (wall_id) do nothing;

-- ----------------------------------------------------------------------------
-- 8. GRANT ADMIN ACCESS (RUN AFTER CREATING AN ADMIN USER IN SUPABASE AUTH)
-- ----------------------------------------------------------------------------
-- After creating your admin account in Supabase Dashboard -> Authentication -> Users,
-- uncomment and run the line below with your admin email:
--
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing;
