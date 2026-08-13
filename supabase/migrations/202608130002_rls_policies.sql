create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active') $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active' and role in ('staff','owner')) $$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active' and role = 'owner') $$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.is_active_user(), public.is_staff(), public.is_owner() to anon, authenticated;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
     and not public.is_owner() then
    raise exception 'only an active owner may change profile role or account status';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_profile_privileges() from public;
create trigger profiles_protect_privileges before update on public.profiles
for each row execute function public.protect_profile_privileges();

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.guides enable row level security;
alter table public.tags enable row level security;
alter table public.place_tags enable row level security;
alter table public.event_tags enable row level security;
alter table public.guide_tags enable row level security;
alter table public.place_relations enable row level security;
alter table public.guide_places enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.places, public.events, public.guides, public.tags,
  public.place_tags, public.event_tags, public.guide_tags, public.place_relations, public.guide_places
  to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.places, public.guides, public.tags,
  public.place_tags, public.event_tags, public.guide_tags, public.place_relations, public.guide_places
  to authenticated;

create policy profiles_read_self_or_staff on public.profiles for select to authenticated
using (id = auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_owner_update_any on public.profiles for update to authenticated
using (public.is_owner()) with check (public.is_owner());

create policy places_public_read on public.places for select to anon, authenticated
using (publication_status = 'published');
create policy places_staff_read on public.places for select to authenticated using (public.is_staff());
create policy places_staff_insert on public.places for insert to authenticated with check (public.is_staff());
create policy places_staff_update on public.places for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy places_staff_delete on public.places for delete to authenticated using (public.is_staff());

create policy guides_public_read on public.guides for select to anon, authenticated
using (publication_status = 'published');
create policy guides_staff_read on public.guides for select to authenticated using (public.is_staff());
create policy guides_staff_insert on public.guides for insert to authenticated with check (public.is_staff());
create policy guides_staff_update on public.guides for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy guides_staff_delete on public.guides for delete to authenticated using (public.is_staff());

create policy events_public_read on public.events for select to anon, authenticated
using (publication_status = 'published');
create policy events_staff_read on public.events for select to authenticated using (public.is_staff());
create policy events_owner_read on public.events for select to authenticated using (created_by = auth.uid());
create policy events_active_submit on public.events for insert to authenticated
with check (public.is_active_user() and created_by = auth.uid() and publication_status = 'pending' and published_at is null);
create policy events_owner_update_pending on public.events for update to authenticated
using (public.is_active_user() and created_by = auth.uid() and publication_status = 'pending')
with check (public.is_active_user() and created_by = auth.uid() and publication_status = 'pending' and published_at is null);
create policy events_owner_delete_pending on public.events for delete to authenticated
using (public.is_active_user() and created_by = auth.uid() and publication_status = 'pending');
create policy events_staff_insert on public.events for insert to authenticated with check (public.is_staff());
create policy events_staff_update on public.events for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy events_staff_delete on public.events for delete to authenticated using (public.is_staff());

create policy tags_public_read on public.tags for select to anon, authenticated using (true);
create policy tags_staff_insert on public.tags for insert to authenticated with check (public.is_staff());
create policy tags_staff_update on public.tags for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy tags_staff_delete on public.tags for delete to authenticated using (public.is_staff());

create policy place_tags_public_read on public.place_tags for select to anon, authenticated
using (exists (select 1 from public.places p where p.id = place_id and p.publication_status = 'published'));
create policy place_tags_staff_all on public.place_tags for all to authenticated
using (public.is_staff()) with check (public.is_staff());

create policy event_tags_public_read on public.event_tags for select to anon, authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.publication_status = 'published'));
create policy event_tags_owner_read on public.event_tags for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid()));
create policy event_tags_owner_insert on public.event_tags for insert to authenticated
with check (public.is_active_user() and exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid() and e.publication_status = 'pending'));
create policy event_tags_owner_delete on public.event_tags for delete to authenticated
using (public.is_active_user() and exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid() and e.publication_status = 'pending'));
create policy event_tags_staff_all on public.event_tags for all to authenticated
using (public.is_staff()) with check (public.is_staff());

create policy guide_tags_public_read on public.guide_tags for select to anon, authenticated
using (exists (select 1 from public.guides g where g.id = guide_id and g.publication_status = 'published'));
create policy guide_tags_staff_all on public.guide_tags for all to authenticated
using (public.is_staff()) with check (public.is_staff());

create policy place_relations_public_read on public.place_relations for select to anon, authenticated
using (
  exists (select 1 from public.places p where p.id = source_place_id and p.publication_status = 'published')
  and exists (select 1 from public.places p where p.id = target_place_id and p.publication_status = 'published')
);
create policy place_relations_staff_all on public.place_relations for all to authenticated
using (public.is_staff()) with check (public.is_staff());

create policy guide_places_public_read on public.guide_places for select to anon, authenticated
using (
  exists (select 1 from public.guides g where g.id = guide_id and g.publication_status = 'published')
  and exists (select 1 from public.places p where p.id = place_id and p.publication_status = 'published')
);
create policy guide_places_staff_all on public.guide_places for all to authenticated
using (public.is_staff()) with check (public.is_staff());
