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
