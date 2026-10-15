"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Empty, Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { Growth } from "@/lib/types";
import { METRIC_INFO, WHO, growthBand, type GrowthMetric } from "@/lib/reference";
import { ageInMonths, ageLabel, fmtNum, formatDate, fromDateInput, genId, toDateInput } from "@/lib/utils";

const W = 340;
const H = 230;
const PAD = { l: 38, r: 12, t: 12, b: 28 };

function toNum(v: string): number | undefined {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
}

function GrowthChart({
  metric,
  sex,
  points,
}: {
  metric: GrowthMetric;
  sex: "menino" | "menina";
  points: { months: number; value: number }[];
}) {
  const c = WHO[sex][metric];
  const values = [...c.low, ...c.high, ...points.map((p) => p.value)];
  const lo = Math.floor(Math.min(...values));
  const hi = Math.ceil(Math.max(...values));
  const step = Math.max(1, Math.ceil((hi - lo) / 4));
  const yMin = lo;
  const yMax = lo + step * 4;
  const x = (m: number) => PAD.l + (m / 12) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const months = Array.from({ length: 13 }, (_, i) => i);
  const band =
    months.map((m, i) => `${i === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(c.high[m]).toFixed(1)}`).join(" ") +
    " " +
    [...months].reverse().map((m) => `L${x(m).toFixed(1)},${y(c.low[m]).toFixed(1)}`).join(" ") +
    " Z";
  const mid = months.map((m, i) => `${i === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(c.mid[m]).toFixed(1)}`).join(" ");
  const sorted = [...points].sort((a, b) => a.months - b.months);
  const line = sorted.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.months).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + step * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Curva de crescimento">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(167,139,250,0.12)" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#9aa0c3">
            {t}
          </text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((m) => (
        <text key={m} x={x(m)} y={H - 8} textAnchor="middle" fontSize="9" fill="#9aa0c3">
          {m}m
        </text>
      ))}
      <path d={band} fill="rgba(124,58,237,0.18)" stroke="none" />
      <path d={mid} fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth="1.5" strokeDasharray="4 4" />
      {sorted.length > 1 && <path d={line} fill="none" stroke="#5b9bff" strokeWidth="2" />}
      {sorted.map((p, i) => (
        <circle key={i} cx={x(p.months)} cy={y(p.value)} r="4.5" fill="#c4b5fd" stroke="#0c1226" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function GrowthScreen({ app, go }: ScreenProps) {
  const { growth, settings, now } = app;
  const [metric, setMetric] = useState<GrowthMetric>("weightKg");
  const [editing, setEditing] = useState<Growth | null>(null);
  const [adding, setAdding] = useState(false);

  const info = METRIC_INFO[metric];
  const hasBirth = Boolean(settings.birthDate);

  const withMonths = growth
    .filter((g) => g[metric] !== undefined)
    .map((g) => ({ g, months: ageInMonths(settings.birthDate, g.timestamp) }));
  const points = withMonths
    .filter((p): p is { g: Growth; months: number } => p.months !== null && p.months >= 0 && p.months <= 12)
    .map((p) => ({ months: p.months, value: p.g[metric] as number }));

  const latest = [...withMonths].reverse()[0];
  const band =
    latest && latest.months !== null
      ? growthBand(settings.sex, metric, latest.months, latest.g[metric] as number)
      : null;
  const bandText =
    band === "dentro"
      ? "Dentro da faixa de referência da OMS."
      : band === "abaixo"
        ? "Abaixo da faixa de referência da OMS — converse com o pediatra."
        : band === "acima"
          ? "Acima da faixa de referência da OMS — converse com o pediatra."
          : "";

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader
        title="Crescimento"
        subtitle={hasBirth ? `${settings.name} • ${ageLabel(settings.birthDate, now || Date.now())}` : "Informe a data de nascimento"}
        onBack={() => go("mais")}
        right={
          <button onClick={() => setAdding(true)} className="icon-badge w-10 h-10" aria-label="Nova medição">
            <Icon name="plus" className="w-5 h-5" />
          </button>
        }
      />

      <Chips<GrowthMetric>
        value={metric}
        onChange={setMetric}
        options={[
          { value: "weightKg", label: "Peso" },
          { value: "heightCm", label: "Altura" },
          { value: "headCm", label: "Cabeça" },
        ]}
      />

      <section className="glass p-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="font-semibold">{info.label} ({info.unit})</p>
          <p className="text-[11px] text-[var(--muted)]">curva OMS • {settings.sex === "menino" ? "meninos" : "meninas"}</p>
        </div>
        <GrowthChart metric={metric} sex={settings.sex} points={points} />
        <p className="text-[11px] text-[var(--muted)] mt-1 px-1">
          Faixa roxa: de -2 a +2 desvios-padrão. Linha tracejada: mediana.
        </p>
        {!hasBirth && (
          <button onClick={() => go("config")} className="mt-3 text-xs font-semibold text-[var(--violet)] text-left">
            Informe a data de nascimento nas configurações para ver os pontos no gráfico →
          </button>
        )}
        {latest && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-[var(--muted)]">Última medição ({formatDate(latest.g.timestamp)})</p>
            <p className="grad-text text-3xl font-extrabold">
              {fmtNum(latest.g[metric] as number, metric === "weightKg" ? 2 : 1)} {info.unit}
            </p>
            {bandText && <p className="text-sm mt-1">{bandText}</p>}
          </div>
        )}
      </section>

      <section className="glass p-5">
        <h3 className="font-semibold text-lg mb-2">Medições</h3>
        {growth.length === 0 ? (
          <Empty icon="trend" text="Nenhuma medição ainda. Toque em + para registrar peso, altura e perímetro da cabeça." />
        ) : (
          <ul className="divide-y divide-white/10">
            {[...growth].reverse().map((g) => (
              <li key={g.id}>
                <button onClick={() => setEditing(g)} className="w-full flex items-center gap-3 py-3 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{formatDate(g.timestamp)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {hasBirth ? `${ageLabel(settings.birthDate, g.timestamp)} • ` : ""}
                      {g.weightKg ? `${fmtNum(g.weightKg, 2)} kg` : ""}
                      {g.heightCm ? ` • ${fmtNum(g.heightCm, 1)} cm` : ""}
                      {g.headCm ? ` • cabeça ${fmtNum(g.headCm, 1)} cm` : ""}
                    </p>
                  </div>
                  <Icon name="edit" className="w-4 h-4 text-[var(--muted)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(adding || editing) && (
        <GrowthForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={(g) => app.upsert("growth", g.id, g)}
          onDelete={(id) => app.remove("growth", id)}
        />
      )}
    </div>
  );
}

function GrowthForm({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Growth;
  onSave: (g: Growth) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(toDateInput(initial?.timestamp ?? Date.now()));
  const [weight, setWeight] = useState(initial?.weightKg ? String(initial.weightKg).replace(".", ",") : "");
  const [height, setHeight] = useState(initial?.heightCm ? String(initial.heightCm).replace(".", ",") : "");
  const [head, setHead] = useState(initial?.headCm ? String(initial.headCm).replace(".", ",") : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  const save = () => {
    const w = toNum(weight);
    const h = toNum(height);
    const c = toNum(head);
    if (w === undefined && h === undefined && c === undefined) return setError("Preencha pelo menos uma medida.");
    onSave({
      id: initial?.id ?? genId(),
      timestamp: fromDateInput(date),
      weightKg: w,
      heightCm: h,
      headCm: c,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet title={initial ? "Editar medição" : "Nova medição"} onClose={onClose}>
      <Field label="Data">
        <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Peso (kg)">
          <input inputMode="decimal" className="field" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="5,2" />
        </Field>
        <Field label="Altura (cm)">
          <input inputMode="decimal" className="field" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="58" />
        </Field>
        <Field label="Cabeça (cm)">
          <input inputMode="decimal" className="field" value={head} onChange={(e) => setHead(e.target.value)} placeholder="39" />
        </Field>
      </div>
      <Field label="Observação (opcional)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: consulta de 2 meses" />
      </Field>
      <SheetActions onSave={save} error={error} onDelete={initial ? () => { onDelete(initial.id); onClose(); } : undefined} />
    </Sheet>
  );
}
