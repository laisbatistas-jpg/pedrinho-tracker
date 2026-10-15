"use client";

import { PUSH_PUBLIC_KEY } from "./pushKey";
import { rpc, type SyncConfig } from "./sync";

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export type PushState =
  | "unsupported" // navegador sem suporte
  | "need-install" // iPhone: precisa estar na Tela de Início
  | "denied" // permissão negada
  | "off" // pode ativar
  | "on"; // ativado

export const isIos = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

export const isStandalone = () =>
  typeof window !== "undefined" &&
  ((navigator as Navigator & { standalone?: boolean }).standalone === true ||
    Boolean(window.matchMedia?.("(display-mode: standalone)").matches));

const hasApis = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  typeof Notification !== "undefined";

async function registration() {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  try {
    const reg = await registration();
    return reg ? await reg.pushManager.getSubscription() : null;
  } catch {
    return null;
  }
}

export async function getPushState(): Promise<PushState> {
  if (isIos() && !isStandalone()) return "need-install";
  if (!hasApis()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

/** Pede permissão (precisa ser chamado por um toque), cadastra este celular e guarda no servidor. */
export async function enablePush(cfg: SyncConfig, who: string): Promise<void> {
  if (!hasApis()) throw new Error("Este navegador não suporta avisos.");
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") throw new Error("A permissão foi negada. Libere nas configurações do celular.");

  const reg = await registration();
  if (!reg) throw new Error("O app ainda não terminou de carregar. Feche e abra de novo, e tente outra vez.");

  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToBytes(PUSH_PUBLIC_KEY) as unknown as BufferSource,
    }));

  const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) throw new Error("O celular não devolveu os dados do aviso.");

  await rpc<null>(cfg, "push_subscribe", {
    p_family: cfg.family,
    p_endpoint: j.endpoint,
    p_p256dh: j.keys.p256dh,
    p_auth: j.keys.auth,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
    p_who: who || null,
  });
}

export async function disablePush(cfg: SyncConfig | null): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  if (cfg) await rpc<null>(cfg, "push_unsubscribe", { p_family: cfg.family, p_endpoint: endpoint }).catch(() => null);
}

/** Pede ao servidor um aviso de teste para este celular. */
export async function sendTestPush(cfg: SyncConfig): Promise<string> {
  const sub = await currentSubscription();
  if (!sub) return "Este celular ainda não está ativado.";
  const res = await fetch("/api/push/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ family: cfg.family, endpoint: sub.endpoint }),
  });
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  return res.ok && body.ok ? "Aviso de teste enviado. Ele deve chegar em alguns segundos." : body.error || "Não foi possível enviar o teste.";
}
