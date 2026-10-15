/** Ajudantes do servidor para os avisos push (acesso ao Supabase com a chave de serviço). */

export type ServerEnv = {
  url: string;
  serviceKey: string;
  vapidPrivate: string;
  cronSecret: string;
};

export function readEnv(): ServerEnv | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!url || !serviceKey || !vapidPrivate || !cronSecret) return null;
  return { url, serviceKey, vapidPrivate, cronSecret };
}

export function missingEnv(): string[] {
  const miss: string[] = [];
  if (!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) miss.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) miss.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.VAPID_PRIVATE_KEY) miss.push("VAPID_PRIVATE_KEY");
  if (!process.env.CRON_SECRET) miss.push("CRON_SECRET");
  return miss;
}

export async function rest<T = unknown>(
  env: ServerEnv,
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<T> {
  const res = await fetch(`${env.url}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: env.serviceKey,
      // chaves novas ("sb_secret_…") só vão em apikey; as antigas (JWT) vão nos dois
      ...(env.serviceKey.startsWith("eyJ") ? { Authorization: `Bearer ${env.serviceKey}` } : {}),
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`Supabase ${res.status} em ${path.split("?")[0]}: ${t}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Texto para filtro `in.(...)` do PostgREST. */
export const inList = (vals: string[]) => `in.(${vals.map((v) => `"${v.replace(/"/g, "")}"`).join(",")})`;

/** Carrega o objeto `web-push` (pacote CommonJS) de forma segura. */
export async function loadWebPush() {
  const mod = (await import("web-push")) as { default?: unknown };
  return (mod.default ?? mod) as {
    setVapidDetails: (subject: string, pub: string, priv: string) => void;
    sendNotification: (
      sub: { endpoint: string; keys: { p256dh: string; auth: string } },
      payload: string,
      opts?: { TTL?: number; urgency?: string }
    ) => Promise<unknown>;
  };
}
