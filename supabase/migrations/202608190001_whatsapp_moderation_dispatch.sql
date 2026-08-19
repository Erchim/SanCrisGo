alter table public.event_candidates
  add column moderation_dispatching_at timestamptz,
  add column moderation_sent_at timestamptz;

comment on column public.event_candidates.moderation_dispatching_at is
  'Atomic claim timestamp retained when Telegram delivery is ambiguous.';

comment on column public.event_candidates.moderation_sent_at is
  'Set after the candidate has been successfully sent to the moderation chat.';
