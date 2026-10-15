"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NapCard } from "@/components/NapCard";
import { EventForm, Timeline } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { BabyEvent } from "@/lib/types";
import { formatClock, formatDur, formatTime } from "@/lib/utils";

export function SleepScreen({ app, go }: ScreenProps) {
  const { timer, elapsed, sleepToday, totalSleepSec, longestSleepSec } = app;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BabyEvent | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const live = timer?.type === "sono" ? timer : null;

  return (
    <div className="fade-in space-y-4 pt-2">
      {live ? (
        <section className="glass p-6 text-center">
          <span className="icon-badge w-16 h-16 mx-auto">
            <Icon name="moon" className="w-8 h-8" />
          </span>
          <p className="font-semibold text-xl mt-4">Soneca em andamento</p>
          <p className="text-[var(--muted)] text-sm">Dormindo agora.</p>
          <p className="grad-text text-7xl font-extrabold my-6 tabular-nums tracking-tight">{formatTime(elapsed)}</p>
          <p className="text-sm text-[var(--muted)] inline-flex items-center gap-2 mb-6">
            <Icon name="clock" className="w-4 h-4 text-[var(--violet)]" /> Iniciada às {formatClock(live.start)}
          </p>
          <button
            onClick={() => { app.stopSleep(); go("inicio"); }}
            className="btn-grad w-full h-16 rounded-full flex items-center gap-3 px-3 font-semibold text-lg"
          >
            <span className="flex-1 text-center pl-10">Acordou</span>
            <span className="grid place-items-center w-10 h-10 rounded-full bg-white text-[var(--violet-deep)]">
              <Icon name="heart" className="w-5 h-5" />
            </span>
          </button>
          <button
            onClick={() => {
              if (confirmCancel) { app.cancelTimer(); setConfirmCancel(false); } else setConfirmCancel(true);
            }}
            className="w-full py-3 mt-2 text-sm text-[var(--muted)]"
          >
            {confirmCancel ? "Toque de novo para descartar sem salvar" : "Descartar esta soneca"}
          </button>
        </section>
      ) : timer?.type === "amamentacao" ? (
        <section className="glass p-6 text-center">
          <p className="text-[var(--muted)]">Há uma mamada em andamento.</p>
          <button onClick={() => go("amamentacao")} className="btn-ghost mt-3 px-5 h-11 rounded-full font-semibold">
            Ver mamada
          </button>
        </section>
      ) : (
        <section className="glass p-6 text-center">
          <span className="icon-badge w-16 h-16 mx-auto">
            <Icon name="moon" className="w-8 h-8" />
          </span>
          <p className="font-semibold text-xl mt-4">Hora de dormir?</p>
          <p className="text-[var(--muted)] text-sm mb-6">Inicie o cronômetro quando ele pegar no sono.</p>
          <button
            onClick={app.startSleep}
            className="btn-grad w-full h-16 rounded-full flex items-center justify-center gap-2.5 font-semibold text-lg"
          >
            <Icon name="play" className="w-5 h-5" /> Começar soneca
          </button>
        </section>
      )}

      <NapCard nap={app.nap} hasBirthDate={Boolean(app.settings.birthDate)} onSettings={() => go("config")} />

      <section className="glass p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="icon-badge w-11 h-11">
            <Icon name="chart" className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Resumo de hoje</h2>
            <p className="text-sm text-[var(--muted)]">Total de sono hoje</p>
          </div>
        </div>
        <p className="grad-text text-4xl font-extrabold">{formatDur(totalSleepSec)}</p>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-2xl font-bold text-[var(--violet)]">{sleepToday.length}</p>
            <p className="text-sm text-[var(--muted)]">{sleepToday.length === 1 ? "soneca" : "sonecas"}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--blue)]">{formatDur(longestSleepSec)}</p>
            <p className="text-sm text-[var(--muted)]">soneca mais longa</p>
          </div>
        </div>
      </section>

      <section className="glass p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Sonecas de hoje</h3>
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Adicionar soneca manual">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
        <Timeline events={sleepToday} empty="Nenhuma soneca hoje" onSelect={setEditing} />
      </section>

      {adding && <EventForm defaultType="sono" onSave={app.saveEvent} onClose={() => setAdding(false)} />}
      {editing && (
        <EventForm initial={editing} onSave={app.saveEvent} onDelete={app.deleteEvent} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
