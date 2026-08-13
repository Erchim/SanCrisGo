create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[A-Za-z0-9_]{3,32}$'),
  display_name text,
  role text not null default 'user' check (role in ('user', 'staff', 'owner')),
  account_status text not null default 'pending' check (account_status in ('pending', 'active', 'suspended')),
  preferred_language text not null default 'en' check (preferred_language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  place_type text not null, summary text, description text, address text, neighborhood text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  google_maps_url text, phone text, whatsapp text, website_url text, instagram_url text,
  opening_hours jsonb, price_level smallint check (price_level between 1 and 4),
  cover_image_path text, seo_title text, seo_description text, source_url text,
  last_verified_at timestamptz, source_language text not null default 'en',
  publication_status text not null default 'draft' check (publication_status in ('draft','pending','published','rejected','archived')),
  published_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((publication_status = 'published') = (published_at is not null))
);

create table public.events (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  event_type text not null, summary text, description text, place_id uuid references public.places(id) on delete set null,
  venue_name text, address text, starts_at timestamptz not null, ends_at timestamptz,
  price_text text, ticket_url text, organizer_name text, organizer_url text,
  cover_image_path text, seo_title text, seo_description text, source_url text,
  last_verified_at timestamptz, source_language text not null default 'en',
  publication_status text not null default 'pending' check (publication_status in ('draft','pending','published','rejected','archived')),
  published_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  check ((publication_status = 'published') = (published_at is not null))
);

create table public.guides (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  category text not null, summary text, body_markdown text not null, language text not null default 'en',
  cover_image_path text, seo_title text, seo_description text, source_url text,
  last_verified_at timestamptz,
  publication_status text not null default 'draft' check (publication_status in ('draft','pending','published','rejected','archived')),
  published_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((publication_status = 'published') = (published_at is not null))
);

create table public.tags (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
  created_at timestamptz not null default now()
);
create table public.place_tags (place_id uuid references public.places(id) on delete cascade, tag_id uuid references public.tags(id) on delete cascade, primary key (place_id, tag_id));
create table public.event_tags (event_id uuid references public.events(id) on delete cascade, tag_id uuid references public.tags(id) on delete cascade, primary key (event_id, tag_id));
create table public.guide_tags (guide_id uuid references public.guides(id) on delete cascade, tag_id uuid references public.tags(id) on delete cascade, primary key (guide_id, tag_id));
create table public.place_relations (
  source_place_id uuid references public.places(id) on delete cascade,
  target_place_id uuid references public.places(id) on delete cascade,
  relation_type text not null, sort_order integer not null default 0 check (sort_order >= 0),
  primary key (source_place_id, target_place_id, relation_type), check (source_place_id <> target_place_id)
);
create table public.guide_places (
  guide_id uuid references public.guides(id) on delete cascade,
  place_id uuid references public.places(id) on delete cascade,
  relation_type text not null default 'covers', sort_order integer not null default 0 check (sort_order >= 0),
  primary key (guide_id, place_id, relation_type)
);

create index places_status_idx on public.places(publication_status);
create index places_type_idx on public.places(place_type);
create index places_published_at_idx on public.places(published_at) where published_at is not null;
create index places_created_by_idx on public.places(created_by);
create index events_status_starts_idx on public.events(publication_status, starts_at);
create index events_place_id_idx on public.events(place_id);
create index events_created_by_idx on public.events(created_by);
create index events_published_at_idx on public.events(published_at) where published_at is not null;
create index guides_status_idx on public.guides(publication_status);
create index guides_category_idx on public.guides(category);
create index guides_language_idx on public.guides(language);
create index guides_created_by_idx on public.guides(created_by);
create index guides_published_at_idx on public.guides(published_at) where published_at is not null;
create index place_tags_tag_idx on public.place_tags(tag_id);
create index event_tags_tag_idx on public.event_tags(tag_id);
create index guide_tags_tag_idx on public.guide_tags(tag_id);
create index place_relations_target_idx on public.place_relations(target_place_id);
create index guide_places_place_idx on public.guide_places(place_id);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger guides_set_updated_at before update on public.guides for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role, account_status)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''), 'user', 'pending');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
