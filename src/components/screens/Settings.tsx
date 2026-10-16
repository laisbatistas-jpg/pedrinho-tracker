"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Field, ScreenHeader, WhoPicker } from "@/components/ui";
import { roleOf } from "@/lib/profiles";
import { disablePush, enablePush, getPushState, sendTestPush, type PushState } from "@/lib/push";
import type { ScreenProps } from "@/lib/nav";
import type { Settings } from "@/lib/types";
import { formatClock, resizeSquare } from "@/lib/utils";

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 text-left py-1"
      role="switch"
      aria-checked={on}
    >
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
      </div>
      <span className={`w-12 h-7 rounded-full p-0.5 transition-colors ${on ? "bg-[var(--violet-deep)]" : "bg-white/15"}`}>
        <span className={`block w-6 h-6 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

const STATUS_TEXT: Record<string, string> = {
  off: "Desligada",
  idle: "Pronta",
  syncing: "Sincronizando…",
  ok: "Sincronizada",
  error: "Erro ao sincronizar",
};

export function SettingsScreen({ app, go }: ScreenProps) {
  const { settings, prefs } = app;
  const [name, setName] = useState(settings.name);
  const [saved, setSaved] = useState(false);
  const [url, setUrl] = useState(prefs.syncUrl);
  const [key, setKey] = useState(prefs.syncKey);
  const [family, setFamily] = useState(prefs.familyCode);
  const [msg, setMsg] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [pushState, setPushState] = useState<PushState | "loading">("loading");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  useEffect(() => {
    let alive = true;
    void getPushState().then((st) => alive && setPushState(st));
    return () => {
      alive = false;
    };
  }, []);
  const photoRef = useRef<HTMLInputElement>(null);
  const [usedChars, setUsedChars] = useState(0);
  useEffect(() => {
    try {
      setUsedChars((localStorage.getItem("pedrinho-db-v3") || "").length);
    } catch {
      /* sem armazenamento */
    }
  }, [app.events.length, app.visits.length, app.vaccines]);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Settings>) => app.upsert<Settings>("settings", "main", { ...settings, ...p });

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const askNotify = async (on: boolean) => {
    if (!on) return app.setPrefs({ notify: false });
    if (typeof Notification === "undefined") {
      return setMsg("Este navegador não permite notificações. No iPhone, adicione o app à Tela de Início primeiro.");
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      app.setPrefs({ notify: true });
      setMsg("");
    } else {
      setMsg("Permissão negada. Libere as notificações nas configurações do navegador.");
    }
  };

  const backup = () => {
    const blob = new Blob([app.exportAll()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pedrinho-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = app.importAll(await file.text());
      setMsg(`${n} registros restaurados.`);
    } catch {
      setMsg("Arquivo inválido. Use um backup gerado por este app.");
    }
  };

  return (
    <div className="fade-in pt-2 space-y-4">
      <ScreenHeader title="Configurações" onBack={() => go("mais")} />

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-4">Bebê</h2>
        <div className="flex items-center gap-4 mb-5">
          <span className="w-20 h-20 rounded-full overflow-hidden grid place-items-center text-4xl bg-gradient-to-br from-violet-500/30 to-indigo-900/60 border-2 border-[var(--violet-deep)] shrink-0">
            {settings.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.photo} alt={`Foto de ${settings.name}`} className="w-full h-full object-cover" />
            ) : (
              "👶"
            )}
          </span>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="btn-ghost w-full h-11 rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Icon name="camera" className="w-4 h-4" /> {photoBusy ? "Preparando…" : settings.photo ? "Trocar foto" : "Adicionar foto"}
            </button>
            {settings.photo && (
              <button
                type="button"
                onClick={() => app.upsert<Settings>("settings", "main", { ...settings, photo: undefined })}
                className="w-full mt-2 text-sm text-[var(--muted)]"
              >
                Remover foto
              </button>
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Foto de perfil"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setPhotoBusy(true);
                try {
                  patch({ photo: await resizeSquare(f) });
                  flashSaved();
                } catch {
                  setMsg("Não consegui usar essa foto. Tente outra.");
                } finally {
                  setPhotoBusy(false);
                }
              }}
            />
          </div>
        </div>
        <Field label="Nome">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name.trim() !== settings.name) {
                patch({ name: name.trim() });
                flashSaved();
              }
            }}
          />
        </Field>
        <Field label="Data de nascimento">
          <input
            type="date"
            className="field"
            value={settings.birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              patch({ birthDate: e.target.value });
              flashSaved();
            }}
          />
        </Field>
        <Field label="Sexo (usado só na curva de crescimento da OMS)" group>
          <Chips<"menino" | "menina">
            value={settings.sex}
            onChange={(v) => {
              patch({ sex: v });
              flashSaved();
            }}
            options={[
              { value: "menino", label: "Menino" },
              { value: "menina", label: "Menina" },
            ]}
          />
        </Field>
        {saved && <p className="text-sm text-emerald-300">Salvo ✓</p>}
      </section>

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-1">Quem usa este celular?</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Cada pessoa escolhe o próprio perfil no seu celular. O nome aparece nos registros (“por Laís”), assim todo mundo sabe quem deu o remédio ou trocou a fralda.
        </p>
        <WhoPicker value={prefs.who} onPick={(n) => app.setPrefs({ who: n, whoAsked: true })} />
        {prefs.who && (
          <p className="text-sm text-emerald-300 mt-3">
            Perfil deste celular: {prefs.who}
            {roleOf(prefs.who) ? ` (${roleOf(prefs.who)})` : ""}
          </p>
        )}
      </section>

      <section className="glass p-5 space-y-4">
        <h2 className="font-semibold text-lg">Avisos</h2>
        <Field label="Intervalo entre as mamadas" group>
          <Chips<number>
            value={settings.alertFeedHours}
            onChange={(v) => {
              patch({ alertFeedHours: v });
              setCustomMin("");
            }}
            options={[
              { value: 0, label: "Desligado" },
              { value: 1, label: "1h" },
              { value: 1.5, label: "1h30" },
              { value: 2, label: "2h" },
              { value: 2.5, label: "2h30" },
              { value: 3, label: "3h" },
              { value: 3.5, label: "3h30" },
              { value: 4, label: "4h" },
            ]}
          />
          <div className="mt-3 flex items-center gap-2">
            <input
              inputMode="numeric"
              className="field"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value.replace(/\D/g, "").slice(0, 3))}
              onBlur={() => {
                const m = parseInt(customMin, 10);
                if (m >= 20 && m <= 480) patch({ alertFeedHours: m / 60 });
              }}
              placeholder="Outro valor, em minutos (ex.: 75)"
              aria-label="Intervalo em minutos"
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Contado a partir do <strong>início</strong> da última mamada. Com isso, a tela inicial mostra a hora da próxima e o app avisa quando chegar.
            {settings.alertFeedHours > 0 && ` Agora: a cada ${Math.round(settings.alertFeedHours * 60)} minutos.`}
          </p>
        </Field>
        <Field label="Avisar com antecedência" group>
          <Chips<number>
            value={settings.alertFeedLeadMin}
            onChange={(v) => patch({ alertFeedLeadMin: v })}
            options={[
              { value: 0, label: "Só na hora" },
              { value: 5, label: "5 min antes" },
              { value: 10, label: "10 min antes" },
              { value: 15, label: "15 min antes" },
            ]}
          />
        </Field>
        <Field label="Avisar se a soneca passar de …" group>
          <Chips<number>
            value={settings.alertSleepHours}
            onChange={(v) => patch({ alertSleepHours: v })}
            options={[
              { value: 0, label: "Desligado" },
              { value: 2, label: "2h" },
              { value: 3, label: "3h" },
            ]}
          />
        </Field>
        <Field label="Avisar se ficar sem coco por …" group>
          <Chips<number>
            value={settings.alertPoopDays}
            onChange={(v) => patch({ alertPoopDays: v })}
            options={[
              { value: 0, label: "Desligado" },
              { value: 2, label: "2 dias" },
              { value: 3, label: "3 dias" },
              { value: 4, label: "4 dias" },
              { value: 5, label: "5 dias" },
            ]}
          />
          <p className="text-xs text-[var(--muted)] mt-2">
            Cada bebê tem seu ritmo. Se o pediatra disse que é normal ficar alguns dias sem coco, deixe desligado ou escolha um valor maior.
          </p>
        </Field>
        <Toggle
          on={settings.alertDailySummary}
          onChange={(v) => patch({ alertDailySummary: v })}
          label="Resumo do dia às 21h"
          hint="Um aviso à noite, no celular, com as mamadas, o sono e as fraldas do dia. Precisa ter ativado “Avisos no celular”."
        />
        <Toggle
          on={prefs.notify}
          onChange={askNotify}
          label="Avisos com o app aberto"
          hint="Aparecem enquanto o app está aberto ou em segundo plano. Para receber com o app fechado e a tela desligada, ative em “Avisos no celular”, logo abaixo."
        />
      </section>

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-1">Avisos no celular</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Receba as notificações (hora da mamada, consultas e vacinas) <strong>mesmo com o app fechado</strong>. Cada pessoa ativa no próprio celular.
        </p>
        {!app.syncConfigured ? (
          <p className="text-sm text-amber-200">Antes, ligue a sincronização (mais abaixo nesta tela). Os avisos usam o mesmo código da família.</p>
        ) : pushState === "loading" ? (
          <p className="text-sm text-[var(--muted)]">Verificando…</p>
        ) : pushState === "need-install" ? (
          <p className="text-sm text-amber-200">
            No iPhone, primeiro adicione o app à Tela de Início: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
            Abra o app por esse ícone e volte aqui.
          </p>
        ) : pushState === "unsupported" ? (
          <p className="text-sm text-amber-200">Este navegador não permite avisos com o app fechado.</p>
        ) : pushState === "denied" ? (
          <p className="text-sm text-amber-200">
            As notificações estão bloqueadas. Libere em <strong>Ajustes do celular → Notificações → Pedrinho</strong> e tente de novo.
          </p>
        ) : pushState === "on" ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-300">Ativado neste celular ✓</p>
            <button
              type="button"
              disabled={pushBusy}
              onClick={async () => {
                if (!app.syncCfg) return;
                setPushBusy(true);
                setPushMsg(await sendTestPush(app.syncCfg).catch(() => "Não foi possível enviar o teste."));
                setPushBusy(false);
              }}
              className="btn-ghost w-full h-12 rounded-2xl font-semibold"
            >
              Enviar aviso de teste
            </button>
            <button
              type="button"
              disabled={pushBusy}
              onClick={async () => {
                setPushBusy(true);
                await disablePush(app.syncCfg);
                setPushState(await getPushState());
                setPushMsg("");
                setPushBusy(false);
              }}
              className="w-full h-11 rounded-2xl font-semibold border border-[var(--stroke)] text-[var(--muted)]"
            >
              Desativar neste celular
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={pushBusy}
            onClick={async () => {
              if (!app.syncCfg) return;
              setPushBusy(true);
              setPushMsg("");
              try {
                await enablePush(app.syncCfg, prefs.who);
                setPushState(await getPushState());
                setPushMsg("Pronto! Toque em “Enviar aviso de teste” para conferir.");
              } catch (e) {
                setPushMsg(e instanceof Error ? e.message : "Não foi possível ativar.");
                setPushState(await getPushState());
              }
              setPushBusy(false);
            }}
            className="btn-grad w-full h-14 rounded-2xl font-semibold text-lg"
          >
            {pushBusy ? "Ativando…" : "Ativar avisos neste celular"}
          </button>
        )}
        {pushMsg && <p className="text-sm mt-3 text-[var(--muted)]">{pushMsg}</p>}
      </section>

      <section className="glass p-5 space-y-4">
        <h2 className="font-semibold text-lg">Aparência</h2>
        <Toggle
          on={prefs.nightMode}
          onChange={(v) => app.setPrefs({ nightMode: v })}
          label="Modo noturno extra-escuro"
          hint="Reduz o brilho e tira o azul. Ótimo para mamadas de madrugada."
        />
      </section>

      <section className="glass p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-lg">Sincronização</h2>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              app.syncStatus === "ok"
                ? "border-emerald-400/60 text-emerald-200"
                : app.syncStatus === "error"
                  ? "border-amber-400/60 text-amber-200"
                  : "border-[var(--stroke-strong)] text-[var(--muted)]"
            }`}
          >
            {STATUS_TEXT[app.syncStatus]}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)] mb-4">
          Compartilhe os registros entre os celulares da família. Todos precisam usar o mesmo código.
          {app.lastSync > 0 && ` Última vez: ${formatClock(app.lastSync)}.`}
        </p>

        {!app.envConfigured && (
          <>
            <Field label="Endereço do Supabase (Project URL)">
              <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoCapitalize="none" autoCorrect="off" />
            </Field>
            <Field label="Chave pública (anon key)">
              <input className="field" value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJ…" autoCapitalize="none" autoCorrect="off" />
            </Field>
          </>
        )}
        <Field label="Código da família (invente um, mínimo 8 caracteres)">
          <input className="field" value={family} onChange={(e) => setFamily(e.target.value)} placeholder="ex.: pedrinho-familia-2026" autoCapitalize="none" autoCorrect="off" />
        </Field>
        <p className="text-xs text-[var(--muted)] -mt-2 mb-4">
          Quem souber o código consegue ver os registros. Escolha algo longo e difícil de adivinhar.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              app.applySync(url, key, family);
              setMsg("Sincronização ligada.");
            }}
            className="btn-grad flex-1 h-12 rounded-2xl font-semibold"
          >
            {app.syncConfigured ? "Atualizar" : "Ligar"}
          </button>
          {app.syncConfigured && (
            <button onClick={() => void app.syncNow()} className="btn-ghost h-12 px-4 rounded-2xl font-semibold" aria-label="Sincronizar agora">
              <Icon name="swap" className="w-5 h-5" />
            </button>
          )}
        </div>
        {app.syncConfigured && (
          <button
            onClick={() => {
              app.disableSync();
              setFamily("");
              setUrl("");
              setKey("");
              setMsg("Sincronização desligada neste aparelho. Os registros continuam aqui.");
            }}
            className="w-full py-3 mt-2 text-sm text-[var(--muted)]"
          >
            Desligar neste aparelho
          </button>
        )}
        {app.syncError && <p className="text-sm text-amber-300 mt-2 break-words">{app.syncError}</p>}
      </section>

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-1">Espaço usado</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          Registros e fotos ficam guardados neste aparelho (limite de cerca de 5 MB). Faça backup de vez em quando.
        </p>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full ${usedChars > 3500000 ? "bg-amber-400" : "btn-grad"}`}
            style={{ width: `${Math.min(100, (usedChars / 5000000) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          {(usedChars / 1000000).toFixed(1).replace(".", ",")} MB de ~5 MB
          {usedChars > 3500000 ? " — quase cheio. Faça backup e evite novas fotos grandes." : ""}
        </p>
      </section>

      <section className="glass p-5">
        <h2 className="font-semibold text-lg mb-1">Backup</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Baixe uma cópia de segurança dos registros ou restaure uma anterior.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={backup} className="btn-ghost h-12 rounded-2xl font-semibold flex items-center justify-center gap-2">
            <Icon name="download" className="w-5 h-5" /> Baixar
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost h-12 rounded-2xl font-semibold flex items-center justify-center gap-2">
            <Icon name="upload" className="w-5 h-5" /> Restaurar
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void restore(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {app.storageError && (
          <p className="text-sm text-amber-300 mt-3">
            O aparelho está sem espaço para salvar (provavelmente por causa de fotos). Faça um backup e apague marcos com foto.
          </p>
        )}
      </section>

      {msg && <p className="text-sm text-center text-[var(--violet)]">{msg}</p>}
    </div>
  );
}
