set lock_timeout = '5s';
set statement_timeout = '30s';

alter table public.events
  add column starts_on date,
  add column ends_on date;

update public.events
set
  starts_on = (starts_at at time zone 'America/Mexico_City')::date,
  ends_on = case
    when ends_at is null then null
    else (ends_at at time zone 'America/Mexico_City')::date
  end;

alter table public.events
  alter column starts_on set not null,
  alter column starts_at drop not null,
  add constraint events_date_range_valid
    check (ends_on is null or ends_on >= starts_on),
  add constraint events_start_date_matches_timestamp
    check (
      starts_at is null
      or (starts_at at time zone 'America/Mexico_City')::date = starts_on
    ),
  add constraint events_end_timestamp_requires_start
    check (ends_at is null or starts_at is not null),
  add constraint events_end_date_matches_timestamp
    check (
      ends_at is null
      or (
        ends_on is not null
        and (ends_at at time zone 'America/Mexico_City')::date = ends_on
      )
    );

drop index public.events_status_starts_idx;
create index events_status_starts_idx
  on public.events (publication_status, starts_on, starts_at);

create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  storage_path text not null,
  sort_order smallint not null,
  alt_text text,
  created_at timestamptz not null default now(),
  constraint event_media_event_fk
    foreign key (event_id) references public.events(id) on delete cascade,
  constraint event_media_storage_path_not_blank
    check (btrim(storage_path) <> ''),
  constraint event_media_sort_order_valid
    check (sort_order between 0 and 9),
  constraint event_media_alt_text_not_blank
    check (alt_text is null or btrim(alt_text) <> ''),
  constraint event_media_event_order_unique
    unique (event_id, sort_order),
  constraint event_media_storage_path_unique
    unique (storage_path)
);

create table public.event_candidate_website_skips (
  candidate_id uuid primary key,
  skipped_by uuid not null,
  created_at timestamptz not null default now(),
  constraint event_candidate_website_skips_candidate_fk
    foreign key (candidate_id) references public.event_candidates(id) on delete cascade,
  constraint event_candidate_website_skips_profile_fk
    foreign key (skipped_by) references public.profiles(id) on delete restrict
);

alter table public.event_media enable row level security;
alter table public.event_candidate_website_skips enable row level security;

revoke all privileges on table
  public.event_media,
  public.event_candidate_website_skips
  from anon, authenticated;

grant select, insert, update, delete on public.event_media to authenticated;
grant select on public.event_media to anon;

grant select, insert, update, delete on table
  public.events,
  public.event_media,
  public.event_candidate_website_skips
  to service_role;
grant select on public.profiles to service_role;

create policy event_media_public_read
on public.event_media for select to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_media.event_id
      and events.publication_status = 'published'
  )
);

create policy event_media_staff_read
on public.event_media for select to authenticated
using ((select public.is_staff()));

create policy event_media_staff_insert
on public.event_media for insert to authenticated
with check ((select public.is_staff()));

create policy event_media_staff_update
on public.event_media for update to authenticated
using ((select public.is_staff()))
with check ((select public.is_staff()));

create policy event_media_staff_delete
on public.event_media for delete to authenticated
using ((select public.is_staff()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-public-media',
  'event-public-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.publish_event_to_website(
  candidate_id_input uuid,
  event_id_input uuid,
  actor_id_input uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  publication_time timestamptz := now();
begin
  if not exists (
    select 1
    from public.profiles
    where id = actor_id_input
      and account_status = 'active'
      and role in ('staff', 'owner')
  ) then
    raise exception 'Only active staff may publish website events.';
  end if;

  update public.events
  set
    publication_status = 'published',
    published_at = publication_time
  where id = event_id_input
    and btrim(title) <> ''
    and starts_on is not null
    and exists (
      select 1
      from public.event_media
      where event_media.event_id = event_id_input
    );

  if not found then
    raise exception 'The website event draft is incomplete or missing.';
  end if;

  update public.event_publications
  set
    status = 'published',
    published_at = publication_time,
    error = null
  where candidate_id = candidate_id_input
    and event_id = event_id_input
    and channel = 'website';

  if not found then
    raise exception 'The website publication record is missing.';
  end if;

  delete from public.event_candidate_website_skips
  where candidate_id = candidate_id_input;
end;
$$;

revoke all on function public.publish_event_to_website(uuid, uuid, uuid) from public;
grant execute on function public.publish_event_to_website(uuid, uuid, uuid) to service_role;
