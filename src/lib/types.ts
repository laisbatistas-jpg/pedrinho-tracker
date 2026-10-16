export type Side = "esquerdo" | "direito";
export type DiaperKind = "molhada" | "suja" | "mista";
export type PoopColor = "amarela" | "mostarda" | "verde" | "marrom" | "preta" | "vermelha" | "esbranquicada";
export type PoopTexture = "liquida" | "pastosa" | "normal" | "dura";
export type PoopAmount = "pouco" | "medio" | "muito";
/** Detalhes do coco (opcional) numa fralda suja ou mista. */
export type Poop = { color?: PoopColor; texture?: PoopTexture; amount?: PoopAmount };
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
  poop?: Poop; // detalhes do coco
  note?: string;
  by?: string; // quem registrou
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
  by?: string;
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
  by?: string;
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
  photos?: string[]; // fotos da caderneta/comprovante (pequenas)
  by?: string;
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
  photos?: string[]; // receitas, exames, pedidos (pequenas)
  by?: string;
};

export type Milestone = {
  id: string;
  timestamp: number;
  title: string;
  note?: string;
  photo?: string; // dataURL pequena
  by?: string;
};

/** Ficha de emergência: dados que a família quer à mão numa intercorrência. */
export type EmergencyCard = {
  pediatra: string;
  pediatraPhone: string;
  hospital: string;
  hospitalPhone: string;
  hospitalAddress: string;
  insurance: string;
  insuranceNumber: string;
  bloodType: string;
  allergies: string;
  meds: string; // remédios de uso contínuo
  contact1Name: string;
  contact1Phone: string;
  contact2Name: string;
  contact2Phone: string;
  note: string;
};

export const DEFAULT_CARD: EmergencyCard = {
  pediatra: "",
  pediatraPhone: "",
  hospital: "",
  hospitalPhone: "",
  hospitalAddress: "",
  insurance: "",
  insuranceNumber: "",
  bloodType: "",
  allergies: "",
  meds: "",
  contact1Name: "",
  contact1Phone: "",
  contact2Name: "",
  contact2Phone: "",
  note: "",
};

export type Settings = {
  name: string;
  photo?: string; // foto de perfil do bebê (pequena, quadrada)
  birthDate: string; // YYYY-MM-DD ou ""
  sex: "menino" | "menina";
  alertFeedHours: number; // intervalo entre mamadas, em horas (ex.: 1.5 = 1h30). 0 = desligado
  alertFeedLeadMin: number; // avisar tantos minutos antes (0 = só na hora)
  alertSleepHours: number; // 0 = desligado
};

export const DEFAULT_SETTINGS: Settings = {
  name: "Pedrinho",
  birthDate: "",
  sex: "menino",
  alertFeedHours: 3,
  alertFeedLeadMin: 0,
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
  who: string; // quem usa este aparelho (aparece nos registros)
  whoAsked: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  nightMode: false,
  notify: false,
  syncUrl: "",
  syncKey: "",
  familyCode: "",
  lastPull: 0,
  who: "",
  whoAsked: false,
};

export type Kind = "event" | "growth" | "health" | "vaccine" | "visit" | "card" | "milestone" | "settings" | "timer";

export type Rec = {
  id: string;
  kind: Kind;
  data: unknown;
  updatedAt: number;
  deleted: boolean;
};

export type SyncStatus = "off" | "idle" | "syncing" | "ok" | "error";
