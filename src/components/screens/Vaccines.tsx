"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { VACCINES, type VaccineDef } from "@/lib/reference";
import type { VaccineRecord } from "@/lib/types";
import { DAY, ageInDays, formatDate, fromDateInput, toDateInput } from "@/lib/utils";

const MONTH_MS = 30.4375 * DAY;

function monthLabel(m: number) {
  return m === 0 ? "Ao nascer" : m === 1 ? "1 mês" : `${m} meses`;
}

export function VaccinesScreen({ app, go }: ScreenProps) {
  const { vaccines, settings, now } = app;
  const [open, setOpen] = useState<VaccineDef | null>(null);

  const birth = settings.birthDate ? new Date(`${settings.birthDate}T00:00:00`).getTime() : null;
  const age = ageInDays(settings.birthDate, now || Date.now());

  const status = (v: VaccineDef): "feita" | "atrasada" | "proxima" | "futura" => {
    if (vaccines[v.key]?.doneAt) return "feita";
    if (birth === null || age === null) return "futura";
    const dueAt = birth + v.monthDue * MONTH_MS;
    const t = now || Date.now();
    if (t > dueAt + 14 * DAY) return "atrasada";
    if (t >= dueAt - 14 * DAY) return "proxima";
    return "futura";
  };

  const done = VACCINES.filter((v) => vaccines[v.key]?.doneAt).length;
  const groups = Array.from(new Set(VACCINES.map((v) => v.monthDue)));

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Vacinas" subtitle={`${done} de ${VACCINES.length} registradas`} onBack={() => go("mais")} />

      <section className="glass p-4">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full btn-grad" style={{ width: `${(done / VACCINES.length) * 100}%` }} />
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Calendário básico do primeiro ano (baseado no PNI/SUS). O calendário pode mudar: confira sempre a caderneta de vacinação e o pediatra.
        </p>
        {birth === null && (
          <button onClick={() => go("config")} className="mt-2 text-xs font-semibold text-[var(--violet)] text-left">
            Informe a data de nascimento para ver o que está próximo ou atrasado →
          </button>
        )}
      </section>

      {groups.map((m) => (
        <section key={m} className="glass p-5">
          <h3 className="font-semibold mb-2">{monthLabel(m)}</h3>
          <ul className="divide-y divide-white/10">
            {VACCINES.filter((v) => v.monthDue === m).map((v) => {
              const st = status(v);
              const rec = vaccines[v.key];
              return (
                <li key={v.key}>
                  <button onClick={() => setOpen(v)} className="w-full flex items-center gap-3 py-3 text-left">
                    <span
                      className={`grid place-items-center w-9 h-9 rounded-full border shrink-0 ${
                        st === "feita"
                          ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-200"
                          : st === "atrasada"
                            ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                            : "border-[var(--stroke-strong)] text-[var(--muted)]"
                      }`}
                    >
                      <Icon name={st === "feita" ? "check" : st === "atrasada" ? "alert" : "syringe"} className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-tight">{v.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {v.dose}
                        {rec?.doneAt ? ` • aplicada em ${formatDate(rec.doneAt)}` : ""}
                        {st === "atrasada" ? " • verifique com o pediatra" : ""}
                        {st === "proxima" ? " • próxima" : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {open && (
        <VaccineForm
          def={open}
          rec={vaccines[open.key]}
          onClose={() => setOpen(null)}
          onSave={(r) => app.upsert("vaccine", open.key, r)}
          onClear={() => app.remove("vaccine", open.key)}
        />
      )}
    </div>
  );
}

function VaccineForm({
  def,
  rec,
  onSave,
  onClear,
  onClose,
}: {
  def: VaccineDef;
  rec?: VaccineRecord;
  onSave: (r: VaccineRecord) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(toDateInput(rec?.doneAt ?? Date.now()));
  const [note, setNote] = useState(rec?.note ?? "");

  return (
    <Sheet title={`${def.name} • ${def.dose}`} onClose={onClose}>
      {def.note && <p className="text-sm text-[var(--muted)] mb-4">{def.note}</p>}
      <Field label="Data em que foi aplicada">
        <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Observação (lote, reação, local…)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SheetActions
        saveLabel="Marcar como aplicada"
        onSave={() => {
          onSave({ doneAt: fromDateInput(date), note: note.trim() || undefined });
          onClose();
        }}
      />
      {rec?.doneAt && (
        <button
          onClick={() => {
            onClear();
            onClose();
          }}
          className="w-full h-12 mt-3 rounded-2xl font-semibold border border-[var(--stroke)] text-[var(--muted)]"
        >
          Desmarcar
        </button>
      )}
    </Sheet>
  );
}
