"use client";

import { Art } from "@/components/illus/Scenes";
import type { ArtPanel } from "@/lib/devArt";

/** Sequência de 3 ou 4 quadros com legenda e número do passo. */
export function Sequence({ panels }: { panels: ArtPanel[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2.5 mt-3 -ml-9">
      {panels.map((p, i) => (
        <li key={i} className="rounded-2xl overflow-hidden bg-white/[0.05] border border-white/10">
          <div className="relative">
            <Art scene={p.s} p={p.p} />
            <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full grid place-items-center text-xs font-bold btn-grad">{i + 1}</span>
          </div>
          <p className="text-[13px] leading-snug px-2.5 py-2">{p.t}</p>
        </li>
      ))}
    </ol>
  );
}
