import { VACCINES, visitKindLabel } from "./reference";
import type { VaccineRecord, Visit, VisitKind } from "./types";
import { DAY, formatClock, formatDate, pad, startOfDay } from "./utils";

/** Compromisso futuro (consulta ou vacina agendada), em formato único para avisos e telas. */
export type Appointment = {
  key: string; // identifica o compromisso (para avisar uma vez por etapa)
  source: "visit" | "vaccine";
  id: string; // id da consulta ou chave da vacina
  title: string;
  timestamp: number;
  place?: string;
  address?: string;
  doctor?: string;
  reason?: string;
};

const VISIT_TITLE: Record<VisitKind, string> = {
  pediatra: "Consulta pediátrica",
  retorno: "Retorno",
  exame: "Exame",
  vacina: "Vacina",
  especialista: "Consulta com especialista",
  outro: "Compromisso de saúde",
};
export const visitTitle = (k: VisitKind) => VISIT_TITLE[k] ?? visitKindLabel(k);

/** Todos os compromissos ainda não realizados, do mais cedo para o mais tarde. */
export function listAppointments(visits: Visit[], vaccines: Record<string, VaccineRecord>): Appointment[] {
  const out: Appointment[] = [];
  for (const v of visits) {
    if (v.status !== "agendada") continue;
    out.push({
      key: `visit-${v.id}`,
      source: "visit",
      id: v.id,
      title: visitTitle(v.kind),
      timestamp: v.timestamp,
      place: v.place,
      address: v.address,
      doctor: v.doctor,
      reason: v.reason,
    });
  }
  for (const [k, rec] of Object.entries(vaccines)) {
    if (rec.doneAt || !rec.scheduledAt) continue;
    const def = VACCINES.find((d) => d.key === k);
    out.push({
      key: `vaccine-${k}`,
      source: "vaccine",
      id: k,
      title: `Vacina: ${def ? `${def.name} (${def.dose})` : k}`,
      timestamp: rec.scheduledAt,
      place: rec.place,
      address: rec.address,
      doctor: rec.applier,
    });
  }
  return out.sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}

/** Dias de calendário entre hoje e o compromisso (0 = hoje). */
export const daysUntil = (ts: number, now: number) => Math.round((startOfDay(ts) - startOfDay(now)) / DAY);

export type Stage = "d7" | "d3" | "d1" | "today";

/**
 * Etapa de aviso: 7 dias antes (4–7 dias), 3 dias (2–3), 1 dia (amanhã)
 * e no próprio dia a partir das 6h da manhã.
 */
export function stageFor(ts: number, now: number): Stage | null {
  if (ts <= now) return null;
  const d = daysUntil(ts, now);
  if (d === 0) return new Date(now).getHours() >= 6 ? "today" : null;
  if (d === 1) return "d1";
  if (d >= 2 && d <= 3) return "d3";
  if (d >= 4 && d <= 7) return "d7";
  return null;
}

export function countdownLabel(ts: number, now: number): string {
  if (ts <= now) return "Já passou";
  const d = daysUntil(ts, now);
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  return `em ${d} dias`;
}

export const placeLine = (a: { place?: string; address?: string }) =>
  [a.place, a.address].filter(Boolean).join(" — ");

/** Texto do aviso para uma etapa. */
export function alertFor(a: Appointment, stage: Stage, now: number): { title: string; text: string } {
  const when = `${formatDate(a.timestamp).slice(0, 5)} às ${formatClock(a.timestamp)}`;
  const where = placeLine(a);
  const who = a.doctor ? `com ${a.doctor}` : "";
  const tail = [who, where].filter(Boolean).join(" • ");
  if (stage === "today") {
    return { title: `Hoje: ${a.title}`, text: `Às ${formatClock(a.timestamp)}${tail ? ` • ${tail}` : ""}.` };
  }
  if (stage === "d1") {
    return { title: `Amanhã: ${a.title}`, text: `Às ${formatClock(a.timestamp)}${tail ? ` • ${tail}` : ""}.` };
  }
  return {
    title: `Em ${daysUntil(a.timestamp, now)} dias: ${a.title}`,
    text: `${when}${tail ? ` • ${tail}` : ""}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Lembrete no calendário do celular (.ics)                            */
/* ------------------------------------------------------------------ */

const icsDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};
const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Cria um evento com avisos 7 dias antes, 1 dia antes e às 6h do próprio dia. */
export function buildIcs(a: Appointment, babyName: string): string {
  const stamp = icsDate(Date.now());
  const loc = placeLine(a);
  const desc = [a.doctor ? `Com: ${a.doctor}` : "", a.reason ? `Motivo: ${a.reason}` : ""].filter(Boolean).join("\n");
  const alarm = (trigger: string, text: string) =>
    ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(text)}`, `TRIGGER:${trigger}`, "END:VALARM"].join("\r\n");

  const alarms = [alarm("-P7D", `Em 7 dias: ${a.title}`), alarm("-P1D", `Amanhã: ${a.title}`)];
  const sixAm = startOfDay(a.timestamp) + 6 * 3600000;
  const minutesBefore = Math.round((a.timestamp - sixAm) / 60000);
  if (minutesBefore > 0) alarms.push(alarm(`-PT${minutesBefore}M`, `Hoje: ${a.title}`));
  else alarms.push(alarm("-PT30M", `Daqui a pouco: ${a.title}`));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pedrinho Tracker//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${icsEsc(a.key)}@pedrinho-tracker`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(a.timestamp)}`,
    `DTEND:${icsDate(a.timestamp + 3600000)}`,
    `SUMMARY:${icsEsc(`${babyName}: ${a.title}`)}`,
    loc ? `LOCATION:${icsEsc(loc)}` : "",
    desc ? `DESCRIPTION:${icsEsc(desc)}` : "",
    ...alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(a: Appointment, babyName: string) {
  const blob = new Blob([buildIcs(a, babyName)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lembrete-pedrinho.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
