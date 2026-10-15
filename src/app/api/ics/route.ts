import { buildIcs, type Appointment } from "@/lib/agenda";

/**
 * Entrega um lembrete (.ics) para o iPhone abrir direto no Calendário.
 * Não guarda nada: tudo vem no endereço (nome, data, local).
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const cut = (k: string, n: number) => (q.get(k) ?? "").slice(0, n) || undefined;

  const ts = Number(q.get("s"));
  if (!Number.isFinite(ts) || ts <= 0) return new Response("Data inválida", { status: 400 });

  const appt: Appointment = {
    key: cut("k", 80) ?? `lembrete-${ts}`,
    source: q.get("src") === "vaccine" ? "vaccine" : "visit",
    id: cut("k", 80) ?? String(ts),
    title: cut("t", 120) ?? "Compromisso de saúde",
    timestamp: ts,
    place: cut("p", 200),
    address: cut("a", 300),
    doctor: cut("d", 120),
    reason: cut("r", 400),
  };

  return new Response(buildIcs(appt, cut("n", 60) ?? "Pedrinho"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="lembrete-pedrinho.ics"',
      "Cache-Control": "no-store",
    },
  });
}
