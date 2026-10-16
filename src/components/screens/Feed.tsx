"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, EventForm, Field, Sheet, SheetActions, Timeline } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { BabyEvent, Side } from "@/lib/types";
import { formatClock, formatDur, formatTime, genId, sideLabel } from "@/lib/utils";

export function SideButton({
  side,
  suggested,
  onClick,
}: {
  side: Side;
  suggested?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative h-28 rounded-3xl flex flex-col items-center justify-center gap-2 border ${
        suggested
          ? "btn-grad border-transparent"
          : "bg-white/5 border-[var(--stroke-strong)] text-[#d9ccff] hover:bg-white/10"
      }`}
    >
      <Icon name="feed" className="w-7 h-7" />
      <span className="font-semibold text-lg">{sideLabel(side)}</span>
      {suggested && (
        <span className="absolute top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider bg-white/20 rounded-full px-2 py-0.5">
          Sugerido
        </span>
      )}
    </button>
  );
}

/** Janela para registrar uma mamadeira rapidamente. */
export function BottleSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (ml: number, milk: "materno" | "formula") => void;
}) {
  const [ml, setMl] = useState("120");
  const [milk, setMilk] = useState<"materno" | "formula">("materno");
  const [error, setError] = useState("");
  const presets = [60, 90, 120, 150, 180, 210];

  return (
    <Sheet title="Mamadeira" onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setMl(String(p))}
            className={`chip ${ml === String(p) ? "chip-on" : ""}`}
          >
            {p} ml
          </button>
        ))}
      </div>
      <Field label="Quantidade (ml)">
        <input inputMode="numeric" className="field" value={ml} onChange={(e) => setMl(e.target.value)} />
      </Field>
      <Field label="Tipo de leite" group>
        <Chips<"materno" | "formula">
          value={milk}
          onChange={setMilk}
          options={[
            { value: "materno", label: "Leite materno" },
            { value: "formula", label: "Fórmula" },
          ]}
        />
      </Field>
      <SheetActions
        saveLabel="Registrar agora"
        error={error}
        onSave={() => {
          const v = Number(ml.replace(",", "."));
          if (!Number.isFinite(v) || v <= 0) return setError("Informe a quantidade em ml.");
          onSave(Math.round(v), milk);
          onClose();
        }}
      />
    </Sheet>
  );
}

/** Registrar uma mamada que já aconteceu, só informando os minutos de cada lado. */
function QuickFeedSheet({ onClose, onSave }: { onClose: () => void; onSave: (evs: BabyEvent[]) => void }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ago, setAgo] = useState(0); // terminou há X minutos
  const [error, setError] = useState("");
  const presets = [5, 10, 15, 20, 30];

  const block = (label: string, value: string, set: (v: string) => void) => (
    <Field label={`${label} (minutos)`} group>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => set(value === String(m) ? "" : String(m))}
            className={`chip ${value === String(m) ? "chip-on" : ""}`}
          >
            {m} min
          </button>
        ))}
      </div>
      <input
        inputMode="numeric"
        className="field"
        value={value}
        onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="Outro valor, ou deixe vazio se não mamou"
        aria-label={`${label}, minutos`}
      />
    </Field>
  );

  return (
    <Sheet title="Registrar mamada" onClose={onClose}>
      <p className="text-sm text-[var(--muted)] mb-4">Para quando você esqueceu de ligar o cronômetro.</p>
      {block("Seio esquerdo", left, setLeft)}
      {block("Seio direito", right, setRight)}
      <Field label="Quando terminou" group>
        <Chips<number>
          value={ago}
          onChange={setAgo}
          options={[
            { value: 0, label: "Agora" },
            { value: 10, label: "10 min atrás" },
            { value: 20, label: "20 min atrás" },
            { value: 30, label: "30 min atrás" },
            { value: 60, label: "1 h atrás" },
          ]}
        />
      </Field>
      <SheetActions
        saveLabel="Salvar mamada"
        error={error}
        onSave={() => {
          const l = Number(left || 0);
          const r = Number(right || 0);
          if (l <= 0 && r <= 0) return setError("Informe os minutos de pelo menos um lado.");
          if (l > 120 || r > 120) return setError("Confira os minutos: o máximo é 120 por lado.");
          const end = Date.now() - ago * 60000;
          const parts = [
            { side: "esquerdo" as Side, min: l },
            { side: "direito" as Side, min: r },
          ].filter((x) => x.min > 0);
          const total = parts.reduce((a, x) => a + x.min, 0);
          let t = end - total * 60000;
          const evs: BabyEvent[] = parts.map((x) => {
            const ev: BabyEvent = {
              id: genId(),
              type: "amamentacao",
              side: x.side,
              timestamp: t,
              duration: x.min * 60,
              endTimestamp: t + x.min * 60000,
            };
            t += x.min * 60000;
            return ev;
          });
          onSave(evs);
          onClose();
        }}
      />
    </Sheet>
  );
}

const RING_R = 104;
const RING_C = 2 * Math.PI * RING_R;

export function FeedScreen({ app, go }: ScreenProps) {
  const { timer, elapsed, lastBreast, suggestedSide, breastToday, bottlesToday, bottleMlToday } = app;
  const [bottleOpen, setBottleOpen] = useState(false);
  const [editing, setEditing] = useState<BabyEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const live = timer?.type === "amamentacao" ? timer : null;
  const sideSec = (side: Side) => breastToday.filter((e) => e.side === side).reduce((a, e) => a + (e.duration || 0), 0);
  const totalBreastSec = breastToday.reduce((a, e) => a + (e.duration || 0), 0);
  const avgBreastSec = breastToday.length ? Math.round(totalBreastSec / breastToday.length) : 0;
  const progress = (elapsed % 1200) / 1200; // uma volta a cada 20 min

  return (
    <div className="fade-in pt-2">
      {live ? (
        <div className="flex flex-col items-center">
          <div className="relative w-[17.5rem] h-[17.5rem] my-3">
            <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
              <circle cx="120" cy="120" r={RING_R} fill="none" stroke="rgba(167,139,250,0.14)" strokeWidth="14" />
              <circle
                cx="120"
                cy="120"
                r={RING_R}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                className="ring-progress"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-extrabold tabular-nums tracking-tight">{formatTime(elapsed)}</span>
              <span className="text-[var(--violet)] mt-1 font-medium">em andamento</span>
            </div>
          </div>

          <p className="text-2xl font-bold grad-text">Seio {sideLabel(live.side)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Iniciada às {formatClock(live.start)}</p>

          <div className="w-full mt-6 space-y-3">
            <button
              onClick={app.switchSide}
              className="btn-ghost w-full h-16 rounded-full flex items-center gap-3 px-3 font-semibold text-lg"
            >
              <span className="icon-badge w-10 h-10">
                <Icon name="swap" className="w-5 h-5" />
              </span>
              <span className="flex-1 text-center pr-10">
                Trocar para {live.side === "esquerdo" ? "Direito" : "Esquerdo"}
              </span>
            </button>
            <button
              onClick={() => {
                app.stopFeed();
                go("inicio");
              }}
              className="btn-green w-full h-16 rounded-full flex items-center gap-3 px-3 font-semibold text-lg"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full border-2 border-white/80">
                <Icon name="check" className="w-5 h-5" />
              </span>
              <span className="flex-1 text-center pr-10">Parar e Salvar</span>
            </button>
            <button
              onClick={() => {
                if (confirmCancel) {
                  app.cancelTimer();
                  setConfirmCancel(false);
                } else setConfirmCancel(true);
              }}
              className="w-full py-2 text-sm text-[var(--muted)]"
            >
              {confirmCancel ? "Toque de novo para descartar sem salvar" : "Descartar esta mamada"}
            </button>
          </div>
        </div>
      ) : timer?.type === "sono" ? (
        <div className="glass p-5 text-center">
          <p className="text-[var(--muted)]">Há uma soneca em andamento.</p>
          <button onClick={() => go("sono")} className="btn-ghost mt-3 px-5 h-11 rounded-full font-semibold">
            Ver soneca
          </button>
        </div>
      ) : (
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-center mb-1">Nova mamada</h2>
          <p className="text-center text-[var(--muted)] mb-6">Escolha o lado para começar</p>
          <div className="grid grid-cols-2 gap-4">
            <SideButton side="esquerdo" suggested={suggestedSide === "esquerdo"} onClick={() => app.startFeed("esquerdo")} />
            <SideButton side="direito" suggested={suggestedSide === "direito"} onClick={() => app.startFeed("direito")} />
          </div>
        </div>
      )}

      {!live && (
        <button
          onClick={() => setQuickOpen(true)}
          className="btn-ghost w-full mt-4 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-semibold"
        >
          <Icon name="clock" className="w-5 h-5" /> Registrar mamada sem cronômetro
        </button>
      )}

      {!live && (
        <button
          onClick={() => setBottleOpen(true)}
          className="btn-ghost w-full mt-4 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-semibold"
        >
          <Icon name="bottle" className="w-5 h-5" /> Registrar mamadeira
        </button>
      )}

      <div className="glass mt-5 p-4 flex items-center gap-4">
        <span className="icon-badge w-12 h-12">
          <Icon name="clock" className="w-6 h-6" />
        </span>
        <div className="flex-1">
          <p className="text-sm text-[var(--muted)]">Último lado:</p>
          <p className="font-semibold text-lg text-[var(--violet)]">{lastBreast ? sideLabel(lastBreast.side) : "—"}</p>
        </div>
        {lastBreast && (
          <div className="text-right">
            <p className="text-sm text-[var(--muted)]">{formatClock(lastBreast.timestamp)}</p>
            <p className="font-semibold tabular-nums">{formatTime(lastBreast.duration || 0)}</p>
          </div>
        )}
      </div>

      <section className="glass mt-4 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">Mamadas de hoje</h3>
            <p className="text-xs text-[var(--muted)]">
              {breastToday.length} no peito • {bottlesToday.length} mamadeira{bottlesToday.length === 1 ? "" : "s"}
              {bottleMlToday > 0 ? ` (${bottleMlToday} ml)` : ""}
            </p>
          </div>
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Adicionar registro manual">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
        {breastToday.length > 0 && (
          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div className="rounded-2xl bg-white/5 py-2.5">
              <p className="font-bold tabular-nums">{formatDur(totalBreastSec)}</p>
              <p className="text-[11px] text-[var(--muted)]">no peito hoje</p>
            </div>
            <div className="rounded-2xl bg-white/5 py-2.5">
              <p className="font-bold tabular-nums">{formatDur(avgBreastSec)}</p>
              <p className="text-[11px] text-[var(--muted)]">média por mamada</p>
            </div>
            <div className="rounded-2xl bg-white/5 py-2.5">
              <p className="font-bold tabular-nums text-sm leading-6">
                E {Math.round(sideSec("esquerdo") / 60)} • D {Math.round(sideSec("direito") / 60)} min
              </p>
              <p className="text-[11px] text-[var(--muted)]">por lado</p>
            </div>
          </div>
        )}
        <Timeline
          events={app.feedsToday}
          empty="Nenhuma mamada hoje"
          onSelect={setEditing}
        />
      </section>

      {bottleOpen && (
        <BottleSheet onClose={() => setBottleOpen(false)} onSave={(ml, milk) => app.addBottle(ml, milk)} />
      )}
      {quickOpen && (
        <QuickFeedSheet onClose={() => setQuickOpen(false)} onSave={(evs) => evs.forEach((e) => app.saveEvent(e))} />
      )}
      {adding && (
        <EventForm defaultType="amamentacao" onSave={app.saveEvent} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <EventForm initial={editing} onSave={app.saveEvent} onDelete={app.deleteEvent} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
