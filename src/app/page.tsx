"use client";

import { useState, useEffect } from "react";

type EventType = "amamentacao" | "sono" | "fralda";

type Event = {
  id: string;
  type: EventType;
  side?: "esquerdo" | "direito";
  duration?: number; // segundos
  diaper?: "molhada" | "suja" | "mista";
  timestamp: number;
  endTimestamp?: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"inicio" | "amamentacao" | "sono" | "fraldas" | "stats">("inicio");
  const [timer, setTimer] = useState<{ type: "amamentacao" | "sono"; side?: "esquerdo" | "direito"; start: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem("pedrinho-events-v2");
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("pedrinho-events-v2", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startFeed = (side: "esquerdo" | "direito") => {
    setTimer({ type: "amamentacao", side, start: Date.now() });
    setActiveTab("amamentacao");
  };

  const stopFeed = () => {
    if (!timer || timer.type !== "amamentacao") return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "amamentacao",
      side: timer.side,
      duration,
      timestamp: timer.start,
      endTimestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
    setActiveTab("inicio");
  };

  const switchSide = () => {
    if (!timer || timer.type !== "amamentacao") return;
    setTimer({ ...timer, side: timer.side === "esquerdo" ? "direito" : "esquerdo" });
  };

  const startSleep = () => {
    setTimer({ type: "sono", start: Date.now() });
    setActiveTab("sono");
  };

  const stopSleep = () => {
    if (!timer || timer.type !== "sono") return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "sono",
      duration,
      timestamp: timer.start,
      endTimestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
    setActiveTab("inicio");
  };

  const addDiaper = (kind: "molhada" | "suja" | "mista") => {
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "fralda",
      diaper: kind,
      timestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const todayEvents = events.filter(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
  );

  const feedsToday = todayEvents.filter((e) => e.type === "amamentacao");
  const sleepToday = todayEvents.filter((e) => e.type === "sono");
  const diapersToday = todayEvents.filter((e) => e.type === "fralda");

  const lastFeed = feedsToday[0];
  const totalSleepSec = sleepToday.reduce((acc, e) => acc + (e.duration || 0), 0);

  const elapsed = timer ? Math.floor((now - timer.start) / 1000) : 0;

  // Previsões simples
  const avgFeedInterval = feedsToday.length >= 2
    ? Math.round(
        feedsToday.slice(0, -1).reduce((acc, e, i) => acc + (feedsToday[i].timestamp - feedsToday[i + 1].timestamp), 0) /
          (feedsToday.length - 1) /
          60000
      )
    : 120;

  const nextFeedMin = lastFeed ? Math.max(0, avgFeedInterval - Math.floor((now - lastFeed.timestamp) / 60000)) : null;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="p-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-purple-900 flex items-center justify-center text-3xl">👶</div>
        <div>
          <h1 className="text-2xl font-bold">Pedrinho ❤️</h1>
          <p className="text-purple-300 text-sm">Meu pequeno, meu maior amor</p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 overflow-y-auto">
        {activeTab === "inicio" && (
          <>
            {/* Amamentação destaque */}
            <section className="bg-zinc-900/80 rounded-3xl p-5 border border-purple-900/50 mb-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🤱</span> Amamentação
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => startFeed("esquerdo")}
                  className="h-28 rounded-2xl bg-pink-600 hover:bg-pink-500 font-semibold text-lg flex flex-col items-center justify-center"
                >
                  Esquerdo
                </button>
                <button
                  onClick={() => startFeed("direito")}
                  className="h-28 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-lg flex flex-col items-center justify-center"
                >
                  Direito
                </button>
              </div>
            </section>

            {/* Cards de resumo */}
            <div className="space-y-3">
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-purple-300 text-sm">Última mamada</p>
                <p className="text-lg font-medium">
                  {lastFeed
                    ? `${formatTime(lastFeed.duration || 0)} • ${lastFeed.side === "esquerdo" ? "Esquerdo" : "Direito"}`
                    : "Nenhuma ainda"}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-purple-300 text-sm">Próxima mamada</p>
                <p className="text-lg font-medium">
                  {nextFeedMin !== null ? `em ~${nextFeedMin} min` : "Registre algumas mamadas"}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-purple-300 text-sm">Sono hoje</p>
                <p className="text-lg font-medium">{Math.floor(totalSleepSec / 60)} min</p>
              </div>
            </div>
          </>
        )}

        {activeTab === "amamentacao" && (
          <div className="text-center pt-8">
            {timer?.type === "amamentacao" ? (
              <>
                <div className="text-7xl font-bold my-8">{formatTime(elapsed)}</div>
                <p className="text-2xl text-purple-300 mb-2">
                  Seio {timer.side === "esquerdo" ? "Esquerdo" : "Direito"}
                </p>
                <p className="text-purple-400 mb-10">em andamento</p>
                <div className="space-y-3 px-4">
                  <button
                    onClick={switchSide}
                    className="w-full py-4 rounded-2xl bg-zinc-800 border border-purple-700 font-medium"
                  >
                    Trocar para {timer.side === "esquerdo" ? "Direito" : "Esquerdo"}
                  </button>
                  <button
                    onClick={stopFeed}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-lg"
                  >
                    Parar e Salvar
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-20 text-center">
                <p className="text-xl mb-6">Escolha o lado para começar</p>
                <div className="grid grid-cols-2 gap-4 px-6">
                  <button onClick={() => startFeed("esquerdo")} className="h-32 rounded-2xl bg-pink-600 text-lg font-semibold">
                    Esquerdo
                  </button>
                  <button onClick={() => startFeed("direito")} className="h-32 rounded-2xl bg-emerald-600 text-lg font-semibold">
                    Direito
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sono" && (
          <div className="text-center pt-8">
            {timer?.type === "sono" ? (
              <>
                <div className="text-7xl font-bold my-8 text-purple-300">{formatTime(elapsed)}</div>
                <p className="text-xl mb-10">Soneca em andamento</p>
                <button
                  onClick={stopSleep}
                  className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-purple-600 font-semibold text-lg"
                >
                  Acordou
                </button>
              </>
            ) : (
              <div className="pt-20">
                <p className="text-xl mb-8">Iniciar soneca</p>
                <button
                  onClick={startSleep}
                  className="px-12 py-5 rounded-2xl bg-purple-600 text-lg font-semibold"
                >
                  Começar soneca
                </button>
                <div className="mt-10 text-purple-300">
                  Total de sono hoje: {Math.floor(totalSleepSec / 60)} min
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "fraldas" && (
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-6 text-center">Registrar fralda</h2>
            <div className="grid grid-cols-1 gap-4 px-6">
              <button onClick={() => addDiaper("molhada")} className="py-6 rounded-2xl bg-blue-700 font-semibold text-lg">
                Molhada
              </button>
              <button onClick={() => addDiaper("suja")} className="py-6 rounded-2xl bg-amber-700 font-semibold text-lg">
                Suja
              </button>
              <button onClick={() => addDiaper("mista")} className="py-6 rounded-2xl bg-orange-700 font-semibold text-lg">
                Mista
              </button>
            </div>
            <p className="text-center text-purple-300 mt-8">Hoje: {diapersToday.length} fraldas</p>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="pt-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-900 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold">{feedsToday.length}</p>
                <p className="text-sm text-purple-300">Mamadas</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold">{Math.floor(totalSleepSec / 60)}</p>
                <p className="text-sm text-purple-300">min sono</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold">{diapersToday.length}</p>
                <p className="text-sm text-purple-300">Fraldas</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold">{avgFeedInterval}</p>
                <p className="text-sm text-purple-300">min intervalo</p>
              </div>
            </div>

            <h3 className="font-semibold mb-3">Linha do tempo de hoje</h3>
            <div className="space-y-2">
              {todayEvents.length === 0 && <p className="text-zinc-500">Nenhum registro ainda</p>}
              {todayEvents.map((e) => (
                <div key={e.id} className="bg-zinc-900 rounded-xl p-3 flex justify-between text-sm">
                  <div>
                    <span className="text-purple-300">
                      {new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>{" "}
                    {e.type === "amamentacao" && `Mamada ${e.side === "esquerdo" ? "Esq" : "Dir"}`}
                    {e.type === "sono" && "Soneca"}
                    {e.type === "fralda" && `Fralda ${e.diaper}`}
                  </div>
                  <div>
                    {e.duration ? formatTime(e.duration) : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900 border-t border-zinc-800 flex justify-around py-3 text-xs">
        {[
          { id: "inicio", label: "Início", icon: "🏠" },
          { id: "amamentacao", label: "Amamentação", icon: "🤱" },
          { id: "sono", label: "Sono", icon: "🌙" },
          { id: "fraldas", label: "Fraldas", icon: "👶" },
          { id: "stats", label: "Estatísticas", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center ${activeTab === tab.id ? "text-purple-400" : "text-zinc-500"}`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
