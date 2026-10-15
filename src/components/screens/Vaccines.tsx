"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Field, PhotoField, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import { addToCalendar, placeLine } from "@/lib/agenda";
import type { ScreenProps } from "@/lib/nav";
import { VACCINES, type VaccineDef } from "@/lib/reference";
import { VACCINE_REACTIONS, type VaccineRecord } from "@/lib/types";
import { DAY, ageInDays, formatClock, formatDate, fromLocalInput, startOfDay, toLocalInput } from "@/lib/utils";

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
                        {!rec?.doneAt && rec?.scheduledAt ? ` • agendada para ${formatDate(rec.scheduledAt).slice(0, 5)} às ${formatClock(rec.scheduledAt)}` : ""}
                        {st === "atrasada" ? " • verifique com o pediatra" : ""}
                        {st === "proxima" ? " • próxima" : ""}
                      </p>
                      {(rec?.place || rec?.address) && (
                        <p className="text-xs text-[var(--muted)]">{placeLine(rec)}</p>
                      )}
                      {rec?.photos && rec.photos.length > 0 && (
                        <p className="text-xs text-[var(--muted)]">{rec.photos.length} {rec.photos.length === 1 ? "foto anexada" : "fotos anexadas"}</p>
                      )}
                      {rec?.by && <p className="text-xs text-[var(--muted)]">Registrado por {rec.by}</p>}
                      {rec?.doneAt && rec.reactions && rec.reactions.length > 0 && !rec.reactions.includes("Sem reação") && (
                        <p className="text-xs text-amber-200 mt-0.5">Reação: {rec.reactions.join(", ").toLowerCase()}</p>
                      )}
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
          babyName={settings.name || "Pedrinho"}
          allVaccines={vaccines}
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
  babyName,
  allVaccines,
  onSave,
  onClear,
  onClose,
}: {
  def: VaccineDef;
  rec?: VaccineRecord;
  babyName: string;
  allVaccines: Record<string, VaccineRecord>;
  onSave: (r: VaccineRecord) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"agendada" | "aplicada">(rec?.doneAt ? "aplicada" : rec?.scheduledAt ? "agendada" : "aplicada");
  const [when, setWhen] = useState(() =>
    toLocalInput(
      mode === "aplicada"
        ? rec?.doneAt ?? Date.now()
        : rec?.scheduledAt ?? startOfDay(Date.now()) + DAY + 9 * 3600000
    )
  );
  const [place, setPlace] = useState(rec?.place ?? "");
  const [address, setAddress] = useState(rec?.address ?? "");
  const [applier, setApplier] = useState(rec?.applier ?? "");
  const [batch, setBatch] = useState(rec?.batch ?? "");
  const [reactions, setReactions] = useState<string[]>(rec?.reactions ?? []);
  const [reactionNote, setReactionNote] = useState(rec?.reactionNote ?? "");
  const [note, setNote] = useState(rec?.note ?? "");
  const [photos, setPhotos] = useState<string[]>(rec?.photos ?? []);
  const [error, setError] = useState("");

  // locais já usados antes (para não digitar tudo de novo)
  const known = Object.values(allVaccines).filter((r) => r.place);
  const places = Array.from(new Set(known.map((r) => r.place as string))).slice(-4);

  const toggleReaction = (r: string) =>
    setReactions((cur) => {
      if (r === "Sem reação") return cur.includes(r) ? [] : [r];
      const without = cur.filter((x) => x !== "Sem reação");
      return without.includes(r) ? without.filter((x) => x !== r) : [...without, r];
    });

  const base = () => ({
    place: place.trim() || undefined,
    address: address.trim() || undefined,
    applier: applier.trim() || undefined,
    note: note.trim() || undefined,
    photos: photos.length ? photos : undefined,
  });

  const save = () => {
    const ts = fromLocalInput(when);
    if (!Number.isFinite(ts)) return setError("Informe a data e a hora.");
    if (mode === "agendada") {
      onSave({ doneAt: null, scheduledAt: ts, ...base() });
    } else {
      onSave({
        doneAt: ts,
        scheduledAt: null,
        ...base(),
        batch: batch.trim() || undefined,
        reactions: reactions.length ? reactions : undefined,
        reactionNote: reactionNote.trim() || undefined,
      });
    }
    onClose();
  };

  const agendaItem = () => ({
    key: `vaccine-${def.key}`,
    source: "vaccine" as const,
    id: def.key,
    title: `Vacina: ${def.name} (${def.dose})`,
    timestamp: fromLocalInput(when),
    place: place.trim() || undefined,
    address: address.trim() || undefined,
    doctor: applier.trim() || undefined,
  });

  return (
    <Sheet title={`${def.name} • ${def.dose}`} onClose={onClose}>
      {def.note && <p className="text-sm text-[var(--muted)] mb-4">{def.note}</p>}

      <Field label="Situação" group>
        <Chips<"agendada" | "aplicada">
          value={mode}
          onChange={(m) => {
            setMode(m);
            setWhen(toLocalInput(m === "aplicada" ? Date.now() : startOfDay(Date.now()) + DAY + 9 * 3600000));
          }}
          options={[
            { value: "agendada", label: "Agendar" },
            { value: "aplicada", label: "Já foi aplicada" },
          ]}
        />
      </Field>

      <Field label={mode === "agendada" ? "Data e hora agendadas" : "Data e hora em que foi aplicada"}>
        <input type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} />
      </Field>

      <Field label="Local (posto, clínica)">
        <input className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Ex.: UBS Centro" />
      </Field>
      {places.length > 0 && (
        <div className="-mt-2 mb-4 flex flex-wrap gap-2">
          {places.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPlace(p);
                const prev = known.find((r) => r.place === p && r.address);
                if (prev?.address && !address) setAddress(prev.address);
              }}
              className="chip"
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <Field label="Endereço do local">
        <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
      </Field>
      <Field label={mode === "agendada" ? "Médica ou profissional (opcional)" : "Quem aplicou ou médica"}>
        <input className="field" value={applier} onChange={(e) => setApplier(e.target.value)} placeholder="Nome" />
      </Field>

      {mode === "aplicada" && (
        <>
          <Field label="Lote (se anotou)">
            <input className="field" value={batch} onChange={(e) => setBatch(e.target.value)} />
          </Field>

          <div className="border-t border-white/10 pt-4 mb-1">
            <p className="font-semibold mb-1">Sintomas depois da vacina</p>
            <p className="text-xs text-[var(--muted)] mb-3">Marque o que aparecer. Se algo preocupar, fale com o pediatra.</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Sintomas depois da vacina">
            {VACCINE_REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleReaction(r)}
                className={`chip ${reactions.includes(r) ? "chip-on" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>
          <Field label="Detalhes da reação (quando começou, até que temperatura…)">
            <textarea className="field" value={reactionNote} onChange={(e) => setReactionNote(e.target.value)} />
          </Field>
        </>
      )}

      <Field label="Observação">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <PhotoField label="Fotos (caderneta, comprovante, local da reação)" photos={photos} onChange={setPhotos} />

      <SheetActions
        saveLabel={mode === "agendada" ? "Salvar agendamento" : "Marcar como aplicada"}
        onSave={save}
        error={error}
      />
      {mode === "agendada" && Number.isFinite(fromLocalInput(when)) && (
        <button
          onClick={() => addToCalendar(agendaItem(), babyName)}
          className="btn-ghost w-full h-12 mt-3 rounded-2xl font-semibold"
        >
          Adicionar ao Calendário do celular
        </button>
      )}
      {(rec?.doneAt || rec?.scheduledAt) && (
        <button
          onClick={() => {
            onClear();
            onClose();
          }}
          className="w-full h-12 mt-3 rounded-2xl font-semibold border border-[var(--stroke)] text-[var(--muted)]"
        >
          {rec?.doneAt ? "Desmarcar" : "Cancelar agendamento"}
        </button>
      )}
    </Sheet>
  );
}
