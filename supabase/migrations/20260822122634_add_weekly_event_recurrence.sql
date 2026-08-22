alter table public.events
  add column recurrence_frequency text not null default 'none',
  add column recurrence_until date;

alter table public.events
  add constraint events_recurrence_frequency_check
    check (recurrence_frequency in ('none', 'weekly')),
  add constraint events_recurrence_state_check
    check (
      (recurrence_frequency = 'none' and recurrence_until is null)
      or (
        recurrence_frequency = 'weekly'
        and (recurrence_until is null or recurrence_until >= starts_on)
      )
    );

comment on column public.events.recurrence_frequency is
  'Typed recurrence frequency. Weekly recurrence is anchored to starts_on; none is a one-time event.';
comment on column public.events.recurrence_until is
  'Inclusive final occurrence start date for a recurring event, when known.';
