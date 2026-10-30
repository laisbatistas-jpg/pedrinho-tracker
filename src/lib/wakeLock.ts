"use client";
import { useEffect, useState } from "react";

type Sentinel = { release: () => Promise<void>; addEventListener: (t: string, f: () => void) => void };

/**
 * Mantém a tela ligada enquanto `active` for verdadeiro.
 * Usa a Screen Wake Lock API; se o aparelho não tiver, tenta um vídeo
 * mudo em loop (truque usado pelo NoSleep). Retorna se está funcionando.
 */
export function useWakeLock(active: boolean): "on" | "off" | "unsupported" {
  const [state, setState] = useState<"on" | "off" | "unsupported">("off");

  useEffect(() => {
    if (!active || typeof navigator === "undefined") {
      setState("off");
      return;
    }
    let sentinel: Sentinel | null = null;
    let video: HTMLVideoElement | null = null;
    let cancelled = false;
    const hasApi = "wakeLock" in navigator;

    const startVideo = () => {
      try {
        if (video) return;
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const ctx = c.getContext("2d");
        ctx?.fillRect(0, 0, 16, 16);
        const stream = (c as HTMLCanvasElement & { captureStream?: (f?: number) => MediaStream }).captureStream?.(1);
        if (!stream) return;
        video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.muted = true;
        video.loop = true;
        video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;bottom:0;left:0";
        video.srcObject = stream;
        document.body.appendChild(video);
        void video.play().then(() => !cancelled && setState("on")).catch(() => {});
      } catch {
        /* sem suporte */
      }
    };

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      if (hasApi) {
        try {
          const s = await (navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<Sentinel> } }).wakeLock.request("screen");
          if (cancelled) { void s.release(); return; }
          sentinel = s;
          setState("on");
          s.addEventListener("release", () => { if (sentinel === s) { sentinel = null; if (!cancelled) setState("off"); } });
          return;
        } catch {
          /* negado (bateria baixa, etc.): tenta o vídeo */
        }
      }
      startVideo();
      if (!video) setState(hasApi ? "off" : "unsupported");
    };

    const onVisible = () => { if (document.visibilityState === "visible" && !sentinel) void acquire(); };
    // alguns navegadores só liberam após um toque
    const onTouch = () => { if (!sentinel && !(video && !video.paused)) void acquire(); };

    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", onTouch);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", onTouch);
      void sentinel?.release().catch(() => {});
      if (video) { video.pause(); video.srcObject = null; video.remove(); }
    };
  }, [active]);

  return state;
}
