"use client";

import { ScreenHeader, Stat, Timeline, WeekChart } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { fmtNum, formatDur } from "@/lib/utils";

export function StatsScreen({ app, go }: ScreenProps) {
  const { week, feedsToday, totalSleepSec, diapersToday, avgFeedInterval, todayEvents } = app;
  const letters = week.map((d) => d.letter);
  const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  const active = week.filter((d) => d.feeds + d.sleep + d.diapers > 0);

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Estatísticas" subtitle="Hoje e últimos 7 dias" onBack={() => go("mais")} />

      <div className="grid grid-cols-2 gap-3">
        <Stat icon="feed" value={feedsToday.length} label="mamadas hoje" />
        <Stat icon="clock" value={avgFeedInterval} unit="min" label="intervalo médio" />
        <Stat icon="moon" value={formatDur(totalSleepSec)} label="de sono hoje" />
        <Stat icon="diaper" value={diapersToday.length} label="fraldas hoje" />
      </div>

      {week.length > 0 && (
        <section className="glass p-5">
          <h2 className="font-semibold text-lg mb-1">Médias dos dias com registro</h2>
          <p className="text-xs text-[var(--muted)] mb-4">
            {active.length} {active.length === 1 ? "dia" : "dias"} nos últimos 7
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold grad-text">{fmtNum(avg(active.map((d) => d.feeds)), 1)}</p>
              <p className="text-xs text-[var(--muted)]">mamadas/dia</p>
            </div>
            <div>
              <p className="text-2xl font-bold grad-text">{formatDur(Math.round(avg(active.map((d) => d.sleep))))}</p>
              <p className="text-xs text-[var(--muted)]">sono/dia</p>
            </div>
            <div>
              <p className="text-2xl font-bold grad-text">{fmtNum(avg(active.map((d) => d.diapers)), 1)}</p>
              <p className="text-xs text-[var(--muted)]">fraldas/dia</p>
            </div>
          </div>
        </section>
      )}

      {week.length > 0 && (
        <section className="glass p-5">
          <h2 className="font-semibold text-lg mb-4">Últimos 7 dias</h2>
          <p className="text-sm text-[var(--muted)] mb-2">Mamadas por dia</p>
          <WeekChart letters={letters} values={week.map((d) => d.feeds)} format={(v) => `${v}`} />
          <p className="text-sm text-[var(--muted)] mt-6 mb-2">Mamadeira (ml) por dia</p>
          <WeekChart letters={letters} values={week.map((d) => d.bottleMl)} format={(v) => `${v}`} />
          <p className="text-sm text-[var(--muted)] mt-6 mb-2">Sono por dia</p>
          <WeekChart
            letters={letters}
            values={week.map((d) => d.sleep)}
            format={(v) => (v > 0 ? `${fmtNum(v / 3600, 1)}h` : "0")}
          />
          <p className="text-sm text-[var(--muted)] mt-6 mb-2">Fraldas por dia</p>
          <WeekChart letters={letters} values={week.map((d) => d.diapers)} format={(v) => `${v}`} />
        </section>
      )}

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-2">Linha do tempo de hoje</h2>
        <Timeline events={todayEvents} empty="Nenhum registro ainda" />
      </section>
    </div>
  );
}
