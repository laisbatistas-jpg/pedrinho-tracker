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

export const VACCINE_REACTIONS = [
  "Febre",
  "Vermelhidão no local",
  "Inchaço no local",
  "Irritabilidade",
  "Muito sono",
  "Choro prolongado",
  "Sem reação",
] as const;

export type VaccineRecord = {
  doneAt: number | null; // quando foi aplicada
  scheduledAt?: number | null; // quando está agendada (ainda não aplicada)
  place?: string; // onde (posto, clínica)
  address?: string; // endereço do local
  applier?: string; // quem aplicou ou a médica
  batch?: string; // lote
  reactions?: string[]; // sintomas depois da vacina
  reactionNote?: string;
  note?: string;
};

export type VisitKind = "pediatra" | "retorno" | "exame" | "vacina" | "especialista" | "outro";
export type VisitStatus = "agendada" | "realizada" | "cancelada";
export type VisitOutcome = "tudo_bem" | "atencao" | "retorno";

/** Consulta ou compromisso de saúde (agendado ou já realizado). */
export type Visit = {
  id: string;
  kind: VisitKind;
  status: VisitStatus;
  timestamp: number; // data e hora marcadas
  doctor?: string;
  place?: string;
  address?: string; // endereço do local
  reason?: string; // motivo / o que perguntar
  outcome?: VisitOutcome; // como foi
  note?: string; // como foi (texto livre)
  guidance?: string; // orientações / receitas
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
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

export type Kind = "event" | "growth" | "health" | "vaccine" | "visit" | "milestone" | "settings" | "timer";

export type Rec = {
  id: string;
  kind: Kind;
  data: unknown;
  updatedAt: number;
  deleted: boolean;
};

export type SyncStatus = "off" | "idle" | "syncing" | "ok" | "error";
