/**
 * Sincronização com o Supabase usando apenas fetch (sem instalar nada).
 * O app só conversa com duas funções do banco (push_records / pull_records),
 * protegidas pelo "código da família".
 */

export type SyncConfig = { url: string; key: string; family: string };

export type RemoteRow = {
  family: string;
  id: string;
  kind: string;
  data: unknown;
  updated_at: number;
  deleted: boolean;
};

export async function rpc<T>(cfg: SyncConfig, fn: string, body: unknown): Promise<T | null> {
  const res = await fetch(`${cfg.url.replace(/\/+$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.key,
      // chaves antigas (anon) são JWT e vão também em Authorization;
      // as novas ("sb_publishable_…") só podem ir no cabeçalho apikey
      ...(cfg.key.startsWith("eyJ") ? { Authorization: `Bearer ${cfg.key}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {
      /* ignora */
    }
    throw new Error(`Erro ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export async function pushRows(cfg: SyncConfig, rows: RemoteRow[]) {
  await rpc<null>(cfg, "push_records", { p_rows: rows });
}

export async function pullRows(cfg: SyncConfig, since: number): Promise<RemoteRow[]> {
  const rows = await rpc<RemoteRow[]>(cfg, "pull_records", { p_family: cfg.family, p_since: since });
  return rows ?? [];
}
