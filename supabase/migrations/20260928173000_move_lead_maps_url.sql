begin;

alter table public.leads
  add column if not exists google_maps_url text;

update public.leads
set google_maps_url = null
where google_maps_url is not null
  and btrim(google_maps_url) = '';

update public.leads
set google_maps_url = btrim(notes),
    notes = null
where nullif(btrim(google_maps_url), '') is null
  and btrim(coalesce(notes, '')) ~*
    '^https?://(([^/]+\.)?google\.(com|com\.br)/maps|maps\.app\.goo\.gl/|goo\.gl/maps)';

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'leads_google_maps_url_not_blank'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_google_maps_url_not_blank
      check (google_maps_url is null or btrim(google_maps_url) <> '');
  end if;
end;
$$;

create or replace function public.prospecta_move_lead_maps_note()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if nullif(btrim(new.google_maps_url), '') is null
     and btrim(coalesce(new.notes, '')) ~*
       '^https?://(([^/]+\.)?google\.(com|com\.br)/maps|maps\.app\.goo\.gl/|goo\.gl/maps)'
  then
    new.google_maps_url := btrim(new.notes);
    new.notes := null;
  end if;
  return new;
end;
$$;

drop trigger if exists prospecta_leads_move_maps_note on public.leads;
create trigger prospecta_leads_move_maps_note
before insert or update of notes, google_maps_url on public.leads
for each row execute function public.prospecta_move_lead_maps_note();

revoke all on function public.prospecta_move_lead_maps_note()
  from public, anon, authenticated;

create or replace function public.prospecta_delete_bot_config(
  p_bot_id uuid,
  p_expected_version bigint
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.prospecta_can_access_bot(p_bot_id) then
    raise exception 'Acesso negado ao bot' using errcode = '42501';
  end if;

  update public.prospecta_bot_configs
  set deleted_at = clock_timestamp()
  where id = p_bot_id
    and version = p_expected_version
    and deleted_at is null;

  return found;
end;
$$;

revoke all on function public.prospecta_delete_bot_config(uuid, bigint)
  from public, anon, authenticated;
grant execute on function public.prospecta_delete_bot_config(uuid, bigint)
  to service_role, authenticated;

notify pgrst, 'reload schema';

commit;
