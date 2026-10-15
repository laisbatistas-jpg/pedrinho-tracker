"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Empty, Field, ScreenHeader, Sheet, SheetActions } from "@/components/ui";
import { countdownLabel, daysUntil, downloadIcs, listAppointments, placeLine, visitTitle, type Appointment } from "@/lib/agenda";
import type { ScreenProps } from "@/lib/nav";
import { VISIT_KINDS } from "@/lib/reference";
import type { Visit, VisitKind, VisitOutcome, VisitStatus } from "@/lib/types";
import {
  DAY, formatClock, formatDate, fromLocalInput, genId, startOfDay, toLocalInput,
} from "@/lib/utils";

const OUTCOMES: { value: VisitOutcome; label: string }[] = [
  { value: "tudo_bem", label: "Tudo bem" },
  { value: "atencao", label: "Pontos de atenção" },
  { value: "retorno", label: "Precisa de retorno" },
];
const outcomeLabel = (o?: VisitOutcome) => OUTCOMES.find((x) => x.value === o)?.label;

function toNum(v: string): number | undefined {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

type Editing = { visit?: Visit; status?: VisitStatus } | null;

export function VisitsScreen({ app, go }: ScreenProps) {
  const { visits, vaccines, settings, now } = app;
  const [editing, setEditing] = useState<Editing>(null);
  const t = now || Date.now();

  const scheduled = visits.filter((v) => v.status === "agendada");
  const pending = scheduled.filter((v) => v.timestamp < t - 2 * 3600000);
  const upcoming = listAppointments(visits, vaccines).filter((a) => a.source === "visit" && a.timestamp >= t - 2 * 3600000);
  const past = visits.filter((v) => v.status !== "agendada").sort((a, b) => b.timestamp - a.timestamp);

  const byId = (id: string) => visits.find((v) => v.id === id);

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader
        title="Consultas"
        subtitle={`${upcoming.length} ${upcoming.length === 1 ? "agendada" : "agendadas"}`}
        onBack={() => go("mais")}
        right={
          <button onClick={() => setEditing({})} className="btn-grad px-4 h-10 rounded-full font-semibold flex items-center gap-2 text-sm">
            <Icon name="plus" className="w-4 h-4" /> Agendar
          </button>
        }
      />

      {pending.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-200 px-1">Como foi? Falta registrar</h3>
          {pending.map((v) => (
            <VisitCard key={v.id} v={v} tone="warn" onOpen={() => setEditing({ visit: v })} onDone={() => setEditing({ visit: v, status: "realizada" })} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--muted)] px-1">Próximas</h3>
        {upcoming.length === 0 && <Empty icon="stethoscope" text="Nenhuma consulta agendada. Toque em “Agendar”." />}
        {upcoming.map((a) => {
          const v = byId(a.id);
          if (!v) return null;
          return (
            <VisitCard
              key={v.id}
              v={v}
              appt={a}
              now={t}
              babyName={settings.name || "Pedrinho"}
              onOpen={() => setEditing({ visit: v })}
              onDone={() => setEditing({ visit: v, status: "realizada" })}
            />
          );
        })}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted)] px-1">Histórico</h3>
          {past.map((v) => (
            <VisitCard key={v.id} v={v} onOpen={() => setEditing({ visit: v })} />
          ))}
        </section>
      )}

      {editing && (
        <VisitForm
          app={app}
          visit={editing.visit}
          startStatus={editing.status}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function VisitCard({
  v, appt, now, babyName, tone, onOpen, onDone,
}: {
  v: Visit;
  appt?: Appointment;
  now?: number;
  babyName?: string;
  tone?: "warn";
  onOpen: () => void;
  onDone?: () => void;
}) {
  const where = placeLine(v);
  const isPast = v.status !== "agendada";
  const soon = appt && now ? daysUntil(v.timestamp, now) <= 1 && v.timestamp > now : false;
  return (
    <div className={`glass p-4 ${tone === "warn" || soon ? "!border-amber-400/50" : ""}`}>
      <button onClick={onOpen} className="w-full text-left flex items-start gap-3">
        <span className="icon-badge w-11 h-11">
          <Icon name={v.status === "realizada" ? "check" : "stethoscope"} className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">
            {visitTitle(v.kind)}
            {v.status === "cancelada" && <span className="text-[var(--muted)] font-normal"> • cancelada</span>}
          </p>
          <p className="text-sm text-[var(--muted)] cap-first">
            {formatDate(v.timestamp)} às {formatClock(v.timestamp)}
            {appt && now ? ` • ${countdownLabel(v.timestamp, now)}` : ""}
          </p>
          {v.doctor && <p className="text-sm mt-1">{v.doctor}</p>}
          {where && <p className="text-sm text-[var(--muted)]">{where}</p>}
          {isPast && v.outcome && (
            <span
              className={`inline-block mt-2 text-xs font-semibold rounded-full px-2.5 py-1 border ${
                v.outcome === "tudo_bem"
                  ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-200"
                  : "bg-amber-500/15 border-amber-400/50 text-amber-200"
              }`}
            >
              {outcomeLabel(v.outcome)}
            </span>
          )}
          {isPast && v.note && <p className="text-sm mt-2 text-[var(--muted)] line-clamp-3">{v.note}</p>}
        </div>
      </button>
      {!isPast && (
        <div className="flex gap-2 mt-3">
          {onDone && (
            <button onClick={onDone} className="btn-ghost flex-1 h-10 rounded-xl text-sm font-semibold">
              Como foi?
            </button>
          )}
          {appt && (
            <button
              onClick={() => downloadIcs(appt, babyName || "Pedrinho")}
              className="btn-ghost flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Icon name="bell" className="w-4 h-4" /> Lembrete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VisitForm({
  app, visit, startStatus, onClose,
}: {
  app: ScreenProps["app"];
  visit?: Visit;
  startStatus?: VisitStatus;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<VisitKind>(visit?.kind ?? "pediatra");
  const [status, setStatus] = useState<VisitStatus>(startStatus ?? visit?.status ?? "agendada");
  const [when, setWhen] = useState(() =>
    toLocalInput(visit?.timestamp ?? startOfDay(Date.now()) + DAY + 9 * 3600000)
  );
  const [doctor, setDoctor] = useState(visit?.doctor ?? "");
  const [place, setPlace] = useState(visit?.place ?? "");
  const [address, setAddress] = useState(visit?.address ?? "");
  const [reason, setReason] = useState(visit?.reason ?? "");
  const [outcome, setOutcome] = useState<VisitOutcome>(visit?.outcome ?? "tudo_bem");
  const [note, setNote] = useState(visit?.note ?? "");
  const [guidance, setGuidance] = useState(visit?.guidance ?? "");
  const [weight, setWeight] = useState(visit?.weightKg ? String(visit.weightKg).replace(".", ",") : "");
  const [height, setHeight] = useState(visit?.heightCm ? String(visit.heightCm).replace(".", ",") : "");
  const [head, setHead] = useState(visit?.headCm ? String(visit.headCm).replace(".", ",") : "");
  const [returnWhen, setReturnWhen] = useState("");
  const [error, setError] = useState("");

  // dicas de lugares já usados antes
  const places = Array.from(new Set(app.visits.map((x) => x.place).filter(Boolean) as string[])).slice(-4);
  const doctors = Array.from(new Set(app.visits.map((x) => x.doctor).filter(Boolean) as string[])).slice(-4);

  const save = () => {
    const ts = fromLocalInput(when);
    if (!Number.isFinite(ts)) return setError("Informe a data e a hora.");
    const id = visit?.id ?? genId();
    const v: Visit = {
      id,
      kind,
      status,
      timestamp: ts,
      doctor: doctor.trim() || undefined,
      place: place.trim() || undefined,
      address: address.trim() || undefined,
      reason: reason.trim() || undefined,
    };
    const gid = `visit-${id}`;
    if (status === "realizada") {
      v.outcome = outcome;
      v.note = note.trim() || undefined;
      v.guidance = guidance.trim() || undefined;
      v.weightKg = toNum(weight);
      v.heightCm = toNum(height);
      v.headCm = toNum(head);
      // medidas da consulta entram também na tela de Crescimento
      if (v.weightKg || v.heightCm || v.headCm) {
        app.upsert("growth", gid, { id: gid, timestamp: ts, weightKg: v.weightKg, heightCm: v.heightCm, headCm: v.headCm, note: "Medidas da consulta" });
      } else if (visit && (visit.weightKg || visit.heightCm || visit.headCm)) {
        app.remove("growth", gid);
      }
      // retorno marcado: cria (ou atualiza) a próxima consulta
      const retId = `ret-${id}`;
      if (returnWhen) {
        const rts = fromLocalInput(returnWhen);
        if (Number.isFinite(rts)) {
          const existing = app.visits.find((x) => x.id === retId);
          const r: Visit = {
            ...(existing ?? {}),
            id: retId,
            kind: "retorno",
            status: existing?.status ?? "agendada",
            timestamp: rts,
            doctor: v.doctor,
            place: v.place,
            address: v.address,
          };
          app.upsert("visit", retId, r);
        }
      }
    }
    app.upsert("visit", id, v);
    onClose();
  };

  return (
    <Sheet title={visit ? "Editar consulta" : "Agendar consulta"} onClose={onClose}>
      <Field label="Tipo" group>
        <Chips<VisitKind> options={VISIT_KINDS} value={kind} onChange={setKind} />
      </Field>

      {visit && (
        <Field label="Situação" group>
          <Chips<VisitStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: "agendada", label: "Agendada" },
              { value: "realizada", label: "Realizada" },
              { value: "cancelada", label: "Cancelada" },
            ]}
          />
        </Field>
      )}

      <Field label="Data e hora">
        <input type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} />
      </Field>

      <Field label="Médica(o)">
        <input className="field" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Ex.: Dra. Ana Souza" />
      </Field>
      {doctors.length > 0 && (
        <div className="-mt-2 mb-4 flex flex-wrap gap-2">
          {doctors.map((d) => (
            <button key={d} type="button" onClick={() => setDoctor(d)} className="chip">{d}</button>
          ))}
        </div>
      )}

      <Field label="Local (clínica, hospital, posto)">
        <input className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Ex.: Clínica Bem-Estar" />
      </Field>
      {places.length > 0 && (
        <div className="-mt-2 mb-4 flex flex-wrap gap-2">
          {places.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPlace(p);
                const prev = app.visits.find((x) => x.place === p && x.address);
                if (prev?.address && !address) setAddress(prev.address);
              }}
              className="chip"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <Field label="Endereço">
        <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
      </Field>

      <Field label={status === "agendada" ? "Motivo ou dúvidas para perguntar" : "Motivo"}>
        <textarea className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: rotina de 4 meses; perguntar sobre introdução alimentar" />
      </Field>

      {status === "realizada" && (
        <>
          <div className="border-t border-white/10 pt-4 mb-1">
            <p className="font-semibold mb-3">Como foi a consulta</p>
          </div>
          <Field label="Resultado" group>
            <Chips<VisitOutcome> options={OUTCOMES} value={outcome} onChange={setOutcome} />
          </Field>
          <Field label="O que aconteceu">
            <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Como o bebê estava, o que a médica disse…" />
          </Field>
          <Field label="Orientações e receitas">
            <textarea className="field" value={guidance} onChange={(e) => setGuidance(e.target.value)} placeholder="Remédios, exames pedidos, cuidados…" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Peso (kg)">
              <input inputMode="decimal" className="field" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="6,4" />
            </Field>
            <Field label="Altura (cm)">
              <input inputMode="decimal" className="field" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="62" />
            </Field>
            <Field label="Cabeça (cm)">
              <input inputMode="decimal" className="field" value={head} onChange={(e) => setHead(e.target.value)} placeholder="41" />
            </Field>
          </div>
          <p className="text-xs text-[var(--muted)] -mt-2 mb-4">As medidas também entram na tela Crescimento.</p>
          <Field label="Marcar o retorno (opcional)">
            <input type="datetime-local" className="field" value={returnWhen} onChange={(e) => setReturnWhen(e.target.value)} />
          </Field>
        </>
      )}

      <SheetActions
        saveLabel={status === "realizada" ? "Salvar consulta" : visit ? "Salvar" : "Agendar"}
        onSave={save}
        error={error}
        onDelete={
          visit
            ? () => {
                app.remove("visit", visit.id);
                if (visit.weightKg || visit.heightCm || visit.headCm) app.remove("growth", `visit-${visit.id}`);
                onClose();
              }
            : undefined
        }
      />
    </Sheet>
  );
}
