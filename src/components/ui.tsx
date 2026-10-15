"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import type { BabyEvent, DiaperKind, EventType, Side } from "@/lib/types";
import type { Alert } from "@/lib/app";
import {
  diaperLabel,
  formatClock,
  formatDur,
  formatTime,
  fromLocalInput,
  genId,
  resizeImage,
  sideLabel,
  toLocalInput,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Cabeçalho de tela                                                   */
/* ------------------------------------------------------------------ */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 no-print">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="icon-badge w-10 h-10 hover:brightness-125"
        >
          <Icon name="back" className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold leading-tight truncate">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--muted)] truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartões de resumo                                                   */
/* ------------------------------------------------------------------ */

export function Stat({
  icon,
  value,
  unit,
  label,
  children,
}: {
  icon: IconName;
  value: string | number;
  unit?: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-3">
        <span className="icon-badge w-11 h-11">
          <Icon name={icon} className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">
            {value}
            {unit && <span className="text-base font-semibold text-[var(--muted)] ml-1">{unit}</span>}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">{label}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-9">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background:
              i === values.length - 1
                ? "linear-gradient(180deg,#c4b5fd,#8b5cf6)"
                : "rgba(167,139,250,0.35)",
          }}
        />
      ))}
    </div>
  );
}

export function WeekChart({
  letters,
  values,
  format,
}: {
  letters: string[];
  values: number[];
  format: (v: number) => string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {values.map((v, i) => {
        const last = i === values.length - 1;
        return (
          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5">
            <span className="text-[10px] text-[var(--muted)] tabular-nums">{v > 0 ? format(v) : ""}</span>
            <span
              className="w-full rounded-md"
              style={{
                height: `${Math.max(4, (v / max) * 78)}%`,
                background: last
                  ? "linear-gradient(180deg,#c4b5fd,#7c3aed)"
                  : "linear-gradient(180deg,rgba(167,139,250,0.55),rgba(124,58,237,0.25))",
              }}
            />
            <span className={`text-[11px] ${last ? "text-[var(--violet)] font-bold" : "text-[var(--muted)]"}`}>
              {letters[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linha do tempo                                                      */
/* ------------------------------------------------------------------ */

const EVENT_ICON: Record<EventType, IconName> = {
  amamentacao: "feed",
  mamadeira: "bottle",
  sono: "moon",
  fralda: "diaper",
};

const EVENT_TITLE: Record<EventType, string> = {
  amamentacao: "Mamada",
  mamadeira: "Mamadeira",
  sono: "Soneca",
  fralda: "Fralda",
};

function eventSub(e: BabyEvent): string {
  switch (e.type) {
    case "amamentacao":
      return `Seio ${sideLabel(e.side)}`;
    case "mamadeira":
      return e.milk === "formula" ? "Fórmula" : "Leite materno";
    case "sono":
      return e.endTimestamp ? `Até ${formatClock(e.endTimestamp)}` : "Dormiu";
    case "fralda":
      return `${diaperLabel(e.diaper)} • Trocada`;
  }
}

export function Timeline({
  events,
  empty,
  onSelect,
}: {
  events: BabyEvent[];
  empty: string;
  onSelect?: (e: BabyEvent) => void;
}) {
  if (events.length === 0) {
    return <p className="text-[var(--muted)] text-sm py-4 text-center">{empty}</p>;
  }
  return (
    <ul className="relative timeline-line">
      {events.map((e) => {
        const body = (
          <>
            <span className="icon-badge w-10 h-10">
              <Icon name={EVENT_ICON[e.type]} className="w-[18px] h-[18px]" />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--violet)] font-semibold text-sm tabular-nums">
                  {formatClock(e.timestamp)}
                </span>
                <span className="font-semibold truncate">{EVENT_TITLE[e.type]}</span>
              </div>
              <p className="text-xs text-[var(--muted)] truncate">
                {eventSub(e)}
                {e.note ? ` • ${e.note}` : ""}
                {e.by ? ` • por ${e.by}` : ""}
              </p>
            </div>
            {e.type === "fralda" ? (
              <span className="grid place-items-center w-7 h-7 rounded-full border border-[var(--stroke-strong)] text-[var(--muted)]">
                <Icon name="check" className="w-4 h-4" />
              </span>
            ) : (
              <span className="text-sm font-semibold text-[var(--violet)] tabular-nums">
                {e.type === "sono"
                  ? formatDur(e.duration || 0)
                  : e.type === "mamadeira"
                    ? `${e.ml ?? 0} ml`
                    : formatTime(e.duration || 0)}
              </span>
            )}
          </>
        );
        return (
          <li key={e.id} className="relative pl-6">
            <span className="absolute left-[3px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--violet)] ring-4 ring-[#0c1226]" />
            {onSelect ? (
              <button
                onClick={() => onSelect(e)}
                className="w-full flex items-center gap-3 py-2.5 rounded-2xl hover:bg-white/5"
                aria-label={`Editar ${EVENT_TITLE[e.type]} das ${formatClock(e.timestamp)}`}
              >
                {body}
              </button>
            ) : (
              <div className="flex items-center gap-3 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Janela que sobe de baixo                                            */
/* ------------------------------------------------------------------ */

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // trava a rolagem da tela de fundo enquanto a janela está aberta
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  // Vai direto para o <body>: assim o "fixed" sempre é relativo à tela do celular,
  // mesmo que a tela de trás tenha animação ou rolagem.
  return createPortal(
    <div className="sheet-overlay no-print" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="icon-badge w-9 h-9">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Field({
  label,
  children,
  group,
}: {
  label: string;
  children: ReactNode;
  /** use em campos com botões de opção (chips), para não associar o rótulo ao primeiro botão */
  group?: boolean;
}) {
  if (group) {
    return (
      <div className="block mb-4" role="group" aria-label={label}>
        <span className="label" aria-hidden="true">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className="block mb-4">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`chip ${value === o.value ? "chip-on" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SheetActions({
  onSave,
  onDelete,
  saveLabel = "Salvar",
  error,
}: {
  onSave: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  error?: string;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      {error && <p className="text-sm text-amber-300 mb-3">{error}</p>}
      <button onClick={onSave} className="btn-grad w-full h-14 rounded-2xl font-semibold text-lg">
        {saveLabel}
      </button>
      {onDelete && (
        <button
          onClick={() => (confirm ? onDelete() : setConfirm(true))}
          className={`w-full h-12 mt-3 rounded-2xl font-semibold border ${
            confirm
              ? "bg-red-500/20 border-red-400/60 text-red-200"
              : "border-[var(--stroke)] text-[var(--muted)]"
          }`}
        >
          {confirm ? "Toque de novo para apagar" : "Apagar"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avisos                                                              */
/* ------------------------------------------------------------------ */

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div
          key={a.id + a.episode}
          className={`glass p-4 flex items-start gap-3 ${a.tone === "warn" ? "!border-amber-400/50" : ""}`}
        >
          <span className={`icon-badge w-10 h-10 ${a.tone === "warn" ? "!text-amber-200" : ""}`}>
            <Icon name={a.tone === "warn" ? "alert" : "bell"} className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{a.title}</p>
            <p className="text-sm text-[var(--muted)]">{a.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="text-center py-10 text-[var(--muted)]">
      <span className="icon-badge w-14 h-14 mx-auto mb-3">
        <Icon name={icon} className="w-7 h-7" />
      </span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulário de registro (novo / editar)                              */
/* ------------------------------------------------------------------ */

export function EventForm({
  initial,
  defaultType = "amamentacao",
  defaultTime,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: BabyEvent;
  defaultType?: EventType;
  defaultTime?: number;
  onSave: (e: BabyEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const t0 = initial?.timestamp ?? defaultTime ?? Date.now();
  const [type, setType] = useState<EventType>(initial?.type ?? defaultType);
  const [start, setStart] = useState(toLocalInput(t0));
  const [end, setEnd] = useState(
    toLocalInput(initial?.endTimestamp ?? t0 + (initial?.duration ?? 30 * 60) * 1000)
  );
  const [side, setSide] = useState<Side>(initial?.side ?? "esquerdo");
  const [minutes, setMinutes] = useState(
    initial?.type === "amamentacao" ? String(Math.round((initial.duration ?? 0) / 60)) : "15"
  );
  const [ml, setMl] = useState(initial?.ml ? String(initial.ml) : "120");
  const [milk, setMilk] = useState<"materno" | "formula">(initial?.milk ?? "materno");
  const [diaper, setDiaper] = useState<DiaperKind>(initial?.diaper ?? "molhada");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  const save = () => {
    const ts = fromLocalInput(start);
    const base: BabyEvent = {
      id: initial?.id ?? genId(),
      type,
      timestamp: ts,
      note: note.trim() || undefined,
    };
    if (type === "amamentacao") {
      const m = Number(minutes.replace(",", "."));
      if (!Number.isFinite(m) || m < 0) return setError("Informe a duração em minutos.");
      base.side = side;
      base.duration = Math.round(m * 60);
      base.endTimestamp = ts + base.duration * 1000;
    } else if (type === "mamadeira") {
      const v = Number(ml.replace(",", "."));
      if (!Number.isFinite(v) || v <= 0) return setError("Informe a quantidade em ml.");
      base.ml = Math.round(v);
      base.milk = milk;
    } else if (type === "sono") {
      const te = fromLocalInput(end);
      if (te <= ts) return setError("O fim da soneca precisa ser depois do início.");
      base.endTimestamp = te;
      base.duration = Math.round((te - ts) / 1000);
    } else {
      base.diaper = diaper;
    }
    onSave(base);
    onClose();
  };

  return (
    <Sheet title={initial ? "Editar registro" : "Novo registro"} onClose={onClose}>
      {!initial && (
        <div className="mb-4">
          <Chips<EventType>
            value={type}
            onChange={setType}
            options={[
              { value: "amamentacao", label: "Mamada" },
              { value: "mamadeira", label: "Mamadeira" },
              { value: "sono", label: "Sono" },
              { value: "fralda", label: "Fralda" },
            ]}
          />
        </div>
      )}

      <Field label={type === "sono" ? "Início" : "Quando"}>
        <input type="datetime-local" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>

      {type === "amamentacao" && (
        <>
          <Field label="Lado" group>
            <Chips<Side>
              value={side}
              onChange={setSide}
              options={[
                { value: "esquerdo", label: "Esquerdo" },
                { value: "direito", label: "Direito" },
              ]}
            />
          </Field>
          <Field label="Duração (minutos)">
            <input inputMode="decimal" className="field" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
        </>
      )}

      {type === "mamadeira" && (
        <>
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
        </>
      )}

      {type === "sono" && (
        <Field label="Fim">
          <input type="datetime-local" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      )}

      {type === "fralda" && (
        <Field label="Tipo" group>
          <Chips<DiaperKind>
            value={diaper}
            onChange={setDiaper}
            options={[
              { value: "molhada", label: "Molhada" },
              { value: "suja", label: "Suja" },
              { value: "mista", label: "Mista" },
            ]}
          />
        </Field>
      )}

      <Field label="Observação (opcional)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: mamou pouco" />
      </Field>

      <SheetActions
        onSave={save}
        error={error}
        onDelete={
          initial && onDelete
            ? () => {
                onDelete(initial.id);
                onClose();
              }
            : undefined
        }
      />
    </Sheet>
  );
}


/* ------------------------------------------------------------------ */
/* Fotos (receitas, exames, caderneta)                                 */
/* ------------------------------------------------------------------ */

/** Foto em tela cheia. Toque em qualquer lugar para fechar. */
export function PhotoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/90 grid place-items-center p-3 no-print"
      onClick={onClose}
      role="dialog"
      aria-label="Foto ampliada"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Foto ampliada" className="max-w-full max-h-[88dvh] object-contain rounded-xl" />
      <button onClick={onClose} aria-label="Fechar foto" className="absolute top-4 right-4 icon-badge w-11 h-11">
        <Icon name="close" className="w-5 h-5" />
      </button>
    </div>,
    document.body
  );
}

/** Miniaturas que abrem em tela cheia ao tocar. */
export function PhotoThumbs({ photos, onRemove }: { photos: string[]; onRemove?: (i: number) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            <button type="button" onClick={() => setOpen(p)} aria-label={`Ampliar foto ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`Foto ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-[var(--stroke-strong)]" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remover foto ${i + 1}`}
                className="absolute -top-2 -right-2 icon-badge w-7 h-7 !bg-black/70"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {open && <PhotoViewer src={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Campo para anexar fotos (até `max`), já reduzidas para não pesar. */
export function PhotoField({
  label,
  photos,
  onChange,
  max = 4,
}: {
  label: string;
  photos: string[];
  onChange: (p: string[]) => void;
  max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr("");
    try {
      const next = [...photos];
      for (const f of Array.from(files)) {
        if (next.length >= max) break;
        next.push(await resizeImage(f, 1000, 0.6));
      }
      onChange(next);
    } catch {
      setErr("Não consegui usar essa foto. Tente outra.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} group>
      <PhotoThumbs photos={photos} onRemove={(i) => onChange(photos.filter((_, k) => k !== i))} />
      {photos.length < max && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`btn-ghost w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold ${photos.length ? "mt-3" : ""}`}
        >
          <Icon name="camera" className="w-5 h-5" /> {busy ? "Preparando foto…" : "Tirar ou escolher foto"}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      {err && <p className="text-sm text-amber-300 mt-2">{err}</p>}
      <p className="text-xs text-[var(--muted)] mt-2">Até {max} fotos. Elas ficam reduzidas para caber no celular.</p>
    </Field>
  );
}
