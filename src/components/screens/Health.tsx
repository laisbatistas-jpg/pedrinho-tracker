"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { AlertList, Chips, Empty, Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { HealthEntry, HealthKind, Mood } from "@/lib/types";
import { fmtNum, formatClock, formatDate, fromLocalInput, genId, toLocalInput } from "@/lib/utils";

const KIND_INFO: Record<HealthKind, { label: string; icon: IconName }> = {
  remedio: { label: "Remédio", icon: "pill" },
  temperatura: { label: "Temperatura", icon: "thermo" },
  sintoma: { label: "Sintoma", icon: "alert" },
  humor: { label: "Humor", icon: "smile" },
};

const MOOD_LABEL: Record<Mood, string> = {
  feliz: "😄 Feliz",
  tranquilo: "😌 Tranquilo",
  irritado: "😣 Irritado",
  choroso: "😭 Choroso",
};

const SYMPTOMS = ["Cólica", "Tosse", "Coriza", "Vômito", "Diarreia", "Assadura", "Refluxo", "Dente nascendo"];

function toNum(v: string): number | undefined {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
}

function entryTitle(h: HealthEntry): string {
  switch (h.kind) {
    case "remedio":
      return `${h.name ?? "Remédio"}${h.dose ? ` • ${h.dose}` : ""}`;
    case "temperatura":
      return `${fmtNum(h.tempC ?? 0, 1)} °C`;
    case "sintoma":
      return h.name ?? "Sintoma";
    case "humor":
      return h.mood ? MOOD_LABEL[h.mood] : "Humor";
  }
}

