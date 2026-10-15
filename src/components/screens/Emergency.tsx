"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { VACCINES } from "@/lib/reference";
import type { EmergencyCard } from "@/lib/types";
import { ageLabel, fmtNum, formatClock, formatDate, isFeed } from "@/lib/utils";

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];
const HOUR = 3600000;

const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

type Line = [label: string, value: string];

/** Monta o resumo em linhas (usado na tela e no texto copiado). */
function buildSummary(app: ScreenProps["app"]) {
  const { settings, card, growth, health, events, vaccines } = app;
  const now = app.now || Date.now();
  const name = settings.name || "Bebê";

  const w = [...growth].reverse().find((g) => g.weightKg);
  const h = [...growth].reverse().find((g) => g.heightCm);

  const id: Line[] = [];
  id.push(["Nome", name]);
  if (settings.birthDate) {
    id.push(["Idade", ageLabel(settings.birthDate, now)]);
    id.push(["Nascimento", formatDate(new Date(`${settings.birthDate}T00:00:00`).getTime())]);
  }
  if (w) id.push(["Peso", `${fmtNum(w.weightKg ?? 0, 2)} kg (medido em ${formatDate(w.timestamp)})`]);
  if (h) id.push(["Altura", `${fmtNum(h.heightCm ?? 0, 1)} cm (medida em ${formatDate(h.timestamp)})`]);
  id.push(["Alergias", card.allergies.trim() || "Nenhuma informada"]);
  if (card.bloodType) id.push(["Tipo sanguíneo", card.bloodType]);
  if (card.meds.trim()) id.push(["Remédios de uso contínuo", card.meds.trim()]);
  if (card.insurance || card.insuranceNumber)
    id.push(["Convênio", [card.insurance, card.insuranceNumber].filter(Boolean).join(" • ")]);
  if (card.pediatra || card.pediatraPhone)
    id.push(["Pediatra", [card.pediatra, card.pediatraPhone].filter(Boolean).join(" • ")]);
  if (card.hospital || card.hospitalAddress || card.hospitalPhone)
    id.push(["Hospital preferido", [card.hospital, card.hospitalAddress, card.hospitalPhone].filter(Boolean).join(" • ")]);
  if (card.contact1Name || card.contact1Phone) id.push(["Contato 1", [card.contact1Name, card.contact1Phone].filter(Boolean).join(" • ")]);
  if (card.contact2Name || card.contact2Phone) id.push(["Contato 2", [card.contact2Name, card.contact2Phone].filter(Boolean).join(" • ")]);
  if (card.note.trim()) id.push(["Observações", card.note.trim()]);

  // últimas 24 horas
  const since = now - 24 * HOUR;
  const recent: Line[] = [];
  const meds = health.filter((x) => x.kind === "remedio" && x.timestamp >= since);
  if (meds.length)
    recent.push([
      "Remédios dados",
      meds
        .map((m) => `${m.name}${m.dose ? ` (${m.dose})` : ""} às ${formatClock(m.timestamp)}${m.by ? ` por ${m.by}` : ""}`)
        .join("; "),
    ]);
  const temps = health.filter((x) => x.kind === "temperatura" && x.timestamp >= since);
  if (temps.length)
    recent.push(["Temperatura", temps.map((t) => `${fmtNum(t.tempC ?? 0, 1)} °C às ${formatClock(t.timestamp)}`).join("; ")]);
  const symptoms = health.filter((x) => x.kind === "sintoma" && x.timestamp >= since);
  if (symptoms.length) recent.push(["Sintomas", symptoms.map((s) => `${s.name} às ${formatClock(s.timestamp)}`).join("; ")]);
  const lastFeed = events.find(isFeed);
  if (lastFeed) {
    recent.push([
      "Última mamada",
      `${formatClock(lastFeed.timestamp)}${lastFeed.type === "mamadeira" && lastFeed.ml ? ` (${lastFeed.ml} ml)` : ""}${lastFeed.by ? ` por ${lastFeed.by}` : ""}`,
    ]);
  }
  const diapers = events.filter((e) => e.type === "fralda" && e.timestamp >= since);
  if (diapers.length) {
    const wet = diapers.filter((d) => d.diaper !== "suja").length;
    const dirty = diapers.filter((d) => d.diaper !== "molhada").length;
    recent.push(["Fraldas", `${wet} ${wet === 1 ? "molhada" : "molhadas"}, ${dirty} ${dirty === 1 ? "suja" : "sujas"}`]);
  }

  // vacinas nos últimos 14 dias (com reação)
  const vac: Line[] = [];
  Object.entries(vaccines)
    .filter(([, r]) => r.doneAt && r.doneAt >= now - 14 * 24 * HOUR)
    .sort((a, b) => (b[1].doneAt ?? 0) - (a[1].doneAt ?? 0))
    .forEach(([k, r]) => {
      const def = VACCINES.find((d) => d.key === k);
      vac.push([
        `Vacina ${def ? `${def.name} (${def.dose})` : k}`,
        [
          formatDate(r.doneAt ?? 0),
          [r.place, r.address].filter(Boolean).join(" — "),
          r.reactions && r.reactions.length ? `reação: ${r.reactions.join(", ").toLowerCase()}` : "",
          r.reactionNote ?? "",
        ]
          .filter(Boolean)
          .join(" • "),
      ]);
    });

  return { id, recent, vac, name };
}

