"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CARD,
  DEFAULT_PREFS,
  DEFAULT_SETTINGS,
  type BabyEvent,
  type EmergencyCard,
  type Growth,
  type HealthEntry,
  type Kind,
  type Milestone,
  type Prefs,
  type Rec,
  type Settings,
  type SyncStatus,
  type Timer,
  type VaccineRecord,
  type Visit,
} from "./types";
import { pullRows, pushRows, type SyncConfig } from "./sync";

const DB_KEY = "pedrinho-db-v3";
const DIRTY_KEY = "pedrinho-dirty-v3";
const PREFS_KEY = "pedrinho-prefs-v3";
const OLD_EVENTS_KEY = "pedrinho-events-v2";
const OLD_TIMER_KEY = "pedrinho-timer-v1";

const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const STAMPED: Kind[] = ["event", "growth", "health", "visit", "vaccine", "milestone"];

const keyOf = (kind: Kind, id: string) => `${kind}:${id}`;

/** Ordena por data; se empatar (mesmo minuto), usa o id, que cresce com a ordem de criação. */
const newestFirst = (a: { timestamp: number; id: string }, b: { timestamp: number; id: string }) =>
  b.timestamp - a.timestamp || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
const oldestFirst = (a: { timestamp: number; id: string }, b: { timestamp: number; id: string }) =>
  -newestFirst(a, b);

type RecMap = Record<string, Rec>;

