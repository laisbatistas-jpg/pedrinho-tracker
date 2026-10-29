"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ScreenHeader } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { Settings } from "@/lib/types";
import {
  DEV_ALERT,
  DEV_AREAS,
  DEV_MONTHS,
  DEV_SOURCES,
  completedMonths,
  devMonthFor,
  type DevArea,
} from "@/lib/development";
import { ageLabel } from "@/lib/utils";

type Check = "sim" | "comecando";
const AREA_ORDER: DevArea[] = ["mov", "soc", "ling", "cog"];

export function DevelopmentScreen({ app, go }: ScreenProps) {
  const { settings, now } = app;
  const name = settings.name || "Pedrinho";
  const current = settings.birthDate && now ? completedMonths(settings.birthDate, now) : null;
  const [month, setMonth] = useState<number>(Math.min(24, current ?? 0));
  const [open, setOpen] = useState<number | null>(null);
  const [showSources, setShowSources] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const checks = settings.devChecks ?? {};

  // ao abrir (ou quando a data de hoje chega), vai para o mês de hoje
  const startMonth = useRef(false);
  useEffect(() => {
    if (current !== null && !startMonth.current) {
      startMonth.current = true;
      setMonth(Math.min(24, current));
    }
  }, [current]);

  // mantém o mês escolhido visível na faixa de meses
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-m="${month}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [month]);

  const d = devMonthFor(month);
  const isNow = current !== null && Math.min(24, current) === month;
  const beyond = current !== null && current > 24;

  const setCheck = (id: string, v: Check | undefined) => {
    const next = { ...checks };
    if (v) next[id] = v;
    else delete next[id];
    app.upsert<Settings>("settings", "main", { ...settings, devChecks: next });
  };
  const cycle = (id: string) => {
    const cur = checks[id];
    setCheck(id, cur === undefined ? "sim" : cur === "sim" ? "comecando" : undefined);
  };

  const done = d.marcos.filter((m) => checks[m.id] === "sim").length;
  const starting = d.marcos.filter((m) => checks[m.id] === "comecando").length;

  // sugestão do dia: gira entre os estímulos do mês conforme o dia do ano
  const dayIdx = now ? Math.floor((now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / 86400000) : 0;
  const today = d.estimulos[dayIdx % d.estimulos.length];

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader
        title="Desenvolvimento"
        subtitle={settings.birthDate ? `${name} • ${ageLabel(settings.birthDate, now || Date.now())}` : "Estímulos mês a mês"}
        onBack={() => go("mais")}
      />

      <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x" role="tablist" aria-label="Meses">
        {DEV_MONTHS.map((m) => {
          const active = m.month === month;
          const cur = current !== null && Math.min(24, current) === m.month;
          return (
            <button
              key={m.month}
              data-m={m.month}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMonth(m.month);
                setOpen(null);
              }}
              className={`shrink-0 snap-center rounded-2xl px-3.5 py-2 text-sm font-semibold border relative ${
                active ? "bg-[rgba(124,58,237,0.4)] border-[var(--violet)] text-white" : "border-white/10 bg-white/[0.04] text-[var(--muted)]"
              }`}
            >
              {m.month}m
              {cur && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#5db77a] border border-[#0c1226]" />}
            </button>
          );
        })}
      </div>

      {!settings.birthDate && (
        <button onClick={() => go("config")} className="w-full text-left glass p-4 text-sm">
          <span className="font-semibold text-[var(--violet)]">Informe a data de nascimento →</span>
          <span className="block text-[var(--muted)] mt-0.5">Assim o app abre direto na janela do mês de {name}.</span>
        </button>
      )}
      {beyond && (
        <p className="text-sm text-[var(--muted)] px-1">
          {name} já passou dos 24 meses. Aqui você pode rever as janelas anteriores.
        </p>
      )}

      <section className="glass p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="chip chip-on !py-0.5 !px-2.5 text-xs">{d.month === 0 ? "Recém-nascido" : `${d.month} ${d.month === 1 ? "mês" : "meses"}`}</span>
          {isNow && <span className="text-xs font-semibold text-[#8fe0a8]">mês atual</span>}
        </div>
        <h3 className="grad-text text-2xl font-extrabold leading-tight">{d.tema}</h3>
        <p className="text-sm mt-2 leading-relaxed">{d.janela}</p>
      </section>

      <section className="glass p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-semibold text-lg">O que observar</h3>
          <span className="text-xs text-[var(--muted)]">
            {done} de {d.marcos.length} já faz{starting > 0 ? ` • ${starting} começando` : ""}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">
          {d.checkpoint
            ? "Marcos de referência do CDC: o que a maioria dos bebês já faz até essa idade."
            : "Aproximação entre as idades de referência. Cada bebê tem o seu ritmo."}{" "}
          Toque para marcar: uma vez = já faz, duas = está começando.
        </p>
        <div className="space-y-4">
          {AREA_ORDER.map((a) => {
            const items = d.marcos.filter((m) => m.area === a);
            if (items.length === 0) return null;
            return (
              <div key={a}>
                <p className="label">{DEV_AREAS[a]}</p>
                <ul className="space-y-2 mt-1">
                  {items.map((m) => {
                    const c = checks[m.id];
                    return (
                      <li key={m.id}>
                        <button
                          onClick={() => cycle(m.id)}
                          aria-label={`${m.texto}: ${c === "sim" ? "já faz" : c === "comecando" ? "está começando" : "ainda não marcado"}`}
                          className={`w-full flex items-start gap-3 text-left rounded-2xl px-3 py-2.5 border ${
                            c === "sim"
                              ? "border-[#5db77a]/60 bg-[#5db77a]/12"
                              : c === "comecando"
                                ? "border-amber-300/50 bg-amber-300/10"
                                : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 shrink-0 w-6 h-6 rounded-full grid place-items-center border ${
                              c === "sim" ? "bg-[#5db77a] border-[#5db77a] text-[#0c1226]" : c === "comecando" ? "border-amber-300 text-amber-200" : "border-white/25 text-transparent"
                            }`}
                          >
                            {c === "sim" ? <Icon name="check" className="w-4 h-4" /> : c === "comecando" ? <span className="text-[11px] font-bold">…</span> : <Icon name="check" className="w-4 h-4" />}
                          </span>
                          <span className="text-[15px] leading-snug">{m.texto}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass p-5">
        <h3 className="font-semibold text-lg mb-3">Estímulos do mês</h3>
        <div className="rounded-2xl border border-[var(--violet)]/50 bg-[rgba(124,58,237,0.16)] p-3.5 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#d9ccff]">Sugestão de hoje</p>
          <p className="font-semibold mt-0.5">{today.titulo}</p>
          <p className="text-sm mt-1 leading-relaxed">{today.como}</p>
          <p className="text-xs text-[var(--muted)] mt-1.5">Treina: {today.treina}</p>
        </div>
        <ul className="divide-y divide-white/10">
          {d.estimulos.map((e, i) => (
            <li key={e.titulo}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center gap-3 py-3 text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold leading-tight">{e.titulo}</span>
                  <span className="block text-xs text-[var(--muted)] mt-0.5">Treina: {e.treina}</span>
                </span>
                <Icon name="chevron" className={`w-4 h-4 text-[var(--muted)] transition-transform ${open === i ? "rotate-90" : ""}`} />
              </button>
              {open === i && <p className="text-sm leading-relaxed pb-3 -mt-1">{e.como}</p>}
            </li>
          ))}
        </ul>
      </section>

      {d.cuidados.length > 0 && (
        <section className="glass p-5">
          <h3 className="font-semibold text-lg mb-2">Cuidados deste mês</h3>
          <ul className="space-y-2">
            {d.cuidados.map((c) => (
              <li key={c} className="text-sm leading-relaxed flex gap-2">
                <span className="text-[var(--violet)]">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass p-5">
        <h3 className="font-semibold text-lg mb-2">Quando falar com o pediatra</h3>
        <p className="text-sm leading-relaxed">{DEV_ALERT}</p>
        {d.triagem && <p className="text-sm leading-relaxed mt-2 font-semibold">{d.triagem}</p>}
        <p className="text-xs text-[var(--muted)] mt-3">
          Este guia reúne orientações públicas de saúde e não é diagnóstico. Prematuros costumam seguir a idade corrigida: pergunte ao pediatra.
        </p>
      </section>

      <section className="glass p-5">
        <button onClick={() => setShowSources((v) => !v)} className="w-full flex items-center justify-between text-left" aria-expanded={showSources}>
          <span className="font-semibold">De onde vêm essas informações</span>
          <Icon name="chevron" className={`w-4 h-4 text-[var(--muted)] transition-transform ${showSources ? "rotate-90" : ""}`} />
        </button>
        {showSources && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Textos escritos para este app, juntando as fontes abaixo, em palavras próprias. Os marcos de 2, 4, 6, 9, 12, 15, 18 e 24 meses vêm do CDC; nos meses entre eles é uma aproximação.
            </p>
            <ul className="space-y-1.5">
              {DEV_SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--violet)] underline underline-offset-2">
                    {s.nome}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
