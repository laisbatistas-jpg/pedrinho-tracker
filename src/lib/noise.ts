/** Ruído branco / rosa / marrom gerado no próprio aparelho (Web Audio) — não precisa de arquivos. */

export type NoiseKind = "branco" | "rosa" | "marrom" | "chuva";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function makeBuffer(audio: AudioContext, kind: NoiseKind): AudioBuffer {
  const seconds = 6;
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  if (kind === "branco") {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } else if (kind === "rosa" || kind === "chuva") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

export function startNoise(kind: NoiseKind, volume: number, minutes: number, onEnd?: () => void) {
  stopNoise();
  const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return false;
  ctx = ctx ?? new Ctor();
  void ctx.resume();
  source = ctx.createBufferSource();
  source.buffer = makeBuffer(ctx, kind);
  source.loop = true;
  gain = ctx.createGain();
  gain.gain.value = volume;
  if (kind === "chuva") {
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900;
    source.connect(filter);
    filter.connect(gain);
  } else {
    source.connect(gain);
  }
  gain.connect(ctx.destination);
  source.start();
  if (minutes > 0) {
    stopTimer = setTimeout(() => {
      stopNoise();
      onEnd?.();
    }, minutes * 60000);
  }
  return true;
}

export function setNoiseVolume(volume: number) {
  if (gain) gain.gain.value = volume;
}

export function stopNoise() {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = null;
  try {
    source?.stop();
  } catch {
    /* já parado */
  }
  source?.disconnect();
  gain?.disconnect();
  source = null;
  gain = null;
}

export function isNoisePlaying() {
  return source !== null;
}
