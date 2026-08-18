create table public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_group_id text,
  source_group_name text,
  source_sender_id text,
  source_sender_name text,
  anchor_message_id text not null,
  original_text text not null default '',
  media_path text,
  status text not null default 'collecting',
  collection_started_at timestamptz not null default now(),
  collection_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_candidates_source_type_not_blank check (btrim(source_type) <> ''),
  constraint event_candidates_anchor_message_id_not_blank check (btrim(anchor_message_id) <> ''),
  constraint event_candidates_media_path_not_blank check (media_path is null or btrim(media_path) <> ''),
  constraint event_candidates_status_valid check (status in ('collecting', 'pending', 'approved', 'rejected')),
  constraint event_candidates_collection_window_valid check (
    collection_closed_at is null or collection_closed_at >= collection_started_at
  ),
  constraint event_candidates_collection_state_valid check (
    (status = 'collecting' and collection_closed_at is null)
    or (status in ('pending', 'approved', 'rejected') and collection_closed_at is not null)
  ),
  constraint event_candidates_source_anchor_unique unique (source_type, anchor_message_id)
);

create table public.event_candidate_messages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  source_message_id text not null,
  message_type text not null,
  text text,
  media_path text,
  sender_id text,
  received_at timestamptz not null,
  sequence integer not null,
  created_at timestamptz not null default now(),
  constraint event_candidate_messages_candidate_fk
    foreign key (candidate_id) references public.event_candidates(id) on delete cascade,
  constraint event_candidate_messages_source_message_id_not_blank check (btrim(source_message_id) <> ''),
  constraint event_candidate_messages_message_type_not_blank check (btrim(message_type) <> ''),
  constraint event_candidate_messages_media_path_not_blank check (media_path is null or btrim(media_path) <> ''),
  constraint event_candidate_messages_content_present check (text is not null or media_path is not null),
  constraint event_candidate_messages_sequence_nonnegative check (sequence >= 0),
  constraint event_candidate_messages_candidate_sequence_unique unique (candidate_id, sequence),
  constraint event_candidate_messages_candidate_source_message_unique unique (candidate_id, source_message_id)
);

create table public.event_publications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  event_id uuid,
  channel text not null,
  status text not null default 'pending',
  caption text,
  external_id text,
  published_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_publications_candidate_fk
    foreign key (candidate_id) references public.event_candidates(id) on delete restrict,
  constraint event_publications_event_fk
    foreign key (event_id) references public.events(id) on delete set null,
  constraint event_publications_channel_not_blank check (btrim(channel) <> ''),
  constraint event_publications_status_valid check (status in ('pending', 'publishing', 'published', 'failed')),
  constraint event_publications_publication_state_valid check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  ),
  constraint event_publications_instagram_external_id_required check (
    status <> 'published'
    or channel <> 'instagram'
    or (external_id is not null and btrim(external_id) <> '')
  ),
  constraint event_publications_failed_error_required check (
    status <> 'failed' or (error is not null and btrim(error) <> '')
  ),
  constraint event_publications_candidate_channel_unique unique (candidate_id, channel)
);

create index event_candidates_collecting_source_idx
  on public.event_candidates (
    source_type,
    source_group_id,
    source_sender_id,
    collection_started_at desc
  )
  where status = 'collecting';
create index event_candidates_moderation_queue_idx
  on public.event_candidates (status, created_at);
create index event_candidate_messages_candidate_received_sequence_idx
  on public.event_candidate_messages (candidate_id, received_at, sequence);
create index event_publications_publisher_queue_idx
  on public.event_publications (status, channel, created_at);
create index event_publications_event_id_idx
  on public.event_publications (event_id)
  where event_id is not null;

create trigger event_candidates_set_updated_at
before update on public.event_candidates
for each row execute function public.set_updated_at();

create trigger event_publications_set_updated_at
before update on public.event_publications
for each row execute function public.set_updated_at();

alter table public.event_candidates enable row level security;
alter table public.event_candidate_messages enable row level security;
alter table public.event_publications enable row level security;

revoke all privileges on table
  public.event_candidates,
  public.event_candidate_messages,
  public.event_publications
  from anon, authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-media',
  'event-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
