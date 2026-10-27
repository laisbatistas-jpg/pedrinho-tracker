"use client";

import { Icon } from "@/components/Icon";
import { Chips, ScreenHeader } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { setNoisePrefs, toggleNoise, useNoise, type NoiseKind } from "@/lib/noise";

const KINDS: { value: NoiseKind; label: string; hint: string }[] = [
  { value: "branco", label: "Ruído branco", hint: "Chiado constante, o clássico para dormir" },
  { value: "rosa", label: "Ruído rosa", hint: "Mais suave, parecido com vento" },
  { value: "marrom", label: "Ruído marrom", hint: "Grave e profundo, tipo ronco de motor" },
  { value: "chuva", label: "Chuva", hint: "Som de chuva fina" },
];

const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

export function SoundsScreen({ go }: ScreenProps) {
  const { playing, prefs } = useNoise();

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Sons de ninar" subtitle="Também tem o botão de ondas, sempre à mão em qualquer tela" onBack={() => go("mais")} />

      <section className="glass p-6 text-center">
        <button
          onClick={toggleNoise}
          className={`mx-auto w-28 h-28 rounded-full grid place-items-center ${playing ? "btn-green" : "btn-grad"}`}
          aria-label={playing ? "Parar som" : "Tocar som"}
        >
          <Icon name={playing ? "stop" : "play"} className="w-12 h-12" />
        </button>
        <p className="font-semibold text-xl mt-4">{playing ? "Tocando" : "Toque para começar"}</p>
        <p className="text-sm text-[var(--muted)]">{KINDS.find((k) => k.value === prefs.kind)?.hint}</p>
      </section>

      <section className="glass p-5 space-y-5">
        <div>
          <p className="label">Som</p>
          <Chips<NoiseKind> value={prefs.kind} onChange={(kind) => setNoisePrefs({ kind })} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
        </div>
        {isIOS() ? (
          <p className="text-xs text-[var(--muted)]">No iPhone, o volume é ajustado pelos botões do lado do aparelho.</p>
        ) : (
          <div>
            <p className="label">Volume</p>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={prefs.volume}
              onChange={(e) => setNoisePrefs({ volume: Number(e.target.value) })}
              className="w-full accent-violet-400"
            />
          </div>
        )}
        <div>
          <p className="label">Desligar sozinho depois de</p>
          <Chips<number>
            value={prefs.minutes}
            onChange={(minutes) => setNoisePrefs({ minutes })}
            options={[
              { value: 15, label: "15 min" },
              { value: 30, label: "30 min" },
              { value: 60, label: "1 hora" },
              { value: 120, label: "2 horas" },
              { value: 0, label: "Nunca" },
            ]}
          />
        </div>
        <p className="text-xs text-[var(--muted)]">As escolhas ficam guardadas: o botão de ondas sempre liga do jeito que você deixou aqui.</p>
      </section>
    </div>
  );
}
