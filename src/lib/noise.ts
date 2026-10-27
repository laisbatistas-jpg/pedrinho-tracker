"use client";

/**
 * Ruído branco / rosa / marrom / chuva gerado no próprio aparelho — não precisa de arquivos nem internet.
 * Toca por um <audio> em loop (e não só Web Audio), porque no iPhone é assim que o som continua
 * com a tela apagada. Um pequeno "store" avisa a tela (botão flutuante + tela de sons) sobre o estado.
 */

import { useSyncExternalStore } from "react";

export type NoiseKind =
  | "branco" | "rosa" | "marrom" | "chuva" | "ventilador" | "secador" | "shhh" | "mar" | "carro" | "utero" | "shhritmo";

export type NoisePrefs = { kind: NoiseKind; volume: number; minutes: number };
type State = { playing: boolean; endAt: number | null; prefs: NoisePrefs };

const KEY = "pedrinho-noise-v1";
const DEFAULTS: NoisePrefs = { kind: "branco", volume: 0.6, minutes: 60 };
const KIND_LABEL: Record<NoiseKind, string> = {
  branco: "Ruído branco",
  rosa: "Ruído rosa",
  marrom: "Ruído marrom",
  chuva: "Chuva",
  ventilador: "Ventilador",
  secador: "Secador de cabelo",
  shhh: "Shhh",
  mar: "Ondas do mar",
  carro: "Viagem de carro",
  utero: "Barriguinha",
  shhritmo: "Shh. Shh. Shh",
};

let state: State = { playing: false, endAt: null, prefs: DEFAULTS };
let loaded = false;
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
const urls = new Map<NoiseKind, string>();

function emit() {
  listeners.forEach((l) => l());
}
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function loadPrefs() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as Partial<NoisePrefs>;
    const kind = p.kind && p.kind in KIND_LABEL ? p.kind : DEFAULTS.kind;
    const volume = typeof p.volume === "number" ? Math.min(1, Math.max(0.05, p.volume)) : DEFAULTS.volume;
    const minutes = typeof p.minutes === "number" && p.minutes >= 0 ? p.minutes : DEFAULTS.minutes;
    state = { ...state, prefs: { kind, volume, minutes } };
  } catch {
    /* sem armazenamento: usa o padrão */
  }
}
function savePrefs() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.prefs));
  } catch {
    /* ignora */
  }
}

/* ---------- geração do som (WAV em memória) ---------- */

const RATE = 22050;
const SECONDS = 8;
const FADE = Math.round(RATE * 0.6); // emenda suave entre o fim e o começo do loop
const TAU = Math.PI * 2;

const white = (n: number) => {
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return d;
};
function pink(n: number) {
  const d = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return d;
}
function brown(n: number) {
  const d = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return d;
}

/** Filtro (passa-baixas, passa-altas ou passa-faixa), aplicado em sequência `passes` vezes. */
function filt(x: Float32Array, type: "lp" | "hp" | "bp", f: number, q = 0.707, passes = 1) {
  const w = (TAU * f) / RATE;
  const cos = Math.cos(w);
  const al = Math.sin(w) / (2 * q);
  const a0 = 1 + al, a1 = -2 * cos, a2 = 1 - al;
  let b0: number, b1: number, b2: number;
  if (type === "lp") { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; }
  else if (type === "hp") { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; }
  else { b0 = al; b1 = 0; b2 = -al; }
  const nb0 = b0 / a0, nb1 = b1 / a0, nb2 = b2 / a0, na1 = a1 / a0, na2 = a2 / a0;
  const y = new Float32Array(x.length);
  y.set(x);
  for (let p = 0; p < passes; p++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) {
      const xi = y[i];
      const yi = nb0 * xi + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
      x2 = x1; x1 = xi; y2 = y1; y1 = yi;
      y[i] = yi;
    }
  }
  return y;
}

/** Soma de camadas com ganhos. */
function mix(n: number, ...layers: [Float32Array, number][]) {
  const o = new Float32Array(n);
  for (const [l, g] of layers) for (let i = 0; i < n; i++) o[i] += l[i] * g;
  return o;
}

