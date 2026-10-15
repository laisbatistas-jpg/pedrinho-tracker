/**
 * Dados de referência.
 * Curvas: OMS (Padrões de Crescimento Infantil), 0–12 meses, faixa de -2 a +2 desvios-padrão.
 * São uma referência geral — a avaliação do crescimento é sempre do pediatra.
 */

export type GrowthMetric = "weightKg" | "heightCm" | "headCm";

type Curve = { low: number[]; mid: number[]; high: number[] }; // índice = mês (0..12)

export const WHO: Record<"menino" | "menina", Record<GrowthMetric, Curve>> = {
  menino: {
    weightKg: {
      low: [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 6.9, 7.1, 7.4, 7.6, 7.7],
      mid: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6],
      high: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 12.0],
    },
    heightCm: {
      low: [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0],
      mid: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7],
      high: [53.7, 58.6, 62.4, 65.5, 68.0, 70.1, 71.9, 73.5, 75.0, 76.5, 77.7, 79.2, 80.5],
    },
    headCm: {
      low: [32.1, 35.1, 36.9, 38.3, 39.4, 40.3, 41.0, 41.7, 42.2, 42.6, 43.0, 43.4, 43.6],
      mid: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1],
      high: [36.9, 39.5, 41.3, 42.7, 43.9, 44.9, 45.6, 46.3, 46.9, 47.4, 47.8, 48.2, 48.5],
    },
  },
  menina: {
    weightKg: {
      low: [2.4, 3.2, 3.9, 4.5, 5.0, 5.4, 5.7, 6.0, 6.3, 6.5, 6.7, 6.9, 7.0],
      mid: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9],
      high: [4.2, 5.5, 6.6, 7.5, 8.2, 8.8, 9.3, 9.8, 10.2, 10.5, 10.9, 11.2, 11.5],
    },
    heightCm: {
      low: [45.4, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9],
      mid: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0],
      high: [52.9, 57.6, 61.1, 64.0, 66.4, 68.5, 70.3, 71.9, 73.5, 75.0, 76.4, 77.7, 79.2],
    },
    headCm: {
      low: [31.5, 34.2, 35.8, 37.1, 38.1, 38.9, 39.6, 40.2, 40.7, 41.2, 41.5, 41.9, 42.1],
      mid: [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9],
      high: [36.2, 38.8, 40.7, 41.9, 43.0, 44.0, 44.7, 45.4, 45.9, 46.4, 46.8, 47.2, 47.5],
    },
  },
};

export const METRIC_INFO: Record<GrowthMetric, { label: string; unit: string }> = {
  weightKg: { label: "Peso", unit: "kg" },
  heightCm: { label: "Altura", unit: "cm" },
  headCm: { label: "Cabeça", unit: "cm" },
};

/** Interpola a curva em um mês fracionado (0–12). */
export function curveAt(curve: number[], months: number): number {
  const m = Math.max(0, Math.min(12, months));
  const i = Math.floor(m);
  if (i >= 12) return curve[12];
  const f = m - i;
  return curve[i] + (curve[i + 1] - curve[i]) * f;
}

/** Posição relativa à faixa da OMS. */
export function growthBand(
  sex: "menino" | "menina",
  metric: GrowthMetric,
  months: number,
  value: number
): "abaixo" | "dentro" | "acima" | null {
  if (months < 0 || months > 12.5) return null;
  const c = WHO[sex][metric];
  if (value < curveAt(c.low, months)) return "abaixo";
  if (value > curveAt(c.high, months)) return "acima";
  return "dentro";
}

/**
 * Janela de vigília típica (minutos acordado entre sonecas) por idade.
 * Valores médios de referência — cada bebê é diferente.
 */
export function wakeWindowMinutes(ageMonths: number | null): number {
  if (ageMonths === null) return 120;
  if (ageMonths < 1) return 50;
  if (ageMonths < 2) return 70;
  if (ageMonths < 3) return 85;
  if (ageMonths < 4) return 100;
  if (ageMonths < 6) return 120;
  if (ageMonths < 8) return 150;
  if (ageMonths < 10) return 180;
  if (ageMonths < 13) return 195;
  return 240;
}

export type VaccineDef = {
  key: string;
  name: string;
  dose: string;
  monthDue: number; // idade (em meses) em que é prevista
  note?: string;
};

/**
 * Calendário básico do primeiro ano (referência: PNI/SUS).
 * O calendário muda com o tempo: confira sempre a caderneta e o pediatra.
 */
export const VACCINES: VaccineDef[] = [
  { key: "bcg", name: "BCG", dose: "Dose única", monthDue: 0 },
  { key: "hepb", name: "Hepatite B", dose: "Ao nascer", monthDue: 0 },
  { key: "penta1", name: "Pentavalente", dose: "1ª dose", monthDue: 2, note: "Difteria, tétano, coqueluche, Hib e hepatite B" },
  { key: "vip1", name: "VIP (pólio injetável)", dose: "1ª dose", monthDue: 2 },
  { key: "pneumo1", name: "Pneumocócica 10V", dose: "1ª dose", monthDue: 2 },
  { key: "rota1", name: "Rotavírus", dose: "1ª dose", monthDue: 2 },
  { key: "mening1", name: "Meningocócica C", dose: "1ª dose", monthDue: 3 },
  { key: "penta2", name: "Pentavalente", dose: "2ª dose", monthDue: 4 },
  { key: "vip2", name: "VIP (pólio injetável)", dose: "2ª dose", monthDue: 4 },
  { key: "pneumo2", name: "Pneumocócica 10V", dose: "2ª dose", monthDue: 4 },
  { key: "rota2", name: "Rotavírus", dose: "2ª dose", monthDue: 4 },
  { key: "mening2", name: "Meningocócica C", dose: "2ª dose", monthDue: 5 },
  { key: "penta3", name: "Pentavalente", dose: "3ª dose", monthDue: 6 },
  { key: "vip3", name: "VIP (pólio injetável)", dose: "3ª dose", monthDue: 6 },
  { key: "gripe", name: "Influenza (gripe)", dose: "Anual a partir dos 6 meses", monthDue: 6 },
  { key: "febre", name: "Febre amarela", dose: "1ª dose", monthDue: 9 },
  { key: "triplice", name: "Tríplice viral", dose: "1ª dose", monthDue: 12, note: "Sarampo, caxumba e rubéola" },
  { key: "pneumoR", name: "Pneumocócica 10V", dose: "Reforço", monthDue: 12 },
  { key: "meningR", name: "Meningocócica C", dose: "Reforço", monthDue: 12 },
];

export const MILESTONE_SUGGESTIONS = [
  "Primeiro sorriso",
  "Segurou a cabeça",
  "Rolou",
  "Sentou sem apoio",
  "Primeiro dente",
  "Engatinhou",
  "Primeira papinha",
  "Primeiras palavras",
  "Primeiros passos",
];
