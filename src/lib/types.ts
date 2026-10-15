export type Side = "esquerdo" | "direito";
export type DiaperKind = "molhada" | "suja" | "mista";
export type EventType = "amamentacao" | "mamadeira" | "sono" | "fralda";

/** Registro da rotina (mamada, mamadeira, sono, fralda). */
export type BabyEvent = {
  id: string;
  type: EventType;
  timestamp: number; // início (ms)
  endTimestamp?: number;
  duration?: number; // segundos
  side?: Side; // peito
  ml?: number; // mamadeira
  milk?: "materno" | "formula";
  diaper?: DiaperKind;
  note?: string;
};

export type Timer = {
  active: {
    type: "amamentacao" | "sono";
    side?: Side;
    start: number;
  } | null;
};

export type Growth = {
  id: string;
  timestamp: number; // data da medição
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
  note?: string;
};

export type HealthKind = "remedio" | "temperatura" | "sintoma" | "humor";
export type Mood = "feliz" | "tranquilo" | "irritado" | "choroso";

export type HealthEntry = {
  id: string;
  kind: HealthKind;
  timestamp: number;
  name?: string; // remédio ou sintoma
  dose?: string;
  everyHours?: number; // remédio: repetir a cada X horas
  tempC?: number;
  mood?: Mood;
  note?: string;
};

export type VaccineRecord = {
  doneAt: number | null;
  note?: string;
};

export type Milestone = {
  id: string;
  timestamp: number;
  title: string;
  note?: string;
  photo?: string; // dataURL pequena
};

export type Settings = {
  name: string;
  birthDate: string; // YYYY-MM-DD ou ""
  sex: "menino" | "menina";
  alertFeedHours: number; // 0 = desligado
  alertSleepHours: number; // 0 = desligado
};

export const DEFAULT_SETTINGS: Settings = {
  name: "Pedrinho",
  birthDate: "",
  sex: "menino",
  alertFeedHours: 3,
  alertSleepHours: 0,
};

/** Preferências só deste aparelho (não sincronizam). */
export type Prefs = {
  nightMode: boolean;
  notify: boolean;
  syncUrl: string;
  syncKey: string;
  familyCode: string;
  lastPull: number;
};

export const DEFAULT_PREFS: Prefs = {
  nightMode: false,
  notify: false,
  syncUrl: "",
  syncKey: "",
  familyCode: "",
  lastPull: 0,
};

export type Kind = "event" | "growth" | "health" | "vaccine" | "milestone" | "settings" | "timer";

export type Rec = {
  id: string;
  kind: Kind;
  data: unknown;
  updatedAt: number;
  deleted: boolean;
};

export type SyncStatus = "off" | "idle" | "syncing" | "ok" | "error";