/** Tudo que varia no tempo usa ciclos inteiros dentro dos 8 s, para o loop não dar emenda. */
function genSamples(kind: NoiseKind, n: number): Float32Array {
  const N = RATE * SECONDS;
  const t = (i: number) => (i % N) / N; // posição dentro do loop, de 0 a 1
  switch (kind) {
    case "branco":
      return white(n);
    case "rosa":
      return pink(n);
    case "marrom":
      return brown(n);
    case "chuva": {
      const d = mix(n, [filt(pink(n), "hp", 700, 0.707, 2), 1], [filt(white(n), "hp", 5000), 0.12]);
      return d;
    }
    case "ventilador": {
      // sopro grave e contínuo, com uma leve pulsação das pás
      const d = mix(n, [filt(brown(n), "lp", 900), 1], [filt(pink(n), "bp", 1200, 0.6), 0.5]);
      for (let i = 0; i < n; i++) d[i] *= 1 + 0.07 * Math.sin(TAU * 16 * t(i)) + 0.03 * Math.sin(TAU * 5 * t(i));
      return d;
    }
    case "secador": {
      // o "ssss" constante do secador, com um zumbido de motor
      const d = mix(n, [filt(white(n), "bp", 1800, 0.45, 2), 1], [filt(pink(n), "lp", 500), 0.5]);
      for (let i = 0; i < n; i++) d[i] += 0.1 * Math.sin(TAU * 120 * (i / RATE));
      return d;
    }
    case "shhh": {
      // "shhh" que vai e volta, no ritmo de uma respiração calma
      const d = filt(white(n), "bp", 3200, 0.9, 2);
      for (let i = 0; i < n; i++) d[i] *= 0.3 + 0.7 * (0.5 - 0.5 * Math.cos(TAU * 2 * t(i)));
      return d;
    }
    case "shhritmo": {
      // "shh… shh… shh…" um por segundo (60 por minuto), com pausa curta entre eles
      const hiss = mix(n, [filt(white(n), "bp", 2900, 0.8, 2), 1], [filt(pink(n), "bp", 1400, 0.7), 0.35]);
      const d = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const ph = (i % RATE) / RATE; // segundos desde o começo de cada "shh"
        const up = Math.min(1, ph / 0.13);
        const down = ph < 0.3 ? 1 : Math.max(0, 1 - (ph - 0.3) / 0.32);
        const env = 0.03 + Math.pow(Math.sin((up * Math.PI) / 2), 2) * Math.pow(down, 1.5);
        d[i] = hiss[i] * env;
      }
      return d;
    }
    case "mar": {
      // ondas chegando e voltando, com espuma no fim de cada uma
      const body = filt(pink(n), "lp", 1600);
      const foam = filt(white(n), "hp", 2500);
      const d = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const w = Math.pow(0.5 - 0.5 * Math.cos(TAU * t(i)), 1.4);
        d[i] = body[i] * (0.2 + 0.8 * w) + foam[i] * 0.35 * Math.pow(w, 3);
      }
      return d;
    }
    case "carro": {
      // viagem de carro: ronco grave e estável
      const d = mix(n, [filt(brown(n), "lp", 380, 0.8, 2), 1], [filt(pink(n), "lp", 900), 0.25]);
      for (let i = 0; i < n; i++) d[i] = d[i] * (1 + 0.05 * Math.sin(TAU * 3 * t(i))) + 0.05 * Math.sin(TAU * 56 * (i / RATE));
      return d;
    }
    case "utero": {
      // som de dentro da barriga: murmúrio abafado + batimento do coração (75 por minuto)
      const d = mix(n, [filt(brown(n), "lp", 450, 0.8, 2), 1.4]);
      const beatEvery = N / 10;
      for (let i = 0; i < n; i++) {
        const ph = (i % beatEvery) / RATE; // segundos desde o começo do batimento
        const lub = Math.exp(-ph * 28) * Math.sin(TAU * 62 * ph);
        const dub = ph > 0.26 ? Math.exp(-(ph - 0.26) * 32) * Math.sin(TAU * 52 * (ph - 0.26)) * 0.7 : 0;
        d[i] += (lub + dub) * 1.1;
      }
      return d;
    }
  }
}