export function EmergencyScreen({ app, go }: ScreenProps) {
  const { card } = app;
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const s = buildSummary(app);

  const text = [
    `FICHA DE EMERGÊNCIA — ${s.name}`,
    ...s.id.map(([k, v]) => `${k}: ${v}`),
    ...(s.recent.length ? ["", "ÚLTIMAS 24 HORAS", ...s.recent.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(s.vac.length ? ["", "VACINAS RECENTES", ...s.vac.map(([k, v]) => `${k}: ${v}`)] : []),
    "",
    `Gerado em ${formatDate(app.now || Date.now())} às ${formatClock(app.now || Date.now())} pelo Pedrinho Tracker`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Resumo copiado. Cole no WhatsApp ou mostre ao médico.");
    } catch {
      setMsg("Não consegui copiar. Segure o dedo no texto abaixo para copiar.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: `Ficha de emergência — ${s.name}`, text });
    } catch {
      /* cancelado */
    }
  };

  const empty = !card.pediatra && !card.allergies && !card.contact1Phone;

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader
        title="Emergência"
        subtitle="Para mostrar ao médico"
        onBack={() => go("mais")}
        right={
          <button onClick={() => setEditing(true)} className="btn-ghost px-4 h-10 rounded-full font-semibold text-sm flex items-center gap-2">
            <Icon name="edit" className="w-4 h-4" /> Editar
          </button>
        }
      />

      <section className="glass p-4 !border-red-400/40">
        <p className="text-xs text-[var(--muted)] mb-3">
          Em caso de emergência, ligue para o SAMU. Este app não substitui atendimento médico.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:192" className="col-span-2 h-14 rounded-2xl font-bold text-lg grid place-items-center bg-red-500/85 text-white">
            Ligar 192 (SAMU)
          </a>
          {card.pediatraPhone && (
            <a href={telHref(card.pediatraPhone)} className="btn-ghost h-12 rounded-2xl font-semibold grid place-items-center text-sm px-2 text-center">
              Pediatra{card.pediatra ? `: ${card.pediatra}` : ""}
            </a>
          )}
          {card.hospitalPhone && (
            <a href={telHref(card.hospitalPhone)} className="btn-ghost h-12 rounded-2xl font-semibold grid place-items-center text-sm px-2 text-center">
              Hospital{card.hospital ? `: ${card.hospital}` : ""}
            </a>
          )}
          {card.contact1Phone && (
            <a href={telHref(card.contact1Phone)} className="btn-ghost h-12 rounded-2xl font-semibold grid place-items-center text-sm px-2 text-center">
              {card.contact1Name || "Contato 1"}
            </a>
          )}
          {card.contact2Phone && (
            <a href={telHref(card.contact2Phone)} className="btn-ghost h-12 rounded-2xl font-semibold grid place-items-center text-sm px-2 text-center">
              {card.contact2Name || "Contato 2"}
            </a>
          )}
        </div>
      </section>

      {empty && (
        <button onClick={() => setEditing(true)} className="glass w-full p-4 text-left">
          <p className="font-semibold">Preencha a ficha</p>
          <p className="text-sm text-[var(--muted)]">Pediatra, hospital, alergias, convênio e contatos. Leva 2 minutos.</p>
        </button>
      )}

      <section className="glass p-5">
        <h3 className="font-semibold text-lg mb-3">Dados do {s.name}</h3>
        <dl className="space-y-2.5">
          {s.id.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-[var(--muted)]">{k}</dt>
              <dd className="font-medium whitespace-pre-line">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="glass p-5">
        <h3 className="font-semibold text-lg mb-3">Últimas 24 horas</h3>
        {s.recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum registro nas últimas 24 horas.</p>
        ) : (
          <dl className="space-y-2.5">
            {s.recent.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-[var(--muted)]">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {s.vac.length > 0 && (
        <section className="glass p-5">
          <h3 className="font-semibold text-lg mb-3">Vacinas recentes</h3>
          <dl className="space-y-2.5">
            {s.vac.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-[var(--muted)]">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="glass p-5">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={copy} className="btn-grad h-12 rounded-2xl font-semibold">Copiar resumo</button>
          <button onClick={share} className="btn-ghost h-12 rounded-2xl font-semibold">Compartilhar</button>
        </div>
        {msg && <p className="text-sm text-emerald-300 mt-3">{msg}</p>}
        <pre className="mt-4 text-xs text-[var(--muted)] whitespace-pre-wrap break-words select-text font-sans">{text}</pre>
      </section>

      {editing && <CardForm card={card} onSave={(c) => app.upsert("card", "main", c)} onClose={() => setEditing(false)} />}
    </div>
  );
}

function CardForm({ card, onSave, onClose }: { card: EmergencyCard; onSave: (c: EmergencyCard) => void; onClose: () => void }) {
  const [c, setC] = useState<EmergencyCard>(card);
  const set = <K extends keyof EmergencyCard>(k: K, v: EmergencyCard[K]) => setC((cur) => ({ ...cur, [k]: v }));
  const text = (k: keyof EmergencyCard, label: string, placeholder?: string, mode?: "tel") => (
    <Field label={label}>
      <input
        className="field"
        inputMode={mode}
        type={mode === "tel" ? "tel" : "text"}
        value={c[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <Sheet title="Ficha de emergência" onClose={onClose}>
      {text("pediatra", "Pediatra", "Ex.: Dra. Ana Souza")}
      {text("pediatraPhone", "Telefone do pediatra", "(00) 00000-0000", "tel")}
      {text("hospital", "Hospital ou pronto-socorro preferido", "Ex.: Hospital Infantil")}
      {text("hospitalPhone", "Telefone do hospital", "", "tel")}
      {text("hospitalAddress", "Endereço do hospital", "Rua, número, bairro")}
      {text("insurance", "Convênio (se tiver)", "Ex.: Unimed")}
      {text("insuranceNumber", "Número da carteirinha")}
      <Field label="Tipo sanguíneo" group>
        <Chips<string>
          value={c.bloodType}
          onChange={(v) => set("bloodType", c.bloodType === v ? "" : v)}
          options={BLOOD.map((b) => ({ value: b, label: b }))}
        />
      </Field>
      <Field label="Alergias (remédios, alimentos…)">
        <textarea className="field" value={c.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Ex.: nenhuma conhecida" />
      </Field>
      <Field label="Remédios de uso contínuo">
        <textarea className="field" value={c.meds} onChange={(e) => set("meds", e.target.value)} />
      </Field>
      {text("contact1Name", "Contato de emergência 1 (nome)")}
      {text("contact1Phone", "Telefone do contato 1", "", "tel")}
      {text("contact2Name", "Contato de emergência 2 (nome)")}
      {text("contact2Phone", "Telefone do contato 2", "", "tel")}
      <Field label="Observações importantes">
        <textarea className="field" value={c.note} onChange={(e) => set("note", e.target.value)} />
      </Field>
      <SheetActions
        saveLabel="Salvar ficha"
        onSave={() => {
          onSave(c);
          onClose();
        }}
      />
    </Sheet>
  );
}
