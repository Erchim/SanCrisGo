alter table public.event_candidates
  add column moderation_sent_at timestamptz;

comment on column public.event_candidates.moderation_sent_at is
  'Set after the candidate has been successfully sent to the moderation chat.';
