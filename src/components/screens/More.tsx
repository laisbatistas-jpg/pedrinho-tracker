"use client";

import { Icon, type IconName } from "@/components/Icon";
import type { Screen, ScreenProps } from "@/lib/nav";

const ITEMS: { id: Screen; label: string; hint: string; icon: IconName }[] = [
  { id: "stats", label: "Estatísticas", hint: "Gráficos da semana", icon: "chart" },
  { id: "historico", label: "Histórico", hint: "Dias anteriores", icon: "calendar" },
  { id: "crescimento", label: "Crescimento", hint: "Peso, altura e curva OMS", icon: "trend" },
  { id: "saude", label: "Saúde", hint: "Remédios, febre e humor", icon: "pill" },
  { id: "consultas", label: "Consultas", hint: "Agenda do pediatra e como foi", icon: "stethoscope" },
  { id: "vacinas", label: "Vacinas", hint: "Calendário do 1º ano", icon: "syringe" },
  { id: "marcos", label: "Marcos", hint: "Primeiras vezes e fotos", icon: "star" },
  { id: "sons", label: "Sons de ninar", hint: "Ruído branco e chuva", icon: "music" },
  { id: "relatorio", label: "Relatório", hint: "PDF para o pediatra", icon: "file" },
  { id: "config", label: "Configurações", hint: "Bebê, avisos e sincronia", icon: "sliders" },
];

export function MoreScreen({ go }: ScreenProps) {
  return (
    <div className="fade-in pt-2">
      <h2 className="text-xl font-bold mb-4">Mais</h2>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => go(it.id)}
            className="glass p-4 text-left flex flex-col gap-3 hover:bg-white/10"
          >
            <span className="icon-badge w-11 h-11">
              <Icon name={it.icon} className="w-5 h-5" />
            </span>
            <span>
              <span className="block font-semibold leading-tight">{it.label}</span>
              <span className="block text-xs text-[var(--muted)] mt-0.5">{it.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
