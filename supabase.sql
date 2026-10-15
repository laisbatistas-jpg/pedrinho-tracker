-- =====================================================================
--  Pedrinho Tracker — banco de dados da sincronização (Supabase)
--  Cole TUDO isto no "SQL Editor" do Supabase e clique em "Run".
--  Pode rodar de novo sem problema (não apaga nada).
-- =====================================================================

-- 1) Tabela única que guarda todos os registros da família
create table if not exists public.records (
  family     text    not null,            -- código da família
  kind       text    not null,            -- tipo: event, growth, health...
  id         text    not null,            -- identificador do registro
  data       jsonb,                       -- conteúdo
  updated_at bigint  not null,            -- quando mudou (milissegundos)
  deleted    boolean not null default false,
  primary key (family, kind, id)
);

create index if not exists records_family_updated
  on public.records (family, updated_at);

-- 2) Segurança: ninguém acessa a tabela diretamente,
--    só através das duas funções abaixo (que exigem o código da família)
alter table public.records enable row level security;
revoke all on table public.records from anon, authenticated;

-- 3) Função que ENVIA registros
create or replace function public.push_records(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows precisa ser uma lista';
  end if;
  if jsonb_array_length(p_rows) > 100 then
    raise exception 'lote grande demais';
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    if length(coalesce(r->>'family', '')) < 8 then
      raise exception 'codigo da familia precisa ter pelo menos 8 caracteres';
    end if;

    insert into public.records (family, kind, id, data, updated_at, deleted)
    values (
      r->>'family',
      r->>'kind',
      r->>'id',
      r->'data',
      (r->>'updated_at')::bigint,
      coalesce((r->>'deleted')::boolean, false)
    )
    on conflict (family, kind, id) do update
      set data       = excluded.data,
          updated_at = excluded.updated_at,
          deleted    = excluded.deleted
      where public.records.updated_at < excluded.updated_at;  -- o mais novo sempre vence
  end loop;
end;
$$;

-- 4) Função que BUSCA o que mudou desde a última vez
create or replace function public.pull_records(p_family text, p_since bigint)
returns table (
  family     text,
  id         text,
  kind       text,
  data       jsonb,
  updated_at bigint,
  deleted    boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select r.family, r.id, r.kind, r.data, r.updated_at, r.deleted
  from public.records r
  where length(coalesce(p_family, '')) >= 8
    and r.family = p_family
    and r.updated_at > p_since
  order by r.updated_at asc
  limit 2000;
$$;

-- 5) Libera só as duas funções para o app
grant execute on function public.push_records(jsonb)        to anon, authenticated;
grant execute on function public.pull_records(text, bigint) to anon, authenticated;
