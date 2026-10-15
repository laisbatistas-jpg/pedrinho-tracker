import { Icon } from "./Icon";
import type { NapPrediction } from "@/lib/app";
import { formatClock, formatMinutes } from "@/lib/utils";

export function NapCard({
  nap,
  hasBirthDate,
  onSettings,
}: {
  nap: NapPrediction | null;
  hasBirthDate: boolean;
  onSettings: () => void;
}) {
  return (
    <section className="glass p-5">
      <div className="flex items-center gap-4">
        <span className="icon-badge w-12 h-12 bg-blue-900/50">
          <Icon name="target" className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          {nap === null && (
            <>
              <p className="text-sm font-semibold text-[var(--violet)]">Próxima soneca sugerida</p>
              <p className="text-[var(--muted)] mt-1 text-sm">Registre uma soneca para ver a sugestão.</p>
            </>
          )}
          {nap?.state === "sleeping" && (
            <>
              <p className="text-sm font-semibold text-[var(--violet)]">Soneca</p>
              <p className="text-lg font-semibold">Dormindo agora</p>
              <p className="text-xs text-[var(--muted)]">A sugestão volta quando ele acordar.</p>
            </>
          )}
          {nap?.state === "ok" && (
            <>
              <p className="text-sm font-semibold text-[var(--violet)]">
                {nap.overdue ? "Janela de sono já passou" : "Próxima soneca sugerida"}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="grad-text text-4xl font-extrabold leading-tight tabular-nums">{formatClock(nap.at)}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#cfc4ff] border border-[var(--stroke-strong)] rounded-full px-2.5 py-1">
                  <Icon name="clock" className="w-3.5 h-3.5" /> janela de {formatMinutes(nap.windowMin)}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Baseado {nap.basedOn === "hoje" ? "no padrão de hoje e na idade" : "na idade do bebê"}.
              </p>
            </>
          )}
        </div>
      </div>
      {!hasBirthDate && (
        <button onClick={onSettings} className="mt-3 text-xs font-semibold text-[var(--violet)] text-left">
          Informe a data de nascimento para a sugestão ficar mais precisa →
        </button>
      )}
    </section>
  );
}
