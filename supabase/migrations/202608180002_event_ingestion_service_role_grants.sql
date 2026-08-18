grant select, insert, update, delete
on table
  public.event_candidates,
  public.event_candidate_messages,
  public.event_publications
to service_role;
