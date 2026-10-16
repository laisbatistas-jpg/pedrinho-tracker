"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, ScreenHeader, WeekChart } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { placeLine, visitTitle } from "@/lib/agenda";
import { VACCINES } from "@/lib/reference";
import {
  DAY, POOP_COLORS, WEEKDAY_LETTER, ageInMonths, ageLabel, fmtNum, formatClock, formatDate, formatDur, isFeed, isPoop, poopSummary, startOfDay,
} from "@/lib/utils";
import { growthPercentile } from "@/lib/reference";

export function ReportScreen({ app, go }: ScreenProps) {
  const [days, setDays] = useState(7);
  const { settings, events, growth, health, vaccines, visits, now } = app;
  const nowTs = now || Date.now();

  const data = useMemo(() => {
    const today0 = startOfDay(nowTs);
    const rows = Array.from({ length: days }, (_, k) => {
      const start = today0 - (days - 1 - k) * DAY;
      const day = events.filter((e) => e.timestamp >= start && e.timestamp < start + DAY);
      const sleeps = day.filter((e) => e.type === "sono");
      return {
        start,
        letter: WEEKDAY_LETTER[new Date(start).getDay()],
        feeds: day.filter(isFeed).length,
        breast: day.filter((e) => e.type === "amamentacao").length,
        breastSec: day.filter((e) => e.type === "amamentacao").reduce((a, e) => a + (e.duration || 0), 0),
        poops: day.filter(isPoop).length,
        ml: day.filter((e) => e.type === "mamadeira").reduce((a, e) => a + (e.ml || 0), 0),
        naps: sleeps.length,
        sleep: sleeps.reduce((a, e) => a + (e.duration || 0), 0),
        wet: day.filter((e) => e.type === "fralda" && e.diaper !== "suja").length,
        dirty: day.filter((e) => e.type === "fralda" && e.diaper !== "molhada").length,
        diapers: day.filter((e) => e.type === "fralda").length,
      };
    });
    const withData = rows.filter((r) => r.feeds + r.sleep + r.diapers > 0);
    const avg = (f: (r: (typeof rows)[number]) => number) =>
      withData.length ? withData.reduce((a, r) => a + f(r), 0) / withData.length : 0;
    return { rows, withData, avg, from: today0 - (days - 1) * DAY };
  }, [events, days, nowTs]);

  const poopEvents = events.filter((e) => isPoop(e) && e.timestamp >= data.from);
  const poopColors = POOP_COLORS.map((c) => ({ label: c.label, n: poopEvents.filter((e) => e.poop?.color === c.value).length })).filter((c) => c.n > 0);
  const poopDetailed = poopEvents.filter((e) => e.poop && poopSummary(e.poop));
  const growthRows = [...growth].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  const meds = health.filter((h) => h.kind === "remedio" && h.timestamp >= data.from);
  const temps = health.filter((h) => h.kind === "temperatura" && h.timestamp >= data.from);
  const symptoms = health.filter((h) => h.kind === "sintoma" && h.timestamp >= data.from);
  const doneVaccines = Object.entries(vaccines).filter(([, v]) => v.doneAt);
  const doneVisits = visits.filter((v) => v.status === "realizada" && v.timestamp >= data.from - 0).sort((x, y) => y.timestamp - x.timestamp);

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Relatório"
        subtitle="Para mostrar ao pediatra"
        onBack={() => go("mais")}
        right={
          <button onClick={() => window.print()} className="btn-grad px-4 h-10 rounded-full font-semibold flex items-center gap-2 text-sm">
            <Icon name="file" className="w-4 h-4" /> Salvar PDF
          </button>
        }
      />

      <div className="no-print mb-4 space-y-2">
        <Chips<number>
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: "7 dias" },
            { value: 14, label: "14 dias" },
            { value: 30, label: "30 dias" },
          ]}
        />
        <p className="text-xs text-[var(--muted)]">
          Toque em “Salvar PDF” e, na janela que abrir, escolha “Salvar como PDF” (no iPhone: compartilhar → Salvar em Arquivos).
        </p>
      </div>

      <div className="print-area space-y-4 fade-in">
        <section className="glass p-5">
          <h1 className="text-2xl font-bold">{settings.name} — relatório de rotina</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Período: {formatDate(data.from)} a {formatDate(nowTs)} ({days} dias)
            {settings.birthDate ? ` • idade: ${ageLabel(settings.birthDate, nowTs)}` : ""}
          </p>
          <p className="text-sm text-[var(--muted)]">Gerado em {formatDate(nowTs)} às {formatClock(nowTs)}</p>
        </section>

        <section className="glass p-5">
          <h2 className="font-semibold text-lg mb-3">Médias diárias</h2>
          <p className="text-xs text-[var(--muted)] mb-3">
            Calculadas sobre {data.withData.length} {data.withData.length === 1 ? "dia" : "dias"} com registro.
          </p>
          <table className="w-full text-sm">
            <tbody>
              <tr><td>Mamadas (peito + mamadeira)</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.feeds), 1)} por dia</td></tr>
              <tr><td>Tempo no peito</td><td className="text-right font-semibold">{formatDur(Math.round(data.avg((r) => r.breastSec)))} por dia</td></tr>
              <tr><td>Mamadeira</td><td className="text-right font-semibold">{Math.round(data.avg((r) => r.ml))} ml por dia</td></tr>
              <tr><td>Sono total</td><td className="text-right font-semibold">{formatDur(Math.round(data.avg((r) => r.sleep)))} por dia</td></tr>
              <tr><td>Sonecas</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.naps), 1)} por dia</td></tr>
              <tr><td>Fraldas (molhadas / sujas)</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.wet), 1)} / {fmtNum(data.avg((r) => r.dirty), 1)} por dia</td></tr>
              <tr><td>Cocôs</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.poops), 1)} por dia</td></tr>
            </tbody>
          </table>
        </section>

        {days <= 14 && (
          <section className="glass p-5 no-print">
            <h2 className="font-semibold text-lg mb-3">Mamadas por dia</h2>
            <WeekChart letters={data.rows.map((r) => r.letter)} values={data.rows.map((r) => r.feeds)} format={(v) => `${v}`} />
            <h2 className="font-semibold text-lg mt-6 mb-3">Sono por dia</h2>
            <WeekChart
              letters={data.rows.map((r) => r.letter)}
              values={data.rows.map((r) => r.sleep)}
              format={(v) => (v > 0 ? `${fmtNum(v / 3600, 1)}h` : "0")}
            />
          </section>
        )}

        <section className="glass p-5">
          <h2 className="font-semibold text-lg mb-3">Dia a dia</h2>
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <th>Dia</th><th>Mam.</th><th>Peito</th><th>ml</th><th>Sono</th><th>Fral.</th><th>Cocôs</th>
              </tr>
            </thead>
            <tbody>
              {[...data.rows].reverse().map((r) => (
                <tr key={r.start}>
                  <td>{formatDate(r.start).slice(0, 5)}</td>
                  <td>{r.feeds}</td>
                  <td>{r.breastSec ? formatDur(r.breastSec) : "—"}</td>
                  <td>{r.ml || "—"}</td>
                  <td>{r.sleep ? formatDur(r.sleep) : "—"}</td>
                  <td>{r.diapers}</td>
                  <td>{r.poops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {poopEvents.length > 0 && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Cocôs no período ({poopEvents.length})</h2>
            {poopColors.length > 0 && (
              <p className="text-sm mb-2">Cores anotadas: {poopColors.map((c) => `${c.label.toLowerCase()} (${c.n})`).join(", ")}.</p>
            )}
            {poopDetailed.length > 0 && (
              <table>
                <tbody>
                  {poopDetailed.slice(0, 12).map((e) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.timestamp).slice(0, 5)} {formatClock(e.timestamp)}</td>
                      <td>{poopSummary(e.poop)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {growthRows.length > 0 && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Peso e medidas</h2>
            <table>
              <thead>
                <tr><th>Data</th><th>Peso</th><th>Altura</th><th>Cabeça</th><th>Percentil (peso)</th></tr>
              </thead>
              <tbody>
                {growthRows.map((g) => {
                  const m = ageInMonths(settings.birthDate, g.timestamp);
                  const pct = g.weightKg && m !== null ? growthPercentile(settings.sex, "weightKg", m, g.weightKg) : null;
                  return (
                    <tr key={g.id}>
                      <td>{formatDate(g.timestamp)}</td>
                      <td>{g.weightKg ? `${fmtNum(g.weightKg, 2)} kg` : "—"}</td>
                      <td>{g.heightCm ? `${fmtNum(g.heightCm, 1)} cm` : "—"}</td>
                      <td>{g.headCm ? `${fmtNum(g.headCm, 1)} cm` : "—"}</td>
                      <td>{pct !== null ? `≈ ${pct}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-[var(--muted)] mt-2">Percentil aproximado, a partir da curva da OMS. A avaliação é do pediatra.</p>
          </section>
        )}

        {(meds.length > 0 || temps.length > 0 || symptoms.length > 0) && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Saúde no período</h2>
            <table>
              <tbody>
                {[...meds, ...temps, ...symptoms]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((h) => (
                    <tr key={h.id}>
                      <td>{formatDate(h.timestamp).slice(0, 5)} {formatClock(h.timestamp)}</td>
                      <td>
                        {h.kind === "remedio" && `Remédio: ${h.name}${h.dose ? ` (${h.dose})` : ""}${h.by ? ` — dado por ${h.by}` : ""}`}
                        {h.kind === "temperatura" && `Temperatura: ${fmtNum(h.tempC ?? 0, 1)} °C`}
                        {h.kind === "sintoma" && `Sintoma: ${h.name}`}
                        {h.note ? ` — ${h.note}` : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        {doneVaccines.length > 0 && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Vacinas registradas</h2>
            <table>
              <tbody>
                {doneVaccines
                  .sort((x, y) => (x[1].doneAt ?? 0) - (y[1].doneAt ?? 0))
                  .map(([k, r]) => {
                    const def = VACCINES.find((d) => d.key === k);
                    const react = r.reactions && r.reactions.length ? r.reactions.join(", ") : "";
                    return (
                      <tr key={k}>
                        <td>{formatDate(r.doneAt ?? 0)}</td>
                        <td>
                          {def ? `${def.name} (${def.dose})` : k}
                          {placeLine(r) ? ` — ${placeLine(r)}` : ""}
                          {r.applier ? ` — ${r.applier}` : ""}
                          {r.batch ? ` — lote ${r.batch}` : ""}
                          {react ? ` — reação: ${react.toLowerCase()}` : ""}
                          {r.reactionNote ? ` (${r.reactionNote})` : ""}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        )}

        {doneVisits.length > 0 && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Consultas no período</h2>
            <table>
              <tbody>
                {doneVisits.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDate(v.timestamp)}</td>
                    <td>
                      {visitTitle(v.kind)}
                      {v.doctor ? ` — ${v.doctor}` : ""}
                      {placeLine(v) ? ` — ${placeLine(v)}` : ""}
                      {v.note ? `. ${v.note}` : ""}
                      {v.guidance ? ` Orientações: ${v.guidance}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <p className="text-xs text-[var(--muted)]">
          Relatório gerado a partir dos registros feitos pela família. Não substitui avaliação médica.
        </p>
      </div>
    </div>
  );
}
