"use client";

/**
 * Ruído branco / rosa / marrom / chuva gerado no próprio aparelho — não precisa de arquivos nem internet.
 * Toca por um <audio> em loop (e não só Web Audio), porque no iPhone é assim que o som continua
 * com a tela apagada. Um pequeno "store" avisa a tela (botão flutuante + tela de sons) sobre o estado.
 */

import { useSyncExternalStore } from "react";

export type NoiseKind = "branco" | "rosa" | "marrom" | "chuva";

export type NoisePrefs = { kind: NoiseKind; volume: number; minutes: number };
type State = { playing: boolean; endAt: number | null; prefs: NoisePrefs };

const KEY = "pedrinho-noise-v1";
const DEFAULTS: NoisePrefs = { kind: "branco", volume: 0.6, minutes: 60 };
const KIND_LABEL: Record<NoiseKind, string> = {
  branco: "Ruído branco",
  rosa: "Ruído rosa",
  marrom: "Ruído marrom",
  chuva: "Chuva",
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

function genSamples(kind: NoiseKind, n: number): Float32Array {
  const d = new Float32Array(n);
  if (kind === "branco") {
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
  } else if (kind === "marrom") {
    let last = 0;
    for (let i = 0; i < n; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
  } else {
    // rosa (e base da chuva)
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
    if (kind === "chuva") {
      // passa-altas simples: tira o grave e deixa o som "molhado"
      const a = Math.exp((-2 * Math.PI * 900) / RATE);
      let px = 0, py = 0;
      for (let i = 0; i < n; i++) {
        const x = d[i];
        py = a * (py + x - px);
        px = x;
        d[i] = py * 1.6;
      }
    }
  }
  return d;
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
    const t = (i / FADE) * (Math.PI / 2);
    out[i] = raw[i] * Math.sin(t) + raw[N + i] * Math.cos(t);
  }
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.9 / peak : 1;

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
  for (let i = 0; i < N; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[i] * gain)) * 32767, true);
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
