"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Empty, Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { Milestone } from "@/lib/types";
import { MILESTONE_SUGGESTIONS } from "@/lib/reference";
import { ageLabel, formatDate, fromDateInput, genId, resizeImage, toDateInput } from "@/lib/utils";

export function MilestonesScreen({ app, go }: ScreenProps) {
  const { milestones, settings } = app;
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader
        title="Marcos"
        subtitle="As primeiras vezes do Pedrinho"
        onBack={() => go("mais")}
        right={
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Novo marco">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        }
      />

      {milestones.length === 0 ? (
        <section className="glass p-5">
          <Empty icon="star" text="Nenhum marco ainda. Registre o primeiro sorriso, o primeiro dente, os primeiros passos…" />
        </section>
      ) : (
        <ul className="space-y-4">
          {milestones.map((m) => (
            <li key={m.id}>
              <button onClick={() => setEditing(m)} className="glass w-full overflow-hidden text-left block">
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={m.title} className="w-full max-h-72 object-cover" />
                )}
                <div className="p-4 flex items-start gap-3">
                  <span className="icon-badge w-10 h-10">
                    <Icon name="star" className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg leading-tight">{m.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(m.timestamp)}
                      {settings.birthDate ? ` • ${ageLabel(settings.birthDate, m.timestamp)}` : ""}
                    </p>
                    {m.note && <p className="text-sm mt-2">{m.note}</p>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(adding || editing) && (
        <MilestoneForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={(m) => app.upsert("milestone", m.id, m)}
          onDelete={(id) => app.remove("milestone", id)}
        />
      )}
    </div>
  );
}

function MilestoneForm({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Milestone;
  onSave: (m: Milestone) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(toDateInput(initial?.timestamp ?? Date.now()));
  const [note, setNote] = useState(initial?.note ?? "");
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setPhoto(await resizeImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível usar essa foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={initial ? "Editar marco" : "Novo marco"} onClose={onClose}>
      {!initial && (
        <div className="mb-4 flex flex-wrap gap-2">
          {MILESTONE_SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setTitle(s)} className={`chip ${title === s ? "chip-on" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <Field label="O que aconteceu?">
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Primeiro sorriso" />
      </Field>
      <Field label="Data">
        <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Foto (opcional)" group>
        {photo ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Foto do marco" className="w-full max-h-56 object-cover rounded-2xl" />
            <button
              type="button"
              onClick={() => setPhoto(undefined)}
              className="absolute top-2 right-2 icon-badge w-9 h-9 !bg-black/60"
              aria-label="Remover foto"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-ghost w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          >
            <Icon name="camera" className="w-5 h-5" /> {busy ? "Preparando foto…" : "Escolher ou tirar foto"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Field>
      <Field label="Anotação (opcional)">
        <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SheetActions
        error={error}
        onSave={() => {
          if (!title.trim()) return setError("Dê um nome ao marco.");
          onSave({
            id: initial?.id ?? genId(),
            timestamp: fromDateInput(date),
            title: title.trim(),
            note: note.trim() || undefined,
            photo,
          });
          onClose();
        }}
        onDelete={initial ? () => { onDelete(initial.id); onClose(); } : undefined}
      />
    </Sheet>
  );
}