function TempChart({ entries }: { entries: HealthEntry[] }) {
  const pts = entries
    .filter((e) => e.kind === "temperatura" && e.tempC)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-14);
  if (pts.length < 2) return null;
  const W = 340, H = 150, P = { l: 34, r: 10, t: 10, b: 20 };
  const min = 35.5, max = Math.max(39, ...pts.map((p) => p.tempC ?? 0)) + 0.2;
  const x = (i: number) => P.l + (i / (pts.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.tempC ?? 0).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de temperatura">
      {[36, 37, 38, 39].filter((t) => t < max).map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="rgba(167,139,250,0.12)" />
          <text x={P.l - 5} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#9aa0c3">{t}°</text>
        </g>
      ))}
      <line x1={P.l} x2={W - P.r} y1={y(37.8)} y2={y(37.8)} stroke="rgba(251,191,36,0.6)" strokeDasharray="4 4" />
      <path d={line} fill="none" stroke="#5b9bff" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.tempC ?? 0)} r="4" fill={(p.tempC ?? 0) >= 37.8 ? "#fbbf24" : "#c4b5fd"} stroke="#0c1226" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function HealthScreen({ app, go }: ScreenProps) {
  const { health } = app;
  const [filter, setFilter] = useState<"todos" | HealthKind>("todos");
  const [editing, setEditing] = useState<HealthEntry | null>(null);
  const [adding, setAdding] = useState<HealthKind | null>(null);

  const list = health.filter((h) => filter === "todos" || h.kind === filter);

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Saúde" subtitle="Remédios, temperatura, sintomas e humor" onBack={() => go("mais")} />

      <AlertList alerts={app.alerts.filter((a) => a.id.startsWith("med-") || a.id === "fever")} />

      <section className="glass p-4">
        <p className="label">Registrar agora</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(KIND_INFO) as HealthKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setAdding(k)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/5 border border-[var(--stroke)] hover:bg-white/10"
            >
              <span className="icon-badge w-10 h-10">
                <Icon name={KIND_INFO[k].icon} className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold">{KIND_INFO[k].label}</span>
            </button>
          ))}
        </div>
      </section>

      {health.some((h) => h.kind === "temperatura") && (
        <section className="glass p-4">
          <p className="font-semibold mb-1 px-1">Temperatura</p>
          <TempChart entries={health} />
          <p className="text-[11px] text-[var(--muted)] px-1">Linha amarela: 37,8 °C. Acima disso é considerado febre.</p>
        </section>
      )}

      <section className="glass p-5">
        <div className="mb-3">
          <Chips<"todos" | HealthKind>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "todos", label: "Tudo" },
              { value: "remedio", label: "Remédios" },
              { value: "temperatura", label: "Temp." },
              { value: "sintoma", label: "Sintomas" },
              { value: "humor", label: "Humor" },
            ]}
          />
        </div>
        {list.length === 0 ? (
          <Empty icon="pill" text="Nada registrado ainda." />
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((h) => (
              <li key={h.id}>
                <button onClick={() => setEditing(h)} className="w-full flex items-center gap-3 py-3 text-left">
                  <span className="icon-badge w-10 h-10">
                    <Icon name={KIND_INFO[h.kind].icon} className="w-[18px] h-[18px]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entryTitle(h)}</p>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {formatDate(h.timestamp)} às {formatClock(h.timestamp)}
                      {h.kind === "remedio" && h.everyHours ? ` • a cada ${h.everyHours}h` : ""}
                      {h.note ? ` • ${h.note}` : ""}
                      {h.by ? ` • por ${h.by}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-[var(--muted)] px-1">
        Este app não substitui orientação médica. Dose de remédio e febre: siga sempre o que o pediatra indicou.
      </p>

      {(adding || editing) && (
        <HealthForm
          initial={editing ?? undefined}
          kind={editing?.kind ?? adding ?? "remedio"}
          onClose={() => {
            setAdding(null);
            setEditing(null);
          }}
          onSave={(h) => app.upsert("health", h.id, h)}
          onDelete={(id) => app.remove("health", id)}
        />
      )}
    </div>
  );
}

function HealthForm({
  initial,
  kind,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: HealthEntry;
  kind: HealthKind;
  onSave: (h: HealthEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [when, setWhen] = useState(toLocalInput(initial?.timestamp ?? Date.now()));
  const [name, setName] = useState(initial?.name ?? "");
  const [dose, setDose] = useState(initial?.dose ?? "");
  const [every, setEvery] = useState(initial?.everyHours ? String(initial.everyHours) : "");
  const [temp, setTemp] = useState(initial?.tempC ? String(initial.tempC).replace(".", ",") : "");
  const [mood, setMood] = useState<Mood>(initial?.mood ?? "feliz");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  const save = () => {
    const h: HealthEntry = {
      id: initial?.id ?? genId(),
      kind,
      timestamp: fromLocalInput(when),
      note: note.trim() || undefined,
    };
    if (kind === "remedio") {
      if (!name.trim()) return setError("Informe o nome do remédio.");
      h.name = name.trim();
      h.dose = dose.trim() || undefined;
      h.everyHours = toNum(every);
    } else if (kind === "temperatura") {
      const t = toNum(temp);
      if (t === undefined || t < 30 || t > 45) return setError("Informe uma temperatura válida, ex.: 37,2.");
      h.tempC = t;
    } else if (kind === "sintoma") {
      if (!name.trim()) return setError("Informe o sintoma.");
      h.name = name.trim();
    } else {
      h.mood = mood;
    }
    onSave(h);
    onClose();
  };

  return (
    <Sheet title={`${initial ? "Editar" : "Novo"}: ${KIND_INFO[kind].label}`} onClose={onClose}>
      <Field label="Quando">
        <input type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} />
      </Field>

      {kind === "remedio" && (
        <>
          <Field label="Nome do remédio">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vitamina D" />
          </Field>
          <Field label="Dose (como o pediatra indicou)">
            <input className="field" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Ex.: 2 gotas" />
          </Field>
          <Field label="Repetir a cada quantas horas? (opcional)">
            <input inputMode="numeric" className="field" value={every} onChange={(e) => setEvery(e.target.value)} placeholder="Ex.: 24" />
          </Field>
          <p className="text-xs text-[var(--muted)] -mt-2 mb-4">Com isso, o app avisa quando chegar a hora da próxima dose.</p>
        </>
      )}

      {kind === "temperatura" && (
        <Field label="Temperatura (°C)">
          <input inputMode="decimal" className="field" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36,8" />
        </Field>
      )}

      {kind === "sintoma" && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button key={s} type="button" onClick={() => setName(s)} className={`chip ${name === s ? "chip-on" : ""}`}>
                {s}
              </button>
            ))}
          </div>
          <Field label="Sintoma">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Descreva" />
          </Field>
        </>
      )}

      {kind === "humor" && (
        <Field label="Como ele está?" group>
          <Chips<Mood>
            value={mood}
            onChange={setMood}
            options={(Object.keys(MOOD_LABEL) as Mood[]).map((m) => ({ value: m, label: MOOD_LABEL[m] }))}
          />
        </Field>
      )}

      <Field label="Observação (opcional)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SheetActions onSave={save} error={error} onDelete={initial ? () => { onDelete(initial.id); onClose(); } : undefined} />
    </Sheet>
  );
}
