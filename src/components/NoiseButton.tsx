"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { noiseLabel, toggleNoise, useNoise } from "@/lib/noise";

/** Botão flutuante: um toque liga o ruído (com as últimas escolhas), outro toque desliga. */
export function NoiseButton() {
  const { playing, endAt, prefs } = useNoise();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!playing || !endAt) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, [playing, endAt]);

  const left = playing && endAt && now ? Math.max(1, Math.ceil((endAt - now) / 60000)) : 0;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-md px-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.9rem)] z-20 pointer-events-none no-print">
      <button
        onClick={toggleNoise}
        aria-label={playing ? "Parar o ruído branco" : "Ligar o ruído branco"}
        aria-pressed={playing}
        className={`pointer-events-auto ml-auto flex items-center gap-2 rounded-full h-12 shadow-lg border border-white/15 backdrop-blur ${
          playing ? "btn-green pl-3.5 pr-4" : "bg-[rgba(14,19,40,0.88)] text-[#d9ccff] w-12 justify-center"
        }`}
      >
        <Icon name={playing ? "stop" : "waves"} className={playing ? "w-4 h-4" : "w-6 h-6"} />
        {playing && (
          <span className="text-sm font-semibold leading-none text-left">
            {noiseLabel(prefs.kind)}
            {left > 0 && <span className="block text-[11px] font-normal opacity-90 mt-0.5">desliga em {left} min</span>}
          </span>
        )}
      </button>
    </div>
  );
}
