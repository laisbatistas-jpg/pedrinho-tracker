"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, ScreenHeader, WeekChart } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { METRIC_INFO } from "@/lib/reference";
import {
  DAY, WEEKDAY_LETTER, ageLabel, fmtNum, formatClock, formatDate, formatDur, isFeed, startOfDay,
} from "@/lib/utils";

export function ReportScreen({ app, go }: ScreenProps) {
  const [days, setDays] = useState(7);
  const { settings, events, growth, health, vaccines, now } = app;
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

  const meds = health.filter((h) => h.kind === "remedio" && h.timestamp >= data.from);
  const temps = health.filter((h) => h.kind === "temperatura" && h.timestamp >= data.from);
  const symptoms = health.filter((h) => h.kind === "sintoma" && h.timestamp >= data.from);
  const lastGrowth = growth[growth.length - 1];
  const doneVaccines = Object.entries(vaccines).filter(([, v]) => v.doneAt);

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
              <tr><td>Mamadeira</td><td className="text-right font-semibold">{Math.round(data.avg((r) => r.ml))} ml por dia</td></tr>
              <tr><td>Sono total</td><td className="text-right font-semibold">{formatDur(Math.round(data.avg((r) => r.sleep)))} por dia</td></tr>
              <tr><td>Sonecas</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.naps), 1)} por dia</td></tr>
              <tr><td>Fraldas (molhadas / sujas)</td><td className="text-right font-semibold">{fmtNum(data.avg((r) => r.wet), 1)} / {fmtNum(data.avg((r) => r.dirty), 1)} por dia</td></tr>
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
          <table>
            <thead>
              <tr>
                <th>Dia</th><th>Mamadas</th><th>ml</th><th>Sono</th><th>Fraldas</th>
              </tr>
            </thead>
            <tbody>
              {[...data.rows].reverse().map((r) => (
                <tr key={r.start}>
                  <td>{formatDate(r.start).slice(0, 5)}</td>
                  <td>{r.feeds}</td>
                  <td>{r.ml || "—"}</td>
                  <td>{r.sleep ? formatDur(r.sleep) : "—"}</td>
                  <td>{r.diapers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {lastGrowth && (
          <section className="glass p-5">
            <h2 className="font-semibold text-lg mb-2">Última medição ({formatDate(lastGrowth.timestamp)})</h2>
            <p className="text-sm">
              {lastGrowth.weightKg ? `${METRIC_INFO.weightKg.label}: ${fmtNum(lastGrowth.weightKg, 2)} kg` : ""}
              {lastGrowth.heightCm ? ` • ${METRIC_INFO.heightCm.label}: ${fmtNum(lastGrowth.heightCm, 1)} cm` : ""}
              {lastGrowth.headCm ? ` • ${METRIC_INFO.headCm.label}: ${fmtNum(lastGrowth.headCm, 1)} cm` : ""}
            </p>
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
                        {h.kind === "remedio" && `Remédio: ${h.name}${h.dose ? ` (${h.dose})` : ""}`}
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
            <p className="text-sm">
              {doneVaccines.length} {doneVaccines.length === 1 ? "vacina marcada" : "vacinas marcadas"} como aplicada{doneVaccines.length === 1 ? "" : "s"} no app.
            </p>
          </section>
        )}

        <p className="text-xs text-[var(--muted)]">
          Relatório gerado a partir dos registros feitos pela família. Não substitui avaliação médica.
        </p>
      </div>
    </div>
  );
}
