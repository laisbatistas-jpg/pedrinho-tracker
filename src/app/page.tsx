"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { HomeScreen } from "@/components/screens/Home";
import { FeedScreen } from "@/components/screens/Feed";
import { SleepScreen } from "@/components/screens/Sleep";
import { DiapersScreen } from "@/components/screens/Diapers";
import { MoreScreen } from "@/components/screens/More";
import { StatsScreen } from "@/components/screens/Stats";
import { HistoryScreen } from "@/components/screens/History";
import { GrowthScreen } from "@/components/screens/Growth";
import { HealthScreen } from "@/components/screens/Health";
import { EmergencyScreen } from "@/components/screens/Emergency";
import { VisitsScreen } from "@/components/screens/Visits";
import { VaccinesScreen } from "@/components/screens/Vaccines";
import { MilestonesScreen } from "@/components/screens/Milestones";
import { SoundsScreen } from "@/components/screens/Sounds";
import { ReportScreen } from "@/components/screens/Report";
import { SettingsScreen } from "@/components/screens/Settings";
import { useApp } from "@/lib/app";
import type { Screen } from "@/lib/nav";
import { ageLabel, formatDayLong, formatDayShort } from "@/lib/utils";

const TABS: { id: Screen; label: string; icon: IconName }[] = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "amamentacao", label: "Mamada", icon: "feed" },
  { id: "sono", label: "Sono", icon: "moon" },
  { id: "fraldas", label: "Fraldas", icon: "diaper" },
  { id: "mais", label: "Mais", icon: "grid" },
];

// telas que pertencem à aba "Mais"
const MORE_SCREENS: Screen[] = [
  "mais", "stats", "historico", "crescimento", "saude", "vacinas", "consultas", "emergencia", "marcos", "sons", "relatorio", "config",
];

export default function Home() {
  const app = useApp();
  const [screen, setScreen] = useState<Screen>("inicio");
  const [restored, setRestored] = useState(false);

  const go = (s: Screen) => {
    setScreen(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  // ao abrir o app com um cronômetro rodando, vai direto para ele
  useEffect(() => {
    if (!app.ready || restored) return;
    setRestored(true);
    if (app.timer) setScreen(app.timer.type === "sono" ? "sono" : "amamentacao");
  }, [app.ready, app.timer, restored]);

  // modo noturno
  useEffect(() => {
    document.documentElement.classList.toggle("night", app.prefs.nightMode);
  }, [app.prefs.nightMode]);

  if (!app.ready) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <span className="pulse-dot" aria-label="Carregando" />
      </div>
    );
  }

  const { settings, timer, now } = app;
  const name = settings.name || "Pedrinho";
  const age = settings.birthDate && now ? ageLabel(settings.birthDate, now) : "";
  const subtitle =
    timer?.type === "sono"
      ? `Shhh… ${name} está dormindo`
      : timer?.type === "amamentacao"
        ? "Mamando agora"
        : [age, now ? (age ? formatDayShort(now) : formatDayLong(now)) : ""].filter(Boolean).join(" • ");

  const activeTab: Screen = MORE_SCREENS.includes(screen) ? "mais" : screen;
  const props = { app, go };

  return (
    <div className="max-w-md mx-auto min-h-dvh flex flex-col">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3.5 no-print">
        <button
          onClick={() => go("inicio")}
          aria-label="Ir para o início"
          className="w-14 h-14 rounded-full overflow-hidden grid place-items-center text-3xl bg-gradient-to-br from-violet-500/30 to-indigo-900/60 border-2 border-[var(--violet-deep)] shadow-[0_0_24px_-4px_rgba(124,58,237,0.7)]"
        >
          {settings.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.photo} alt={`Foto de ${name}`} className="w-full h-full rounded-full object-cover" />
          ) : (
            "👶"
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.65rem] font-bold leading-tight flex items-center gap-2">
            <span className="grad-text">{name}</span>
            <Icon name="heart" className="w-5 h-5 text-[var(--violet)]" />
          </h1>
          <p className="text-sm text-[var(--muted)] cap-first truncate">{subtitle}</p>
        </div>
        {app.prefs.who && (
          <button
            onClick={() => go("config")}
            aria-label={`Perfil: ${app.prefs.who}`}
            className="icon-badge w-10 h-10 font-bold"
          >
            {app.prefs.who.trim()[0]?.toUpperCase()}
          </button>
        )}
        {app.syncConfigured && (
          <button
            onClick={() => go("config")}
            aria-label={`Sincronização: ${app.syncStatus}`}
            className={`icon-badge w-10 h-10 ${app.syncStatus === "error" ? "!text-amber-300" : ""}`}
          >
            <Icon name="cloud" className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-32">
        {screen === "inicio" && <HomeScreen {...props} />}
        {screen === "amamentacao" && <FeedScreen {...props} />}
        {screen === "sono" && <SleepScreen {...props} />}
        {screen === "fraldas" && <DiapersScreen {...props} />}
        {screen === "mais" && <MoreScreen {...props} />}
        {screen === "stats" && <StatsScreen {...props} />}
        {screen === "historico" && <HistoryScreen {...props} />}
        {screen === "crescimento" && <GrowthScreen {...props} />}
        {screen === "saude" && <HealthScreen {...props} />}
        {screen === "vacinas" && <VaccinesScreen {...props} />}
        {screen === "emergencia" && <EmergencyScreen {...props} />}
        {screen === "consultas" && <VisitsScreen {...props} />}
        {screen === "marcos" && <MilestonesScreen {...props} />}
        {screen === "sons" && <SoundsScreen {...props} />}
        {screen === "relatorio" && <ReportScreen {...props} />}
        {screen === "config" && <SettingsScreen {...props} />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-3 nav-safe z-20 no-print">
        <div className="glass !rounded-[1.75rem] !bg-[rgba(14,19,40,0.82)] flex justify-between p-1.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const live =
              (tab.id === "sono" && timer?.type === "sono") ||
              (tab.id === "amamentacao" && timer?.type === "amamentacao");
            return (
              <button
                key={tab.id}
                onClick={() => go(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[1.25rem] text-[11px] font-medium ${
                  active ? "bg-[rgba(124,58,237,0.28)] text-[#d9ccff]" : "text-[var(--muted)]"
                }`}
              >
                <Icon name={tab.icon} className="w-[22px] h-[22px]" />
                {tab.label}
                {live && <span className="pulse-dot absolute top-1.5 right-[22%]" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