function makeWavUrl(kind: NoiseKind): string {
  const cached = urls.get(kind);
  if (cached) return cached;
  const N = RATE * SECONDS;
  const raw = genSamples(kind, N + FADE);
  const out = new Float32Array(N);
  out.set(raw.subarray(0, N));
  // mistura o "rabo" extra com o começo, para o loop não dar estalo
  for (let i = 0; i < FADE; i++) {
    const a = (i / FADE) * (Math.PI / 2);
    out[i] = raw[i] * Math.sin(a) + raw[N + i] * Math.cos(a);
  }
  // mesmo volume aparente para todos os sons (RMS), com limite suave contra picos
  let sum = 0;
  for (let i = 0; i < N; i++) sum += out[i] * out[i];
  const rms = Math.sqrt(sum / N) || 1;
  const gain = 0.3 / rms;

  const buf = new ArrayBuffer(44 + N * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + N * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, N * 2, true);
  for (let i = 0; i < N; i++) v.setInt16(44 + i * 2, Math.tanh(out[i] * gain) * 0.95 * 32767, true);
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  urls.set(kind, url);
  return url;
}

/* ---------- controle ---------- */

function clearTimer() {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = null;
}

function armTimer() {
  clearTimer();
  const { minutes } = state.prefs;
  if (minutes > 0) {
    const endAt = Date.now() + minutes * 60000;
    set({ endAt });
    stopTimer = setTimeout(stopNoise, minutes * 60000);
  } else {
    set({ endAt: null });
  }
}

function setupMediaSession(kind: NoiseKind) {
  try {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: KIND_LABEL[kind], artist: "Pedrinho Tracker" });
    navigator.mediaSession.setActionHandler("play", () => void startNoise());
    navigator.mediaSession.setActionHandler("pause", () => stopNoise());
    navigator.mediaSession.setActionHandler("stop", () => stopNoise());
  } catch {
    /* sem suporte */
  }
}

/** Começa a tocar com as últimas escolhas (ou as passadas aqui). Precisa ser chamado por um toque. */
export function startNoise(patch?: Partial<NoisePrefs>): boolean {
  if (typeof window === "undefined") return false;
  loadPrefs();
  if (patch) {
    state = { ...state, prefs: { ...state.prefs, ...patch } };
    savePrefs();
  }
  const { kind, volume } = state.prefs;
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    // garantia extra do desligamento programado, mesmo se o timer do navegador atrasar
    audio.addEventListener("timeupdate", () => {
      if (state.playing && state.endAt && Date.now() >= state.endAt) stopNoise();
    });
    // se o sistema pausar (ligação, outro app), o botão acompanha
    audio.addEventListener("pause", () => {
      if (state.playing && audio?.paused && audio.getAttribute("src")) {
        clearTimer();
        set({ playing: false, endAt: null });
      }
    });
  }
  audio.src = makeWavUrl(kind);
  audio.volume = volume;
  setupMediaSession(kind);
  void audio.play().then(
    () => {
      armTimer();
      set({ playing: true });
    },
    () => {
      clearTimer();
      set({ playing: false, endAt: null });
    },
  );
  // já marca como tocando para o botão responder na hora
  set({ playing: true });
  return true;
}

export function stopNoise() {
  clearTimer();
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  set({ playing: false, endAt: null });
}

export function toggleNoise() {
  if (state.playing) stopNoise();
  else startNoise();
}

/** Guarda as escolhas e, se estiver tocando, aplica na hora. */
export function setNoisePrefs(patch: Partial<NoisePrefs>) {
  loadPrefs();
  const before = state.prefs;
  state = { ...state, prefs: { ...before, ...patch } };
  savePrefs();
  if (state.playing && audio) {
    if (patch.kind && patch.kind !== before.kind) {
      audio.src = makeWavUrl(patch.kind);
      setupMediaSession(patch.kind);
      void audio.play();
    }
    if (patch.volume !== undefined) audio.volume = patch.volume;
    if (patch.minutes !== undefined && patch.minutes !== before.minutes) armTimer();
  }
  emit();
}

export const noiseLabel = (k: NoiseKind) => KIND_LABEL[k];

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const serverState: State = { playing: false, endAt: null, prefs: DEFAULTS };

export function useNoise() {
  return useSyncExternalStore(
    subscribe,
    () => {
      loadPrefs();
      return state;
    },
    () => serverState,
  );
}
