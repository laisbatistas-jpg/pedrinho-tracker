"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chips, Field, ScreenHeader } from "@/components/ui";
import type { ScreenProps } from "@/lib/nav";
import type { Settings } from "@/lib/types";
import { formatClock } from "@/lib/utils";

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
  const [who, setWho] = useState(prefs.who);
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
          Seu nome aparece em cada registro que você fizer (“por Samuel”). Assim a família sabe quem deu o remédio ou trocou a fralda.
        </p>
        <Field label="Seu nome" group>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Mãe", "Pai", "Avó", "Avô", "Babá"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => app.setPrefs({ who: w, whoAsked: true })}
                className={`chip ${prefs.who === w ? "chip-on" : ""}`}
              >
                {w}
              </button>
            ))}
          </div>
          <input
            className="field"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            onBlur={() => app.setPrefs({ who: who.trim(), whoAsked: true })}
            placeholder="Ou escreva o nome"
            aria-label="Seu nome"
          />
        </Field>
      </section>

      <section className="glass p-5 space-y-4">
        <h2 className="font-semibold text-lg">Avisos</h2>
        <Field label="Avisar se passar de … horas sem mamar" group>
          <Chips<number>
            value={settings.alertFeedHours}
            onChange={(v) => patch({ alertFeedHours: v })}
            options={[
              { value: 0, label: "Desligado" },
              { value: 2, label: "2h" },
              { value: 3, label: "3h" },
              { value: 4, label: "4h" },
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
        <Toggle
          on={prefs.notify}
          onChange={askNotify}
          label="Notificações do navegador"
          hint="Funcionam com o app aberto ou em segundo plano. Para avisos com o app fechado seria preciso um serviço extra."
        />
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
