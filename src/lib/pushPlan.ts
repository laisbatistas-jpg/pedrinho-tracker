/**
 * Decide quais avisos push enviar agora (roda no servidor, a cada minuto).
 * Não usa nada do navegador: recebe os dados e o fuso horário e devolve a lista.
 * Cada aviso tem uma "chave" única; o servidor guarda as chaves já enviadas para não repetir.
 */

export type PlanEvent = { id: string; type: string; timestamp: number };
export type PlanVisit = {
  id: string;
  kind?: string;
  status?: string;
  timestamp: number;
  doctor?: string;
  place?: string;
  address?: string;
};
export type PlanVaccine = {
  doneAt?: number | null;
  scheduledAt?: number | null;
  place?: string;
  address?: string;
  applier?: string;
};

export type PlanInput = {
  now: number;
  tz: string;
  name: string;
  settings: { alertFeedHours?: number; alertFeedLeadMin?: number };
  timerActive: boolean;
  events: PlanEvent[]; // mais recentes primeiro (ou qualquer ordem)
  visits: PlanVisit[];
  vaccines: Record<string, PlanVaccine>;
  vaccineNames?: Record<string, string>;
};

export type PlannedPush = { key: string; title: string; body: string };

const MIN = 60000;
const DAY = 86400000;

const VISIT_TITLE: Record<string, string> = {
  pediatra: "Consulta pediátrica",
  retorno: "Retorno",
  exame: "Exame",
  vacina: "Vacina",
  especialista: "Consulta com especialista",
  outro: "Compromisso de saúde",
};

function parts(ts: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ts))) o[p.type] = p.value;
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour, mi: +o.minute };
}

/** Número do dia no fuso (para comparar "hoje", "amanhã"…). */
export const localDay = (ts: number, tz: string) => {
  const p = parts(ts, tz);
  return Math.round(Date.UTC(p.y, p.mo - 1, p.d) / DAY);
};
export const localHour = (ts: number, tz: string) => parts(ts, tz).h;

const pad = (n: number) => String(n).padStart(2, "0");
export const clockOf = (ts: number, tz: string) => {
  const p = parts(ts, tz);
  return `${pad(p.h)}:${pad(p.mi)}`;
};
export const dayMonthOf = (ts: number, tz: string) => {
  const p = parts(ts, tz);
  return `${pad(p.d)}/${pad(p.mo)}`;
};

function dur(min: number) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h${pad(r)}`;
  if (h > 0) return `${h}h`;
  return `${r} min`;
}

export function planPushes(input: PlanInput): PlannedPush[] {
  const { now, tz, name, settings, timerActive, events, visits, vaccines, vaccineNames = {} } = input;
  const out: PlannedPush[] = [];

  /* ---------- mamadas ---------- */
  const hours = settings.alertFeedHours ?? 0;
  if (hours > 0 && !timerActive) {
    const feeds = events.filter((e) => e.type === "amamentacao" || e.type === "mamadeira");
    const last = feeds.reduce<PlanEvent | null>((a, e) => (!a || e.timestamp > a.timestamp ? e : a), null);
    if (last) {
      const intervalMin = Math.round(hours * 60);
      const dueAt = last.timestamp + intervalMin * MIN;
      const lead = Math.max(0, settings.alertFeedLeadMin ?? 0) * MIN;
      const every = dur(intervalMin);
      if (now >= dueAt) {
        // não insiste se o app ficou sem uso por muito tempo
        if (now - dueAt < 4 * 60 * MIN) {
          out.push({
            key: `feed:${last.id}:due`,
            title: `Hora da mamada! (${name})`,
            body: `Faz ${dur((now - last.timestamp) / MIN)} desde a última (intervalo de ${every}).`,
          });
        }
      } else if (lead > 0 && now >= dueAt - lead) {
        out.push({
          key: `feed:${last.id}:soon`,
          title: `Mamada em ${Math.max(1, Math.ceil((dueAt - now) / MIN))} min (${name})`,
          body: `Prevista para ${clockOf(dueAt, tz)} (intervalo de ${every}).`,
        });
      }
    }
  }

  /* ---------- consultas e vacinas agendadas ---------- */
  type Appt = { key: string; title: string; ts: number; place?: string; address?: string; who?: string };
  const appts: Appt[] = [];
  for (const v of visits) {
    if (v.status !== "agendada") continue;
    appts.push({
      key: `visit-${v.id}`,
      title: VISIT_TITLE[v.kind ?? "outro"] ?? "Compromisso de saúde",
      ts: v.timestamp,
      place: v.place,
      address: v.address,
      who: v.doctor,
    });
  }
  for (const [k, r] of Object.entries(vaccines)) {
    if (r.doneAt || !r.scheduledAt) continue;
    appts.push({
      key: `vaccine-${k}`,
      title: `Vacina: ${vaccineNames[k] ?? k}`,
      ts: r.scheduledAt,
      place: r.place,
      address: r.address,
      who: r.applier,
    });
  }

  for (const a of appts) {
    if (a.ts <= now) continue;
    const diff = localDay(a.ts, tz) - localDay(now, tz);
    let stage: "d7" | "d3" | "d1" | "today" | null = null;
    if (diff === 0) stage = localHour(now, tz) >= 6 ? "today" : null;
    else if (diff === 1) stage = "d1";
    else if (diff >= 2 && diff <= 3) stage = "d3";
    else if (diff >= 4 && diff <= 7) stage = "d7";
    if (!stage) continue;

    const where = [a.place, a.address].filter(Boolean).join(" — ");
    const tail = [a.who ? `com ${a.who}` : "", where].filter(Boolean).join(" • ");
    const at = clockOf(a.ts, tz);
    let title: string;
    let body: string;
    if (stage === "today") {
      title = `Hoje: ${a.title}`;
      body = `Às ${at}${tail ? ` • ${tail}` : ""}.`;
    } else if (stage === "d1") {
      title = `Amanhã: ${a.title}`;
      body = `Às ${at}${tail ? ` • ${tail}` : ""}.`;
    } else {
      title = `Em ${diff} dias: ${a.title}`;
      body = `${dayMonthOf(a.ts, tz)} às ${at}${tail ? ` • ${tail}` : ""}.`;
    }
    // mesma chave do aviso local do app: se os dois chegarem, um substitui o outro
    out.push({ key: `${a.key}:${stage}`, title, body });
  }

  return out;
}
