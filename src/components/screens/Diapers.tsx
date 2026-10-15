"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { EventForm, Stat, Timeline } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { BabyEvent, DiaperKind } from "@/lib/types";
import { diaperLabel, formatClock } from "@/lib/utils";

const OPTIONS: { k: DiaperKind; label: string; icon: IconName }[] = [
  { k: "molhada", label: "Molhada", icon: "drop" },
  { k: "suja", label: "Suja", icon: "diaper" },
  { k: "mista", label: "Mista", icon: "heart" },
];

export function DiapersScreen({ app }: ScreenProps) {
  const { diapersToday } = app;
  const [editing, setEditing] = useState<BabyEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<DiaperKind | null>(null);

  const add = (k: DiaperKind) => {
    app.addDiaper(k);
    setFlash(k);
    setTimeout(() => setFlash(null), 1200);
  };

  return (
    <div className="fade-in pt-2 space-y-4">
      <section className="glass p-5">
        <h2 className="text-xl font-bold mb-1">Registrar fralda</h2>
        <p className="text-sm text-[var(--muted)] mb-5">Um toque e já fica salvo na linha do tempo.</p>
        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <button
              key={o.k}
              onClick={() => add(o.k)}
              className={`w-full h-16 rounded-2xl flex items-center gap-4 px-4 text-lg font-semibold ${
                flash === o.k ? "btn-green" : "btn-ghost"
              }`}
            >
              <span className="icon-badge w-10 h-10">
                <Icon name={flash === o.k ? "check" : o.icon} className="w-5 h-5" />
              </span>
              {flash === o.k ? "Salvo!" : o.label}
              <span className="ml-auto text-sm font-medium text-[var(--muted)]">
                {diapersToday.filter((e) => e.diaper === o.k).length} hoje
              </span>
            </button>
          ))}
        </div>
      </section>

      <Stat icon="diaper" value={diapersToday.length} label="fraldas hoje">
        {diapersToday[0] && (
          <p className="text-xs text-[var(--muted)]">
            Última às {formatClock(diapersToday[0].timestamp)} • {diaperLabel(diapersToday[0].diaper)}
          </p>
        )}
      </Stat>

      <section className="glass p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Fraldas de hoje</h3>
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Adicionar fralda manual">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
        <Timeline events={diapersToday} empty="Nenhuma fralda hoje" onSelect={setEditing} />
      </section>

      {adding && <EventForm defaultType="fralda" onSave={app.saveEvent} onClose={() => setAdding(false)} />}
      {editing && (
        <EventForm initial={editing} onSave={app.saveEvent} onDelete={app.deleteEvent} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
