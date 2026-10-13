"use client";

import { useState, useEffect } from "react";

type Event = {
  id: string;
  type: "amamentacao" | "soneca" | "outro";
  side?: "esquerdo" | "direito";
  duration?: number;
  timestamp: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [timer, setTimer] = useState<{ side: "esquerdo" | "direito"; start: number } | null>(null);
  const [now, setNow] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const saved = localStorage.getItem("pedrinho-events");
    if (saved) setEvents(JSON.parse(saved));

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pedrinho-events", JSON.stringify(events));
    }
  }, [events, mounted]);

  const startFeed = (side: "esquerdo" | "direito") => {
    setTimer({ side, start: Date.now() });
  };

  const stopFeed = () => {
    if (!timer) return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "amamentacao",
      side: timer.side,
      duration,
      timestamp: timer.start,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
  };

  const lastFeeds = events.filter((e) => e.type === "amamentacao").slice(0, 5);
  const todayFeeds = events.filter(
    (e) =>
      e.type === "amamentacao" &&
      new Date(e.timestamp).toDateString() === new Date().toDateString()
  );

  const avgInterval = (() => {
    if (todayFeeds.length < 2) return null;
    const sorted = [...todayFeeds].sort((a, b) => a.timestamp - b.timestamp);
    let sum = 0;
    for (let i = 1; i < sorted.length; i++) {
      sum += sorted[i].timestamp - sorted[i - 1].timestamp;
    }
    return Math.round(sum / (sorted.length - 1) / 60000);
  })();

  const elapsed = timer ? Math.floor((now - timer.start) / 1000) : 0;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-950 text-white pb-20">
      <header className="p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-900 flex items-center justify-center text-2xl">
          👶
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pedrinho</h1>
          <p className="text-purple-300 text-sm">Bem-vindo(a) de volta!</p>
        </div>
      </header>

      <section className="mx-4 p-6 rounded-3xl bg-gradient-to-b from-purple-950 to-zinc-900 border border-purple-800/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Amamentação</h2>
          {timer && (
            <span className="text-sm bg-purple-600 px-3 py-1 rounded-full">
              Em andamento
            </span>
          )}
        </div>

        {timer ? (
          <div className="text-center">
            <div className="text-6xl font-bold tracking-tight my-6">
              {formatTime(elapsed)}
            </div>
            <p className="text-purple-300 mb-6">
              Seio {timer.side === "esquerdo" ? "Esquerdo" : "Direito"}
            </p>
            <button
              onClick={stopFeed}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 font-semibold text-lg"
            >
              Parar e salvar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => startFeed("esquerdo")}
              className="aspect-square rounded-2xl bg-pink-900/40 border border-pink-700/50 flex flex-col items-center justify-center hover:bg-pink-900/60 transition"
            >
              <span className="text-4xl mb-2">🤱</span>
              <span className="font-medium">Esquerdo</span>
            </button>
            <button
              onClick={() => startFeed("direito")}
              className="aspect-square rounded-2xl bg-green-900/40 border border-green-700/50 flex flex-col items-center justify-center hover:bg-green-900/60 transition"
            >
              <span className="text-4xl mb-2">🤱</span>
              <span className="font-medium">Direito</span>
            </button>
          </div>
        )}

        {todayFeeds.length > 0 && !timer && (
          <div className="mt-6 text-center text-sm text-purple-300">
            Última: {lastFeeds[0] ? formatTime(lastFeeds[0].duration || 0) : "-"} · Hoje: {todayFeeds.length} mamadas
          </div>
        )}
      </section>

      <section className="mx-4 mt-6 space-y-3">
        <div className="p-4 rounded-2xl bg-zinc-900 flex justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Intervalo médio hoje</p>
            <p className="text-xl font-semibold">
              {avgInterval ? `${avgInterval} min` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-sm">Mamadas hoje</p>
            <p className="text-xl font-semibold">{todayFeeds.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900">
          <h3 className="font-medium mb-3">Últimas mamadas</h3>
          {lastFeeds.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhuma ainda</p>
          ) : (
            lastFeeds.map((e) => (
              <div
                key={e.id}
                className="flex justify-between py-2 border-b border-zinc-800 last:border-0 text-sm"
              >
                <span>
                  {new Date(e.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {e.side === "esquerdo" ? "Esq" : "Dir"}
                </span>
                <span>{formatTime(e.duration || 0)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900 border-t border-zinc-800 flex justify-around py-3">
        <span className="text-purple-400 text-sm">Início</span>
        <span className="text-zinc-500 text-sm">Histórico</span>
        <span className="text-zinc-500 text-sm">Sono</span>
        <span className="text-zinc-500 text-sm">Mais</span>
      </nav>
    </div>
  );
}