"use client";

import { Icon } from "@/components/Icon";
import { Chips, ScreenHeader } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import { setNoisePrefs, startNoise, toggleNoise, useNoise, type NoiseKind } from "@/lib/noise";

const KINDS: { value: NoiseKind; label: string; hint: string }[] = [
  { value: "branco", label: "Ruído branco", hint: "Chiado constante, o clássico" },
  { value: "rosa", label: "Ruído rosa", hint: "Mais suave, tipo vento" },
  { value: "marrom", label: "Ruído marrom", hint: "Grave e profundo" },
  { value: "chuva", label: "Chuva", hint: "Chuva fina na janela" },
  { value: "ventilador", label: "Ventilador", hint: "Sopro grave e constante" },
  { value: "secador", label: "Secador de cabelo", hint: "O \"ssss\" que acalma muitos bebês" },
  { value: "shhritmo", label: "Shh. Shh. Shh", hint: "Um \"shh\" por segundo, ritmado" },
  { value: "shhh", label: "Shhh contínuo", hint: "Shhh que vai e volta, como respiração" },
  { value: "mar", label: "Ondas do mar", hint: "Ondas chegando e voltando" },
  { value: "carro", label: "Viagem de carro", hint: "Ronco suave de estrada" },
  { value: "utero", label: "Barriguinha", hint: "Murmúrio e batimento do coração" },
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

      <section className="glass p-4">
        <p className="label px-1">Escolha o som (toque para ouvir)</p>
        <ul className="grid grid-cols-2 gap-2 mt-2">
          {KINDS.map((k) => {
            const on = prefs.kind === k.value;
            return (
              <li key={k.value}>
                <button
                  onClick={() => (playing ? setNoisePrefs({ kind: k.value }) : startNoise({ kind: k.value }))}
                  aria-pressed={on}
                  className={`w-full h-full text-left rounded-2xl px-3 py-2.5 border ${
                    on ? "border-[var(--violet)] bg-[rgba(124,58,237,0.28)]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="block font-semibold text-[15px] leading-tight">
                    {on && playing ? "▶ " : ""}
                    {k.label}
                  </span>
                  <span className="block text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{k.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass p-5 space-y-5">
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
