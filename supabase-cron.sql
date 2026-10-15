-- =====================================================================
--  Pedrinho Tracker — "relógio" dos avisos (chama o app a cada minuto)
--  Rode DEPOIS do supabase-push.sql.
--  Troque SEU_SEGREDO pelo valor de CRON_SECRET (o mesmo cadastrado na Vercel).
--  NÃO salve o segredo de verdade neste arquivo do GitHub.
-- =====================================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.schedule(
  'pedrinho-avisos',
  '* * * * *',
  $cron$
    select net.http_get(
      url     := 'https://pedrinho-tracker.vercel.app/api/push/tick',
      headers := jsonb_build_object('x-cron-secret', 'SEU_SEGREDO')
    );
  $cron$
);

-- Para PARAR os avisos automáticos:  select cron.unschedule('pedrinho-avisos');
