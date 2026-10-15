"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, ScreenHeader } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { isNoisePlaying, setNoiseVolume, startNoise, stopNoise, type NoiseKind } from "@/lib/noise";

const KINDS: { value: NoiseKind; label: string; hint: string }[] = [
  { value: "branco", label: "Ruído branco", hint: "Chiado constante, o clássico para dormir" },
  { value: "rosa", label: "Ruído rosa", hint: "Mais suave, parecido com vento" },
  { value: "marrom", label: "Ruído marrom", hint: "Grave e profundo, tipo ronco de motor" },
  { value: "chuva", label: "Chuva", hint: "Som de chuva fina" },
];

export function SoundsScreen({ go }: ScreenProps) {
  const [kind, setKind] = useState<NoiseKind>("branco");
  const [volume, setVolume] = useState(0.35);
  const [minutes, setMinutes] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPlaying(isNoisePlaying());
  }, []);

  const toggle = () => {
    if (playing) {
      stopNoise();
      setPlaying(false);
      return;
    }
    const ok = startNoise(kind, volume, minutes, () => setPlaying(false));
    if (!ok) return setError("Este aparelho não suporta áudio no navegador.");
    setError("");
    setPlaying(true);
  };

  const changeKind = (k: NoiseKind) => {
    setKind(k);
    if (playing) startNoise(k, volume, minutes, () => setPlaying(false));
  };

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Sons de ninar" subtitle="Tocam mesmo com a tela apagada, se o aparelho permitir" onBack={() => go("mais")} />

      <section className="glass p-6 text-center">
        <button
          onClick={toggle}
          className={`mx-auto w-28 h-28 rounded-full grid place-items-center ${playing ? "btn-green" : "btn-grad"}`}
          aria-label={playing ? "Parar som" : "Tocar som"}
        >
          <Icon name={playing ? "stop" : "play"} className="w-12 h-12" />
        </button>
        <p className="font-semibold text-xl mt-4">{playing ? "Tocando" : "Toque para começar"}</p>
        <p className="text-sm text-[var(--muted)]">{KINDS.find((k) => k.value === kind)?.hint}</p>
        {error && <p className="text-sm text-amber-300 mt-2">{error}</p>}
      </section>

      <section className="glass p-5 space-y-5">
        <div>
          <p className="label">Som</p>
          <Chips<NoiseKind> value={kind} onChange={changeKind} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
        </div>
        <div>
          <p className="label">Volume</p>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setNoiseVolume(v);
            }}
            className="w-full accent-violet-400"
          />
        </div>
        <div>
          <p className="label">Desligar sozinho depois de</p>
          <Chips<number>
            value={minutes}
            onChange={setMinutes}
            options={[
              { value: 15, label: "15 min" },
              { value: 30, label: "30 min" },
              { value: 60, label: "1 hora" },
              { value: 120, label: "2 horas" },
              { value: 0, label: "Nunca" },
            ]}
          />
          {playing && <p className="text-xs text-[var(--muted)] mt-2">O tempo vale a partir do próximo play.</p>}
        </div>
      </section>
    </div>
  );
}
