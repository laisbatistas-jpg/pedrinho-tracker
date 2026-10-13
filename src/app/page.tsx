"use client";

import { useState, useEffect } from "react";

type Event = {
  id: string;
  type: "amamentacao" | "soneca";
  side?: "esquerdo" | "direito";
  duration?: number;
  timestamp: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [timer, setTimer] = useState<{ type: "amamentacao" | "soneca"; side?: "esquerdo" | "direito"; start: number } | null>(null);
  const [now, setNow] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"inicio" | "historico" | "sono">("inicio");

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const saved = localStorage.getItem("pedrinho-events");
    if (saved) setEvents(JSON.parse(saved));
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("pedrinho-events", JSON.stringify(events));
  }, [events, mounted]);

  const startTimer = (type: "amamentacao" | "soneca", side?: "esquerdo" | "direito") => {
    setTimer({ type, side, start: Date.now() });
  };

  const stopTimer = () => {
    if (!timer) return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: timer.type,
      side: timer.side,
      duration,
      timestamp: timer.start,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const elapsed = timer ? Math.floor((now - timer.start) / 1000) : 0;

  const today = new Date().toDateString();
  const todayFeeds = events.filter(e => e.type === "amamentacao" && new Date(e.timestamp).toDateString() === today);
  const todaySleep = events.filter(e => e.type === "soneca" && new Date(e.timestamp).toDateString() === today);

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="p-5 flex items-center gap-3 border-b border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-purple-800 flex items-center justify-center text-2xl">👶</div>
        <div>
          <h1 className="text-xl font-bold">Pedrinho</h1>
          <p className="text-zinc-400 text-sm">Acompanhamento do dia</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto pb-20">
        {tab === "inicio" && (
          <div className="p-4 space-y-4">
            {/* Amamentação */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-purple-800/40">
              <h2 className="text-lg font-semibold mb-4">Amamentação</h2>
              {timer?.type === "amamentacao" ? (
                <div className="text-center">
                  <div className="text-5xl font-bold my-4">{formatTime(elapsed)}</div>
                  <p className="text-purple-300 mb-4">Seio {timer.side === "esquerdo" ? "Esquerdo" : "Direito"}</p>
                  <button onClick={stopTimer} className="w-full py-3 rounded-xl bg-purple-600 font-medium">Parar</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => startTimer("amamentacao", "esquerdo")} className="py-6 rounded-xl bg-pink-900/50 border border-pink-700">Esquerdo</button>
                  <button onClick={() => startTimer("amamentacao", "direito")} className="py-6 rounded-xl bg-emerald-900/50 border border-emerald-700">Direito</button>
                </div>
              )}
              <p className="text-center text-sm text-zinc-400 mt-4">Hoje: {todayFeeds.length} mamadas</p>
            </div>

            {/* Sono */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-blue-800/40">
              <h2 className="text-lg font-semibold mb-4">Soneca</h2>
              {timer?.type === "soneca" ? (
                <div className="text-center">
                  <div className="text-5xl font-bold my-4">{formatTime(elapsed)}</div>
                  <button onClick={stopTimer} className="w-full py-3 rounded-xl bg-blue-600 font-medium">Parar</button>
                </div>
              ) : (
                <button onClick={() => startTimer("soneca")} className="w-full py-6 rounded-xl bg-blue-900/50 border border-blue-700">
                  Iniciar soneca
                </button>
              )}
              <p className="text-center text-sm text-zinc-400 mt-4">Hoje: {todaySleep.length} sonecas</p>
            </div>
          </div>
        )}

        {tab === "historico" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Histórico de hoje</h2>
            {[...todayFeeds, ...todaySleep]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(e => (
                <div key={e.id} className="flex justify-between py-3 border-b border-zinc-800 text-sm">
                  <span>{e.type === "amamentacao" ? "🤱 Mamada" : "😴 Soneca"} {e.side ? `(${e.side === "esquerdo" ? "Esq" : "Dir"})` : ""}</span>
                  <span>{formatTime(e.duration || 0)}</span>
                </div>
              ))}
            {todayFeeds.length + todaySleep.length === 0 && <p className="text-zinc-500">Nada registrado ainda.</p>}
          </div>
        )}

        {tab === "sono" && (
          <div className="p-4 text-center text-zinc-400">
            Tela de sono em construção. Use o botão na aba Início por enquanto.
          </div>
        )}
      </main>

      {/* Navegação fixa */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900 border-t border-zinc-800 flex justify-around py-3">
        <button onClick={() => setTab("inicio")} className={tab === "inicio" ? "text-purple-400 font-medium" : "text-zinc-400"}>Início</button>
        <button onClick={() => setTab("historico")} className={tab === "historico" ? "text-purple-400 font-medium" : "text-zinc-400"}>Histórico</button>
        <button onClick={() => setTab("sono")} className={tab === "sono" ? "text-purple-400 font-medium" : "text-zinc-400"}>Sono</button>
        <button className="text-zinc-500">Mais</button>
      </nav>
    </div>
  );
}
