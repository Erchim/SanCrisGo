set lock_timeout = '5s';
set statement_timeout = '30s';

alter table public.events
  add column title_es text,
  add column summary_es text,
  add column description_es text,
  add column price_text_es text,
  add column contact_phone text,
  add constraint events_title_es_not_blank
    check (title_es is null or btrim(title_es) <> ''),
  add constraint events_summary_es_not_blank
    check (summary_es is null or btrim(summary_es) <> ''),
  add constraint events_description_es_not_blank
    check (description_es is null or btrim(description_es) <> ''),
  add constraint events_price_text_es_not_blank
    check (price_text_es is null or btrim(price_text_es) <> ''),
  add constraint events_contact_phone_not_blank
    check (contact_phone is null or btrim(contact_phone) <> '');

create table public.event_candidate_ai_prefills (
  candidate_id uuid primary key,
  status text not null,
  model text not null,
  result jsonb,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 8),
  error_class text,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_candidate_ai_prefills_candidate_fk
    foreign key (candidate_id) references public.event_candidates(id) on delete cascade,
  constraint event_candidate_ai_prefills_status_valid
    check (status in ('ready', 'failed')),
  constraint event_candidate_ai_prefills_model_not_blank
    check (btrim(model) <> ''),
  constraint event_candidate_ai_prefills_result_object
    check (result is null or jsonb_typeof(result) = 'object'),
  constraint event_candidate_ai_prefills_token_counts_valid
    check (input_tokens >= 0 and output_tokens >= 0),
  constraint event_candidate_ai_prefills_cost_valid
    check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  constraint event_candidate_ai_prefills_error_class_not_blank
    check (error_class is null or btrim(error_class) <> ''),
  constraint event_candidate_ai_prefills_state_valid
    check (
      (status = 'ready' and result is not null and error_class is null)
      or (status = 'failed' and result is null and error_class is not null)
    )
);

comment on table public.event_candidate_ai_prefills is
  'Persisted website-admin AI suggestions and usage metadata. Never canonical event truth.';
comment on column public.event_candidate_ai_prefills.result is
  'Structured nullable suggestions used to prefill the human-reviewed website event form.';

create trigger event_candidate_ai_prefills_set_updated_at
before update on public.event_candidate_ai_prefills
for each row execute function public.set_updated_at();

alter table public.event_candidate_ai_prefills enable row level security;

revoke all privileges on table public.event_candidate_ai_prefills
  from anon, authenticated;

grant select, insert, update, delete on table public.event_candidate_ai_prefills
  to service_role;