export function useDb() {
  const [ready, setReady] = useState(false);
  const [recs, setRecs] = useState<RecMap>({});
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [status, setStatus] = useState<SyncStatus>("off");
  const [lastSync, setLastSync] = useState(0);
  const [syncError, setSyncError] = useState("");
  const [storageError, setStorageError] = useState(false);

  const recsRef = useRef<RecMap>({});
  const dirtyRef = useRef<Set<string>>(new Set());
  const prefsRef = useRef<Prefs>(DEFAULT_PREFS);
  const cfgRef = useRef<SyncConfig | null>(null);
  const syncingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: RecMap) => {
    recsRef.current = next;
    setRecs(next);
  }, []);

  /* ---------- carregar ---------- */
  useEffect(() => {
    let loaded: RecMap = {};
    const dirty = new Set<string>();
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        loaded = JSON.parse(raw) as RecMap;
        const d = localStorage.getItem(DIRTY_KEY);
        if (d) (JSON.parse(d) as string[]).forEach((k) => dirty.add(k));
      } else {
        // migração dos dados da versão anterior do app
        const oldEvents = localStorage.getItem(OLD_EVENTS_KEY);
        if (oldEvents) {
          const list = JSON.parse(oldEvents) as BabyEvent[];
          const base = Date.now();
          list.forEach((e, i) => {
            const k = keyOf("event", e.id);
            loaded[k] = { id: e.id, kind: "event", data: e, updatedAt: base + i, deleted: false };
            dirty.add(k);
          });
        }
        const oldTimer = localStorage.getItem(OLD_TIMER_KEY);
        if (oldTimer) {
          const t = JSON.parse(oldTimer) as NonNullable<Timer["active"]>;
          const k = keyOf("timer", "main");
          loaded[k] = { id: "main", kind: "timer", data: { active: t } satisfies Timer, updatedAt: Date.now(), deleted: false };
          dirty.add(k);
          localStorage.removeItem(OLD_TIMER_KEY);
        }
      }
    } catch {
      /* dados ilegíveis: começa vazio */
    }
    let p = DEFAULT_PREFS;
    try {
      const rawPrefs = localStorage.getItem(PREFS_KEY);
      if (rawPrefs) p = { ...DEFAULT_PREFS, ...(JSON.parse(rawPrefs) as Partial<Prefs>) };
    } catch {
      /* usa padrão */
    }
    recsRef.current = loaded;
    dirtyRef.current = dirty;
    prefsRef.current = p;
    setRecs(loaded);
    setPrefsState(p);
    setReady(true);
  }, []);

  /* ---------- salvar no aparelho ---------- */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(recs));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [recs, ready]);

  const persistDirty = () => {
    try {
      localStorage.setItem(DIRTY_KEY, JSON.stringify(Array.from(dirtyRef.current)));
    } catch {
      /* ignora */
    }
  };

  /* ---------- preferências do aparelho ---------- */
  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefsState(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  }, []);

  const cfg = useMemo<SyncConfig | null>(() => {
    const url = (prefs.syncUrl || ENV_URL).trim();
    const key = (prefs.syncKey || ENV_KEY).trim();
    const family = prefs.familyCode.trim();
    return url && key && family.length >= 8 ? { url, key, family } : null;
  }, [prefs.syncUrl, prefs.syncKey, prefs.familyCode]);

  useEffect(() => {
    cfgRef.current = cfg;
    if (!cfg) setStatus("off");
    else setStatus((s) => (s === "off" ? "idle" : s));
  }, [cfg]);

  /* ---------- sincronização ---------- */
  const doSync = useCallback(async () => {
    const c = cfgRef.current;
    if (!c || syncingRef.current) return;
    syncingRef.current = true;
    setStatus("syncing");
    try {
      // 1) enviar o que mudou aqui
      const pushed = new Map<string, number>();
      const rows = Array.from(dirtyRef.current)
        .map((k) => recsRef.current[k])
        .filter((r): r is Rec => Boolean(r))
        .map((r) => {
          pushed.set(keyOf(r.kind, r.id), r.updatedAt);
          return { family: c.family, id: r.id, kind: r.kind, data: r.data, updated_at: r.updatedAt, deleted: r.deleted };
        });
      for (let i = 0; i < rows.length; i += 20) await pushRows(c, rows.slice(i, i + 20));
      pushed.forEach((at, k) => {
        if (recsRef.current[k]?.updatedAt === at) dirtyRef.current.delete(k);
      });
      persistDirty();

      // 2) buscar o que mudou nos outros aparelhos
      const since = Math.max(0, prefsRef.current.lastPull - 120000);
      const remote = await pullRows(c, since);
      let maxSeen = prefsRef.current.lastPull;
      let changed = false;
      const next: RecMap = { ...recsRef.current };
      for (const r of remote) {
        const k = keyOf(r.kind as Kind, r.id);
        const local = next[k];
        if (!local || r.updated_at > local.updatedAt) {
          next[k] = { id: r.id, kind: r.kind as Kind, data: r.data, updatedAt: r.updated_at, deleted: r.deleted };
          dirtyRef.current.delete(k);
          changed = true;
        }
        if (r.updated_at > maxSeen) maxSeen = r.updated_at;
      }
      if (changed) {
        commit(next);
        persistDirty();
      }
      if (maxSeen !== prefsRef.current.lastPull) setPrefs({ lastPull: maxSeen });
      setStatus("ok");
      setSyncError("");
      setLastSync(Date.now());
    } catch (e) {
      setStatus("error");
      setSyncError(e instanceof Error ? e.message : "Falha ao sincronizar");
    } finally {
      syncingRef.current = false;
    }
  }, [commit, setPrefs]);

  const scheduleSync = useCallback(() => {
    if (!cfgRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => void doSync(), 700);
  }, [doSync]);

  useEffect(() => {
    if (!ready || !cfg) return;
    void doSync();
    const i = setInterval(() => void doSync(), 8000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void doSync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [ready, cfg, doSync]);

  /** Liga a sincronização (ou troca o código da família) e reenvia tudo. */
  const applySync = useCallback(
    (url: string, key: string, family: string) => {
      setPrefs({ syncUrl: url.trim(), syncKey: key.trim(), familyCode: family.trim(), lastPull: 0 });
      Object.keys(recsRef.current).forEach((k) => dirtyRef.current.add(k));
      persistDirty();
      setTimeout(() => void doSync(), 200);
    },
    [setPrefs, doSync]
  );

  const disableSync = useCallback(() => {
    setPrefs({ syncUrl: "", syncKey: "", familyCode: "", lastPull: 0 });
  }, [setPrefs]);

  /* ---------- gravar / apagar ---------- */
  const upsert = useCallback(
    <T,>(kind: Kind, id: string, data: T) => {
      const k = keyOf(kind, id);
      const prev = recsRef.current[k];
      // carimba quem registrou (mantém o autor original ao editar)
      let out: unknown = data;
      if (STAMPED.includes(kind) && data && typeof data === "object") {
        const prevBy = prev && !prev.deleted ? (prev.data as { by?: string } | null)?.by : undefined;
        const by = (data as { by?: string }).by ?? prevBy ?? (prefsRef.current.who || undefined);
        if (by) out = { ...(data as object), by };
      }
      const rec: Rec = {
        id,
        kind,
        data: out,
        updatedAt: Math.max(Date.now(), (prev?.updatedAt ?? 0) + 1),
        deleted: false,
      };
      commit({ ...recsRef.current, [k]: rec });
      dirtyRef.current.add(k);
      persistDirty();
      scheduleSync();
    },
    [commit, scheduleSync]
  );

  const remove = useCallback(
    (kind: Kind, id: string) => {
      const k = keyOf(kind, id);
      const prev = recsRef.current[k];
      const rec: Rec = {
        id,
        kind,
        data: null,
        updatedAt: Math.max(Date.now(), (prev?.updatedAt ?? 0) + 1),
        deleted: true,
      };
      commit({ ...recsRef.current, [k]: rec });
      dirtyRef.current.add(k);
      persistDirty();
      scheduleSync();
    },
    [commit, scheduleSync]
  );

  /* ---------- backup ---------- */
  const exportAll = useCallback(() => {
    const live = Object.values(recsRef.current).filter((r) => !r.deleted);
    return JSON.stringify({ app: "pedrinho-tracker", version: 3, exportedAt: Date.now(), records: live }, null, 2);
  }, []);

  const importAll = useCallback(
    (text: string): number => {
      const parsed = JSON.parse(text) as { records?: Rec[] };
      const list = parsed.records ?? [];
      let n = 0;
      for (const r of list) {
        if (r && r.kind && r.id && !r.deleted) {
          upsert(r.kind, r.id, r.data);
          n++;
        }
      }
      return n;
    },
    [upsert]
  );

  /* ---------- dados organizados ---------- */
  const data = useMemo(() => {
    const live = (kind: Kind) => Object.values(recs).filter((r) => r.kind === kind && !r.deleted);

    const events = live("event")
      .map((r) => r.data as BabyEvent)
      .sort(newestFirst);
    const growth = live("growth")
      .map((r) => r.data as Growth)
      .sort(oldestFirst);
    const health = live("health")
      .map((r) => r.data as HealthEntry)
      .sort(newestFirst);
    const milestones = live("milestone")
      .map((r) => r.data as Milestone)
      .sort(newestFirst);
    const visits = live("visit")
      .map((r) => r.data as Visit)
      .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
    const vaccines: Record<string, VaccineRecord> = {};
    live("vaccine").forEach((r) => {
      vaccines[r.id] = r.data as VaccineRecord;
    });
    const cardRec = recs[keyOf("card", "main")];
    const card: EmergencyCard = {
      ...DEFAULT_CARD,
      ...(cardRec && !cardRec.deleted ? (cardRec.data as Partial<EmergencyCard>) : {}),
    };
    const settingsRec = recs[keyOf("settings", "main")];
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...(settingsRec && !settingsRec.deleted ? (settingsRec.data as Partial<Settings>) : {}),
    };
    const timerRec = recs[keyOf("timer", "main")];
    const timer: Timer["active"] = timerRec && !timerRec.deleted ? (timerRec.data as Timer).active : null;

    return { events, growth, health, milestones, vaccines, visits, card, settings, timer };
  }, [recs]);

  return {
    ready,
    ...data,
    prefs,
    setPrefs,
    upsert,
    remove,
    exportAll,
    importAll,
    syncConfigured: cfg !== null,
    syncCfg: cfg,
    envConfigured: Boolean(ENV_URL && ENV_KEY),
    syncStatus: status,
    syncError,
    lastSync,
    syncNow: doSync,
    applySync,
    disableSync,
    storageError,
  };
}

export type Db = ReturnType<typeof useDb>;
