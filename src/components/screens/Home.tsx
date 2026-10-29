"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NapCard } from "@/components/NapCard";
import { AlertList, EventForm, MiniBars, Stat, Timeline, WhoPicker } from "@/components/ui";
import { BottleSheet, SideButton } from "./Feed";
import type { ScreenProps } from "@/lib/nav";
import type { BabyEvent } from "@/lib/types";
import { completedMonths, devMonthFor } from "@/lib/development";
import { countdownLabel, listAppointments, placeLine } from "@/lib/agenda";
import { DAY, formatClock, formatDate, formatDur, formatTime, sideLabel } from "@/lib/utils";

export function HomeScreen({ app, go }: ScreenProps) {
  const {
    timer, elapsed, now, suggestedSide, lastBreast, nextFeedAt, nextFeedMin, avgFeedInterval, feedIntervalMin, feedIntervalConfigured,
    feedsToday, bottleMlToday, sleepToday, totalSleepSec, longestSleepSec, diapersToday, week, todayEvents,
  } = app;

  const agenda = listAppointments(app.visits, app.vaccines)
    .filter((a) => a.timestamp >= (now || 0) && a.timestamp <= (now || 0) + 30 * DAY)
    .slice(0, 3);
  const devMonths = app.settings.birthDate && now ? completedMonths(app.settings.birthDate, now) : null;
  const dev = devMonths !== null ? devMonthFor(devMonths) : null;
  const devDone = dev ? dev.marcos.filter((m) => app.settings.devChecks?.[m.id] === "sim").length : 0;
  const [bottleOpen, setBottleOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BabyEvent | null>(null);

  return (
    <div className="fade-in space-y-4">
      <AlertList alerts={app.alerts} />

      {!app.prefs.whoAsked && !app.prefs.who && (
        <section className="glass p-5">
          <h2 className="font-semibold text-lg leading-tight">Quem está usando este celular?</h2>
          <p className="text-sm text-[var(--muted)] mb-3">Seu nome aparece nos registros que você fizer.</p>
          <WhoPicker
            value=""
            onPick={(n) => app.setPrefs({ who: n, whoAsked: true })}
            extra={
              <button type="button" onClick={() => app.setPrefs({ whoAsked: true })} className="chip">
                Agora não
              </button>
            }
          />
        </section>
      )}

      {agenda.length > 0 && (
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Próximos compromissos</h2>
            <button onClick={() => go("consultas")} className="text-xs font-semibold text-[var(--violet)]">Ver agenda →</button>
          </div>
          <ul className="space-y-3">
            {agenda.map((a) => (
              <li key={a.key}>
                <button
                  onClick={() => go(a.source === "vaccine" ? "vacinas" : "consultas")}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span className="icon-badge w-10 h-10">
                    <Icon name={a.source === "vaccine" ? "syringe" : "stethoscope"} className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold leading-tight truncate">{a.title}</span>
                    <span className="block text-xs text-[var(--muted)] truncate">
                      {formatDate(a.timestamp).slice(0, 5)} às {formatClock(a.timestamp)}
                      {placeLine(a) ? ` • ${placeLine(a)}` : ""}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--violet)] whitespace-nowrap">{countdownLabel(a.timestamp, now || a.timestamp - 1)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {timer && (
        <button
          onClick={() => go(timer.type === "sono" ? "sono" : "amamentacao")}
          className="glass w-full p-5 text-left block"
        >
          <div className="flex items-center gap-3">
            <span className="icon-badge w-12 h-12">
              <Icon name={timer.type === "sono" ? "moon" : "feed"} className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg leading-tight">
                {timer.type === "sono" ? "Soneca em andamento" : `Mamada • Seio ${sideLabel(timer.side)}`}
              </p>
              <p className="text-sm text-[var(--muted)]">Toque para abrir</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[var(--violet)] border border-[var(--stroke-strong)] rounded-full px-3 py-1.5 bg-white/5">
              <span className="pulse-dot" /> AO VIVO
            </span>
          </div>
          <p className="grad-text text-6xl font-extrabold text-center my-4 tabular-nums tracking-tight">
            {formatTime(elapsed)}
          </p>
        </button>
      )}

      {!timer && (
        <section className="glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="icon-badge w-11 h-11">
              <Icon name="feed" className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Iniciar mamada</h2>
              <p className="text-sm text-[var(--muted)]">
                {lastBreast?.side ? `Último lado: ${sideLabel(lastBreast.side)}` : "Escolha o lado para começar"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SideButton
              side="esquerdo"
              suggested={suggestedSide === "esquerdo"}
              onClick={() => { app.startFeed("esquerdo"); go("amamentacao"); }}
            />
            <SideButton
              side="direito"
              suggested={suggestedSide === "direito"}
              onClick={() => { app.startFeed("direito"); go("amamentacao"); }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => setBottleOpen(true)}
              className="btn-ghost h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              <Icon name="bottle" className="w-5 h-5" /> Mamadeira
            </button>
            <button
              onClick={() => { app.startSleep(); go("sono"); }}
              className="btn-ghost h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              <Icon name="moon" className="w-5 h-5" /> Soneca
            </button>
          </div>
        </section>
      )}

      <section className="glass p-5 flex items-center gap-4">
        <span className="icon-badge w-12 h-12 bg-blue-900/50">
          <Icon name="clock" className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--violet)]">Próxima mamada</p>
          {nextFeedAt && nextFeedMin !== null ? (
            <>
              <p className="grad-text text-4xl font-extrabold leading-tight tabular-nums">{formatClock(nextFeedAt)}</p>
              <p className="text-xs text-[var(--muted)]">
                {nextFeedMin === 0 ? "Já está na hora" : `em ~${nextFeedMin} min`} • intervalo {feedIntervalConfigured ? "combinado" : "médio"} {feedIntervalMin} min
              </p>
            </>
          ) : (
            <p className="text-[var(--muted)] mt-1">Registre algumas mamadas</p>
          )}
        </div>
      </section>

      <NapCard nap={app.nap} hasBirthDate={Boolean(app.settings.birthDate)} onSettings={() => go("config")} />

      {dev && (
        <button onClick={() => go("desenvolvimento")} className="glass w-full p-4 flex items-center gap-3 text-left">
          <span className="icon-badge w-10 h-10">
            <Icon name="smile" className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs text-[var(--muted)]">
              Janela de desenvolvimento • {dev.month === 0 ? "recém-nascido" : `${dev.month} ${dev.month === 1 ? "mês" : "meses"}`}
            </span>
            <span className="block font-semibold leading-tight truncate">{dev.tema}</span>
            <span className="block text-xs text-[var(--muted)] mt-0.5">
              {devDone} de {dev.marcos.length} marcos já feitos • ver estímulos
            </span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-[var(--muted)]" />
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat icon="feed" value={feedsToday.length} label="mamadas hoje">
          {bottleMlToday > 0 && <p className="text-xs text-[var(--muted)] mb-2">{bottleMlToday} ml em mamadeira</p>}
          <MiniBars values={week.length ? week.map((d) => d.feeds) : [0]} />
        </Stat>
        <Stat icon="clock" value={avgFeedInterval} unit="min" label="intervalo médio">
          <div className="flex justify-between text-[11px] text-[var(--muted)]">
            {week.map((d, i) => (
              <span key={i} className="flex flex-col items-center gap-1.5">
                {d.letter}
                <span className={`w-2 h-2 rounded-full ${d.feeds > 0 ? "bg-[var(--violet)]" : "bg-white/15"}`} />
              </span>
            ))}
          </div>
        </Stat>
        <Stat icon="moon" value={formatDur(totalSleepSec)} label="de sono hoje">
          <p className="text-xs text-[var(--muted)]">
            {sleepToday.length} {sleepToday.length === 1 ? "soneca" : "sonecas"}
            {longestSleepSec > 0 && ` • maior ${formatDur(longestSleepSec)}`}
          </p>
        </Stat>
        <Stat icon="diaper" value={diapersToday.length} label="fraldas hoje">
          <MiniBars values={week.length ? week.map((d) => d.diapers) : [0]} />
        </Stat>
      </div>

      <section className="glass p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Linha do tempo de hoje</h2>
          <div className="flex items-center gap-3">
            {now > 0 && <span className="text-sm text-[var(--muted)] tabular-nums">{formatClock(now)}</span>}
            <button onClick={() => setAdding(true)} className="icon-badge w-9 h-9" aria-label="Adicionar registro manual">
              <Icon name="plus" className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Timeline events={todayEvents.slice(0, 6)} empty="Nenhum registro ainda" onSelect={setEditing} />
        {todayEvents.length > 6 && (
          <button onClick={() => go("historico")} className="w-full mt-2 py-2.5 text-sm font-semibold text-[var(--violet)]">
            Ver tudo de hoje ({todayEvents.length})
          </button>
        )}
      </section>

      <button onClick={() => go("emergencia")} className="glass w-full p-4 flex items-center gap-3 text-left">
        <span className="icon-badge w-10 h-10 !text-red-200">
          <Icon name="alert" className="w-5 h-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold leading-tight">Ficha de emergência</span>
          <span className="block text-xs text-[var(--muted)]">Telefones, alergias e resumo para o médico</span>
        </span>
        <Icon name="chevron" className="w-5 h-5 text-[var(--muted)]" />
      </button>

      {bottleOpen && <BottleSheet onClose={() => setBottleOpen(false)} onSave={(ml, milk) => app.addBottle(ml, milk)} />}
      {adding && <EventForm onSave={app.saveEvent} onClose={() => setAdding(false)} />}
      {editing && (
        <EventForm initial={editing} onSave={app.saveEvent} onDelete={app.deleteEvent} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
