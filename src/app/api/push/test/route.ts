import { PUSH_PUBLIC_KEY } from "@/lib/pushKey";
import { loadWebPush, readEnv, rest } from "@/lib/pushServer";

export const runtime = "nodejs";

type Sub = { endpoint: string; p256dh: string; auth: string };

/** Envia um aviso de teste para UM celular já cadastrado (precisa do código da família e do endereço do celular). */
export async function POST(request: Request) {
  const env = readEnv();
  if (!env) return Response.json({ ok: false, error: "O servidor ainda não está configurado (faltam chaves na Vercel)." }, { status: 500 });

  let body: { family?: string; endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "pedido inválido" }, { status: 400 });
  }
  const family = String(body.family ?? "");
  const endpoint = String(body.endpoint ?? "");
  if (family.length < 8 || !endpoint.startsWith("https://")) {
    return Response.json({ ok: false, error: "dados inválidos" }, { status: 400 });
  }

  const rows = await rest<Sub[]>(
    env,
    `push_subs?family=eq.${encodeURIComponent(family)}&endpoint=eq.${encodeURIComponent(endpoint)}&select=endpoint,p256dh,auth`
  );
  if (rows.length === 0) {
    return Response.json({ ok: false, error: "Este celular ainda não está cadastrado no servidor. Desative e ative de novo." }, { status: 404 });
  }

  const wp = await loadWebPush();
  wp.setVapidDetails("https://pedrinho-tracker.vercel.app", PUSH_PUBLIC_KEY, env.vapidPrivate);
  try {
    await wp.sendNotification(
      { endpoint: rows[0].endpoint, keys: { p256dh: rows[0].p256dh, auth: rows[0].auth } },
      JSON.stringify({ title: "Pedrinho Tracker", body: "Teste: os avisos estão funcionando neste celular.", tag: "teste", url: "/" }),
      { TTL: 300, urgency: "high" }
    );
    return Response.json({ ok: true });
  } catch (e) {
    const code = (e as { statusCode?: number })?.statusCode;
    return Response.json({ ok: false, error: `O serviço de avisos recusou o envio (${code ?? "erro"}).` }, { status: 502 });
  }
}
