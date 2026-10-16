import type { BabyEvent, DiaperKind, Poop, PoopAmount, PoopColor, PoopTexture, Side } from "./types";

export const pad = (n: number) => n.toString().padStart(2, "0");

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** 75 -> "01:15" */
export const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

export const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDayLong = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

export const formatDayShort = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });

export const formatDur = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${pad(m)}min`;
  if (m > 0) return `${m} min`;
  return sec > 0 ? `${Math.floor(sec)}s` : "0 min";
};

export const formatMinutes = (min: number) => formatDur(Math.round(min) * 60);

export const sideLabel = (s?: Side) => (s === "esquerdo" ? "Esquerdo" : "Direito");

export const diaperLabel = (d?: DiaperKind) =>
  d === "molhada" ? "Molhada" : d === "suja" ? "Suja" : "Mista";

export const POOP_COLORS: { value: PoopColor; label: string }[] = [
  { value: "amarela", label: "Amarela" },
  { value: "mostarda", label: "Mostarda" },
  { value: "verde", label: "Verde" },
  { value: "marrom", label: "Marrom" },
  { value: "preta", label: "Preta" },
  { value: "vermelha", label: "Com sangue" },
  { value: "esbranquicada", label: "Esbranquiçada" },
];
export const POOP_TEXTURES: { value: PoopTexture; label: string }[] = [
  { value: "liquida", label: "Líquida" },
  { value: "pastosa", label: "Pastosa" },
  { value: "normal", label: "Normal" },
  { value: "dura", label: "Dura" },
];
export const POOP_AMOUNTS: { value: PoopAmount; label: string }[] = [
  { value: "pouco", label: "Pouco" },
  { value: "medio", label: "Médio" },
  { value: "muito", label: "Muito" },
];

/** Fralda com coco (suja ou mista). */
export const isPoop = (e: BabyEvent) => e.type === "fralda" && e.diaper !== "molhada";

export function poopSummary(p?: Poop): string {
  if (!p) return "";
  const parts = [
    POOP_COLORS.find((c) => c.value === p.color)?.label,
    POOP_TEXTURES.find((t) => t.value === p.texture)?.label,
    POOP_AMOUNTS.find((a) => a.value === p.amount)?.label,
  ].filter(Boolean) as string[];
  return parts.join(", ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

/** Cores que merecem atenção do pediatra. */
export const poopWarning = (c?: PoopColor) =>
  c === "vermelha" || c === "esbranquicada" || c === "preta"
    ? "Fezes com sangue, esbranquiçadas ou pretas (depois dos primeiros dias de vida) merecem avisar o pediatra."
    : "";

export const WEEKDAY_LETTER = ["D", "S", "T", "Q", "Q", "S", "S"];

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const DAY = 86400000;

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

/** timestamp -> valor para <input type="datetime-local"> */
export const toLocalInput = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (v: string) => {
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : Date.now();
};

/** timestamp -> valor para <input type="date"> */
export const toDateInput = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fromDateInput = (v: string) => {
  // meio-dia local evita problemas de fuso
  const t = new Date(`${v}T12:00:00`).getTime();
  return Number.isFinite(t) ? t : Date.now();
};

/** Idade em dias a partir de "YYYY-MM-DD". null se vazio/inválido. */
export const ageInDays = (birthDate: string, now: number): number | null => {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00`).getTime();
  if (!Number.isFinite(b) || b > now) return null;
  return Math.floor((now - b) / DAY);
};

/** Idade em meses (decimal) */
export const ageInMonths = (birthDate: string, at: number): number | null => {
  const d = ageInDays(birthDate, at);
  return d === null ? null : d / 30.4375;
};

/** Meses completos de calendário e dias que sobram desde o último "mesversário". */
function calendarAge(birthDate: string, at: number): { months: number; days: number } | null {
  const b = new Date(`${birthDate}T00:00:00`);
  const t = new Date(at);
  if (!Number.isFinite(b.getTime()) || b.getTime() > at) return null;
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) months -= 1;
  const anchor = new Date(b.getFullYear(), b.getMonth() + months, b.getDate());
  const days = Math.max(0, Math.floor((startOfDay(at) - anchor.getTime()) / DAY));
  return { months: Math.max(0, months), days };
}

export const ageLabel = (birthDate: string, now: number): string => {
  const total = ageInDays(birthDate, now);
  if (total === null || !birthDate) return "";
  if (total < 14) return `${total} ${total === 1 ? "dia" : "dias"}`;
  if (total < 60) return `${Math.floor(total / 7)} semanas`;
  const age = calendarAge(birthDate, now);
  if (!age) return "";
  if (age.months >= 24) return `${Math.floor(age.months / 12)} anos`;
  const m = `${age.months} ${age.months === 1 ? "mês" : "meses"}`;
  return age.days > 0 ? `${m} e ${age.days}d` : m;
};

export const isFeed = (e: BabyEvent) => e.type === "amamentacao" || e.type === "mamadeira";

export const fmtNum = (n: number, digits = 1) => n.toFixed(digits).replace(".", ",");

/** Redimensiona uma foto e devolve dataURL JPEG pequena. */
export function resizeImage(file: File, maxSize = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a foto"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Foto inválida"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Sem suporte a canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Foto de perfil: recorta o centro em quadrado e reduz (JPEG pequeno). */
export function resizeSquare(file: File, size = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a foto"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Foto inválida"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Sem suporte a canvas"));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
