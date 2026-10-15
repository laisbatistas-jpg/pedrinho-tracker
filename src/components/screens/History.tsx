"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { EventForm, ScreenHeader, Timeline } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { BabyEvent } from "@/lib/types";
import { DAY, formatDayLong, formatDur, fromDateInput, isFeed, startOfDay, toDateInput } from "@/lib/utils";

export function HistoryScreen({ app, go }: ScreenProps) {
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BabyEvent | null>(null);

  const today0 = startOfDay(app.now || Date.now());
  const isToday = day === today0;

  const dayEvents = useMemo(
    () => app.events.filter((e) => e.timestamp >= day && e.timestamp < day + DAY),
    [app.events, day]
  );

  const feeds = dayEvents.filter(isFeed).length;
  const ml = dayEvents.filter((e) => e.type === "mamadeira").reduce((a, e) => a + (e.ml || 0), 0);
  const sleep = dayEvents.filter((e) => e.type === "sono").reduce((a, e) => a + (e.duration || 0), 0);
  const diapers = dayEvents.filter((e) => e.type === "fralda").length;

  const shift = (n: number) => setDay((d) => startOfDay(d + n * DAY + 12 * 3600000));

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Histórico" subtitle="Veja e corrija qualquer dia" onBack={() => go("mais")} />

      <section className="glass p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="icon-badge w-11 h-11" aria-label="Dia anterior">
            <Icon name="back" className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <p className="font-semibold cap-first truncate">{isToday ? "Hoje" : formatDayLong(day)}</p>
            <input
              type="date"
              className="field !min-h-0 !py-1 !px-2 mt-1 text-center !text-sm"
              value={toDateInput(day + 12 * 3600000)}
              max={toDateInput(today0 + 12 * 3600000)}
              onChange={(e) => e.target.value && setDay(startOfDay(fromDateInput(e.target.value)))}
            />
          </div>
          <button
            onClick={() => shift(1)}
            disabled={isToday}
            className="icon-badge w-11 h-11 disabled:opacity-30"
            aria-label="Próximo dia"
          >
            <Icon name="chevron" className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          <div><p className="text-xl font-bold">{feeds}</p><p className="text-[11px] text-[var(--muted)]">mamadas</p></div>
          <div><p className="text-xl font-bold">{ml}</p><p className="text-[11px] text-[var(--muted)]">ml mamadeira</p></div>
          <div><p className="text-xl font-bold">{formatDur(sleep)}</p><p className="text-[11px] text-[var(--muted)]">sono</p></div>
          <div><p className="text-xl font-bold">{diapers}</p><p className="text-[11px] text-[var(--muted)]">fraldas</p></div>
        </div>
      </section>

      <section className="glass p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Registros do dia</h3>
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Adicionar registro">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
        <Timeline events={[...dayEvents].sort((a, b) => b.timestamp - a.timestamp)} empty="Nenhum registro neste dia" onSelect={setEditing} />
      </section>

      {adding && (
        <EventForm
          defaultTime={isToday ? Date.now() : day + 12 * 3600000}
          onSave={app.saveEvent}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <EventForm initial={editing} onSave={app.saveEvent} onDelete={app.deleteEvent} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
