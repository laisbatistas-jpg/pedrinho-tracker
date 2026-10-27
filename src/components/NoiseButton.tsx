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
        className={`pointer-events-auto ml-auto flex items-center gap-2 rounded-full h-14 shadow-lg border border-white/25 ${
          playing ? "btn-green pl-4 pr-5" : "btn-grad pl-4 pr-5 shadow-[0_0_22px_-2px_rgba(139,92,246,0.85)]"
        }`}
      >
        <Icon name={playing ? "stop" : "waves"} className={playing ? "w-5 h-5" : "w-7 h-7"} />
        {!playing && <span className="text-[15px] font-bold leading-none">Som</span>}
        {playing && (
          <span className="text-[15px] font-bold leading-none text-left">
            {noiseLabel(prefs.kind)}
            {left > 0 && <span className="block text-[11px] font-normal opacity-90 mt-0.5">desliga em {left} min</span>}
          </span>
        )}
      </button>
    </div>
  );
}
