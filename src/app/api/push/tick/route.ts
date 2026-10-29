import { PUSH_PUBLIC_KEY } from "@/lib/pushKey";
import { planPushes, type PlanEvent, type PlanHealth, type PlanVaccine, type PlanVisit } from "@/lib/pushPlan";
import { inList, loadWebPush, missingEnv, readEnv, rest } from "@/lib/pushServer";
import { VACCINES } from "@/lib/reference";

export const runtime = "nodejs";
export const maxDuration = 30;

type Sub = { family: string; endpoint: string; p256dh: string; auth: string; tz: string };
type Row = { kind: string; id: string; data: Record<string, unknown> | null };

const vaccineNames: Record<string, string> = Object.fromEntries(VACCINES.map((v) => [v.key, `${v.name} (${v.dose})`]));

/**
 * Chamado a cada minuto pelo Supabase (pg_cron). Vê o que está na hora de avisar
 * e envia a notificação para os celulares cadastrados da família.
 */
export async function GET(request: Request) {
  const env = readEnv();
  if (!env) return Response.json({ ok: false, error: "faltam variáveis", missing: missingEnv() }, { status: 500 });
  if (request.headers.get("x-cron-secret") !== env.cronSecret) return new Response("não autorizado", { status: 401 });

  let wp: Awaited<ReturnType<typeof loadWebPush>>;
  try {
    wp = await loadWebPush();
  } catch (e) {
    return Response.json({ ok: false, etapa: "carregar web-push", error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  try {
    wp.setVapidDetails("https://pedrinho-tracker.vercel.app", PUSH_PUBLIC_KEY, env.vapidPrivate);
  } catch (e) {
    return Response.json({ ok: false, etapa: "chave VAPID", tamanho: env.vapidPrivate.length, esperado: 43, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }

  const now = Date.now();
  let subs: Sub[];
  try {
    subs = await rest<Sub[]>(env, "push_subs?select=family,endpoint,p256dh,auth,tz");
  } catch (e) {
    const k = env.serviceKey;
    const dica = {
      comecaCom: k.slice(0, 10),
      tamanho: k.length,
      temPontinhos: /[•…]/.test(k),
      tipo: k.startsWith("sb_secret_") ? "sb_secret (esperado ~41 a 60 caracteres)" : k.startsWith("eyJ") ? "service_role antiga (esperado ~200+ caracteres)" : k.startsWith("sb_publishable_") ? "ERRADA: e a chave publishable" : "formato desconhecido",
    };
    return Response.json({ ok: false, etapa: "ler celulares no Supabase", dica, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  const byFamily = new Map<string, Sub[]>();
  for (const s of subs) byFamily.set(s.family, [...(byFamily.get(s.family) ?? []), s]);

  let sent = 0;
  let removed = 0;
  const errors: string[] = [];

  for (const [family, list] of byFamily) {
    try {
      const fam = `family=eq.${encodeURIComponent(family)}&deleted=eq.false`;
      const [others, evs, hl] = await Promise.all([
        rest<Row[]>(env, `records?${fam}&kind=in.(settings,visit,vaccine,timer)&select=kind,id,data`),
        rest<Row[]>(env, `records?${fam}&kind=eq.event&order=updated_at.desc&limit=400&select=kind,id,data`),
        rest<Row[]>(env, `records?${fam}&kind=eq.health&order=updated_at.desc&limit=120&select=kind,id,data`),
      ]);

      const settingsRow = others.find((r) => r.kind === "settings" && r.id === "main");
      const settings = (settingsRow?.data ?? {}) as {
        name?: string;
        alertFeedHours?: number;
        alertFeedLeadMin?: number;
        alertPoopDays?: number;
        alertDailySummary?: boolean;
        birthDate?: string;
      };
      const timerRow = others.find((r) => r.kind === "timer" && r.id === "main");
      const timerActive = Boolean((timerRow?.data as { active?: unknown } | null)?.active);

      const vaccines: Record<string, PlanVaccine> = {};
      for (const r of others) if (r.kind === "vaccine" && r.data) vaccines[r.id] = r.data as PlanVaccine;

      const plan = planPushes({
        now,
        tz: list[0].tz || "America/Sao_Paulo",
        name: settings.name || "Pedrinho",
        settings,
        timerActive,
        events: evs.filter((r) => r.data).map((r) => ({ ...(r.data as object), id: r.id }) as PlanEvent),
        visits: others.filter((r) => r.kind === "visit" && r.data).map((r) => ({ ...(r.data as object), id: r.id }) as PlanVisit),
        vaccines,
        vaccineNames,
        health: hl.filter((r) => r.data).map((r) => ({ ...(r.data as object), id: r.id }) as PlanHealth),
      });
      if (plan.length === 0) continue;

      const already = await rest<{ key: string }[]>(
        env,
        `push_sent?family=eq.${encodeURIComponent(family)}&key=${encodeURIComponent(inList(plan.map((p) => p.key)))}&select=key`
      );
      const done = new Set(already.map((a) => a.key));
      const fresh = plan.filter((p) => !done.has(p.key));

      for (const p of fresh) {
        const payload = JSON.stringify({ title: p.title, body: p.body, tag: p.key, url: "/" });
        const targets = [...list];
        const results = await Promise.allSettled(
          targets.map((s) =>
            wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
              TTL: 3600,
              urgency: "high",
            })
          )
        );
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          if (r.status === "fulfilled") {
            sent++;
          } else {
            const code = (r.reason as { statusCode?: number })?.statusCode;
            if (code === 404 || code === 410) {
              await rest(env, `push_subs?family=eq.${encodeURIComponent(family)}&endpoint=eq.${encodeURIComponent(targets[i].endpoint)}`, {
                method: "DELETE",
              });
              const at = list.indexOf(targets[i]);
              if (at >= 0) list.splice(at, 1); // não tenta de novo neste ciclo
              removed++;
            } else {
              errors.push(`envio falhou (${code ?? "?"})`);
            }
          }
        }
        await rest(env, "push_sent", {
          method: "POST",
          body: [{ family, key: p.key }],
          prefer: "resolution=ignore-duplicates,return=minimal",
        });
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "erro");
    }
  }

  // limpeza ocasional de avisos antigos
  if (Math.random() < 0.02) {
    const cut = new Date(now - 30 * 86400000).toISOString();
    await rest(env, `push_sent?sent_at=lt.${encodeURIComponent(cut)}`, { method: "DELETE" }).catch(() => null);
  }

  return Response.json({ ok: errors.length === 0, families: byFamily.size, sent, removed, errors });
}
