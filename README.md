# Pedrinho Tracker

App web (PWA) para acompanhar a rotina do bebê: mamadas, mamadeira, sono, fraldas,
crescimento (curva OMS), saúde, vacinas, marcos, sons de ninar e relatório para o pediatra.

- **Guia de instalação passo a passo:** veja o documento que acompanha este projeto.
- **Sincronização entre celulares (opcional):** rode o arquivo `supabase.sql` no Supabase.

## Estrutura

```
src/app/            página principal, layout e estilos
src/components/     telas e peças visuais
src/lib/            lógica: dados, sincronização, previsão de soneca, curvas da OMS
public/             ícones, manifesto do app e modo offline (sw.js)
supabase.sql        banco de dados da sincronização
```

## Rodar no computador

```
npm install
npm run dev
```

Variáveis opcionais (`.env.local`) para já deixar a sincronização configurada:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
```


## Avisos no celular (push) — opcional

Funcionam mesmo com o app fechado (no iPhone: iOS 16.4 ou mais novo, app na Tela de Início).

1. Sincronização ligada (Supabase + `supabase.sql`).
2. No Supabase: rode `supabase-push.sql` e depois `supabase-cron.sql` (com o segredo trocado).
3. Na Vercel, em *Settings → Environment Variables*: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`. Depois, *Redeploy*.
4. Em cada celular: *Mais → Configurações → Avisos no celular → Ativar*.

O Supabase chama `/api/push/tick` a cada minuto; o app calcula o que avisar (mamada no intervalo combinado, consultas e vacinas a 7, 3 e 1 dia e às 6h do dia) e envia pelo serviço de push do celular.
