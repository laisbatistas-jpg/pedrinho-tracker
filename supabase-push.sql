-- =====================================================================
--  Pedrinho Tracker — avisos no celular (push)
--  Rode DEPOIS do supabase.sql. Cole no "SQL Editor" e clique em "Run".
--  Pode rodar de novo sem problema.
--
--  Cria as tabelas e funções dos avisos. O "relógio" que chama o app a cada
--  minuto está em outro arquivo: supabase-cron.sql.
-- =====================================================================

-- celulares que querem receber aviso
create table if not exists public.push_subs (
  family     text        not null,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  tz         text        not null default 'America/Sao_Paulo',
  who        text,
  created_at timestamptz not null default now(),
  primary key (family, endpoint)
);

-- avisos já enviados (para não repetir)
create table if not exists public.push_sent (
  family  text        not null,
  key     text        not null,
  sent_at timestamptz not null default now(),
  primary key (family, key)
);

-- ninguém acessa as tabelas diretamente (só o servidor do app e as funções abaixo)
alter table public.push_subs enable row level security;
alter table public.push_sent enable row level security;
revoke all on table public.push_subs from anon, authenticated;
revoke all on table public.push_sent from anon, authenticated;

create or replace function public.push_subscribe(
  p_family   text,
  p_endpoint text,
  p_p256dh   text,
  p_auth     text,
  p_tz       text default 'America/Sao_Paulo',
  p_who      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(coalesce(p_family, '')) < 8 then
    raise exception 'codigo da familia precisa ter pelo menos 8 caracteres';
  end if;
  if coalesce(p_endpoint, '') !~ '^https://' or length(p_endpoint) > 1000 then
    raise exception 'endereco do celular invalido';
  end if;
  if length(coalesce(p_p256dh, '')) = 0 or length(coalesce(p_auth, '')) = 0 then
    raise exception 'chaves ausentes';
  end if;
  -- no máximo 10 celulares por família
  if (select count(*) from public.push_subs where family = p_family and endpoint <> p_endpoint) >= 10 then
    raise exception 'celulares demais para esta familia';
  end if;

  insert into public.push_subs (family, endpoint, p256dh, auth, tz, who)
  values (p_family, p_endpoint, p_p256dh, p_auth, coalesce(nullif(p_tz, ''), 'America/Sao_Paulo'), p_who)
  on conflict (family, endpoint) do update
    set p256dh = excluded.p256dh,
        auth   = excluded.auth,
        tz     = excluded.tz,
        who    = excluded.who;
end;
$$;

create or replace function public.push_unsubscribe(p_family text, p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_subs where family = p_family and endpoint = p_endpoint;
end;
$$;

grant execute on function public.push_subscribe(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.push_unsubscribe(text, text) to anon, authenticated;
