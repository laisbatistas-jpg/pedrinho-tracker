"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "./db";
import type { BabyEvent, DiaperKind, Side, Timer } from "./types";
import { alertFor, listAppointments, stageFor } from "./agenda";
import { wakeWindowMinutes } from "./reference";
import {
  DAY,
  WEEKDAY_LETTER,
  ageInMonths,
  formatClock,
  formatDate,
  formatDur,
  genId,
  isFeed,
  startOfDay,
} from "./utils";

/** Mostra o aviso pelo service worker (funciona melhor no iPhone/Android) e, se não der, pelo navegador. */
async function showNotice(title: string, body: string, tag: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, tag, icon: "/icon-192.png", badge: "/icon-192.png" });
      return;
    }
  } catch {
    /* tenta o jeito simples */
  }
  try {
    new Notification(title, { body, tag });
  } catch {
    /* alguns aparelhos não permitem */
  }
}

export type Alert = {
  id: string; // identifica o tipo
  episode: string; // identifica esta ocorrência (para avisar só uma vez)
  tone: "info" | "warn";
  title: string;
  text: string;
};

export type NapPrediction =
  | { state: "sleeping" }
  | { state: "ok"; at: number; windowMin: number; basedOn: "idade" | "hoje"; overdue: boolean };

const eventEnd = (e: BabyEvent) => e.endTimestamp ?? e.timestamp + (e.duration ?? 0) * 1000;

export function useApp() {
  const db = useDb();
  const { events, settings, health, visits, vaccines, timer, upsert, remove, prefs } = db;
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const nowTs = now || 0;

  /* ================= ações ================= */

  const setTimer = useCallback(
    (active: Timer["active"]) => upsert<Timer>("timer", "main", { active }),
    [upsert]
  );

  const startFeed = useCallback(
    (side: Side) => setTimer({ type: "amamentacao", side, start: Date.now() }),
    [setTimer]
  );

  const switchSide = useCallback(() => {
    if (timer?.type !== "amamentacao") return;
    setTimer({ ...timer, side: timer.side === "esquerdo" ? "direito" : "esquerdo" });
  }, [timer, setTimer]);

  const stopFeed = useCallback(() => {
    if (timer?.type !== "amamentacao") return;
    const end = Date.now();
    const e: BabyEvent = {
      id: genId(),
      type: "amamentacao",
      side: timer.side,
      duration: Math.floor((end - timer.start) / 1000),
      timestamp: timer.start,
      endTimestamp: end,
    };
    upsert("event", e.id, e);
    setTimer(null);
  }, [timer, upsert, setTimer]);

  const startSleep = useCallback(() => setTimer({ type: "sono", start: Date.now() }), [setTimer]);

  const stopSleep = useCallback(() => {
    if (timer?.type !== "sono") return;
    const end = Date.now();
    const e: BabyEvent = {
      id: genId(),
      type: "sono",
      duration: Math.floor((end - timer.start) / 1000),
      timestamp: timer.start,
      endTimestamp: end,
    };
    upsert("event", e.id, e);
    setTimer(null);
  }, [timer, upsert, setTimer]);

  const cancelTimer = useCallback(() => setTimer(null), [setTimer]);

  const addDiaper = useCallback(
    (kind: DiaperKind) => {
      const e: BabyEvent = { id: genId(), type: "fralda", diaper: kind, timestamp: Date.now() };
      upsert("event", e.id, e);
    },
    [upsert]
  );

  const addBottle = useCallback(
    (ml: number, milk: "materno" | "formula" = "materno") => {
      const e: BabyEvent = { id: genId(), type: "mamadeira", ml, milk, timestamp: Date.now() };
      upsert("event", e.id, e);
    },
    [upsert]
  );

  const saveEvent = useCallback((e: BabyEvent) => upsert("event", e.id, e), [upsert]);
  const deleteEvent = useCallback((id: string) => remove("event", id), [remove]);

  /* ================= dados derivados ================= */

  const derived = useMemo(() => {
    const today0 = startOfDay(nowTs || Date.now());
    const todayEvents = events.filter((e) => e.timestamp >= today0 && e.timestamp < today0 + DAY);
    const feedsToday = todayEvents.filter(isFeed);
    const breastToday = todayEvents.filter((e) => e.type === "amamentacao");
    const bottlesToday = todayEvents.filter((e) => e.type === "mamadeira");
    const bottleMlToday = bottlesToday.reduce((a, e) => a + (e.ml || 0), 0);
    const sleepToday = todayEvents.filter((e) => e.type === "sono");
    const diapersToday = todayEvents.filter((e) => e.type === "fralda");

    const lastFeed = events.find(isFeed);
    const lastBreast = events.find((e) => e.type === "amamentacao");
    const suggestedSide: Side | undefined = lastBreast?.side
      ? lastBreast.side === "esquerdo"
        ? "direito"
        : "esquerdo"
      : undefined;

    const totalSleepSec = sleepToday.reduce((a, e) => a + (e.duration || 0), 0);
    const longestSleepSec = sleepToday.reduce((a, e) => Math.max(a, e.duration || 0), 0);

    // intervalo médio entre mamadas (últimas 8 nas últimas 36h)
    const recentFeeds = events.filter((e) => isFeed(e) && e.timestamp > (nowTs || Date.now()) - 36 * 3600000).slice(0, 8);
    const gaps: number[] = [];
    for (let i = 0; i < recentFeeds.length - 1; i++) {
      const g = (recentFeeds[i].timestamp - recentFeeds[i + 1].timestamp) / 60000;
      if (g > 15 && g <= 360) gaps.push(g);
    }
    const avgFeedInterval = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 120;

    // intervalo combinado (Configurações) tem prioridade sobre a média observada
    const feedIntervalConfigured = settings.alertFeedHours > 0;
    const feedIntervalMin = feedIntervalConfigured ? Math.round(settings.alertFeedHours * 60) : avgFeedInterval;
    const nextFeedAt = lastFeed ? lastFeed.timestamp + feedIntervalMin * 60000 : null;
    const nextFeedMin =
      nextFeedAt && nowTs ? Math.max(0, Math.ceil((nextFeedAt - nowTs) / 60000)) : null;

    // previsão da próxima soneca
    let nap: NapPrediction | null = null;
    if (timer?.type === "sono") {
      nap = { state: "sleeping" };
    } else {
      const sleeps = events.filter((e) => e.type === "sono").sort((a, b) => a.timestamp - b.timestamp);
      const last = sleeps[sleeps.length - 1];
      if (last && nowTs) {
        const ageM = ageInMonths(settings.birthDate, nowTs);
        const base = wakeWindowMinutes(ageM);
        const todaySleeps = sleeps.filter((e) => e.timestamp >= today0);
        const wakeGaps: number[] = [];
        for (let i = 0; i < todaySleeps.length - 1; i++) {
          const g = (todaySleeps[i + 1].timestamp - eventEnd(todaySleeps[i])) / 60000;
          if (g > 20 && g < 480) wakeGaps.push(g);
        }
        let windowMin = base;
        let basedOn: "idade" | "hoje" = "idade";
        if (wakeGaps.length >= 1) {
          const avg = wakeGaps.reduce((a, b) => a + b, 0) / wakeGaps.length;
          windowMin = Math.round(Math.min(base * 1.3, Math.max(base * 0.7, (base + avg) / 2)));
          basedOn = "hoje";
        }
        const at = eventEnd(last) + windowMin * 60000;
        nap = { state: "ok", at, windowMin, basedOn, overdue: at < nowTs };
      }
    }

    // últimos 7 dias
    const week = nowTs
      ? Array.from({ length: 7 }, (_, k) => {
          const start = today0 - (6 - k) * DAY;
          const end = start + DAY;
          const day = events.filter((e) => e.timestamp >= start && e.timestamp < end);
          return {
            start,
            letter: WEEKDAY_LETTER[new Date(start).getDay()],
            feeds: day.filter(isFeed).length,
            bottleMl: day.filter((e) => e.type === "mamadeira").reduce((a, e) => a + (e.ml || 0), 0),
            sleep: day.filter((e) => e.type === "sono").reduce((a, e) => a + (e.duration || 0), 0),
            diapers: day.filter((e) => e.type === "fralda").length,
          };
        })
      : [];

    return {
      todayEvents,
      feedsToday,
      breastToday,
      bottlesToday,
      bottleMlToday,
      sleepToday,
      diapersToday,
      lastFeed,
      lastBreast,
      suggestedSide,
      totalSleepSec,
      longestSleepSec,
      avgFeedInterval,
      feedIntervalMin,
      feedIntervalConfigured,
      nextFeedAt,
      nextFeedMin,
      nap,
      week,
    };
  }, [events, timer, settings.birthDate, settings.alertFeedHours, nowTs]);

  const elapsed = timer && nowTs ? Math.max(0, Math.floor((nowTs - timer.start) / 1000)) : 0;

  /* ================= avisos ================= */

  const alerts = useMemo<Alert[]>(() => {
    if (!nowTs) return [];
    const list: Alert[] = [];

    const { lastFeed, feedIntervalMin } = derived;
    if (settings.alertFeedHours > 0 && !timer && lastFeed) {
      const dueAt = lastFeed.timestamp + feedIntervalMin * 60000;
      const lead = Math.max(0, settings.alertFeedLeadMin || 0) * 60000;
      const every = formatDur(feedIntervalMin * 60);
      if (nowTs >= dueAt) {
        list.push({
          id: "feed",
          episode: `${lastFeed.id}:due`,
          tone: "warn",
          title: "Hora da mamada!",
          text: `Faz ${formatDur(Math.floor((nowTs - lastFeed.timestamp) / 1000))} desde a última (intervalo de ${every}).`,
        });
      } else if (lead > 0 && nowTs >= dueAt - lead) {
        list.push({
          id: "feed",
          episode: `${lastFeed.id}:soon`,
          tone: "info",
          title: `Mamada em ${Math.max(1, Math.ceil((dueAt - nowTs) / 60000))} min`,
          text: `Prevista para ${formatClock(dueAt)} (intervalo de ${every}).`,
        });
      }
    }

    if (settings.alertSleepHours > 0 && timer?.type === "sono" && elapsed > settings.alertSleepHours * 3600) {
      list.push({
        id: "sleep",
        episode: String(timer.start),
        tone: "info",
        title: "Soneca longa",
        text: `Dormindo há ${formatDur(elapsed)}.`,
      });
    }

    // remédios com repetição
    const lastByName = new Map<string, (typeof health)[number]>();
    for (const h of health) {
      if (h.kind === "remedio" && h.everyHours && h.name) {
        const k = h.name.toLowerCase();
        if (!lastByName.has(k)) lastByName.set(k, h); // health vem do mais novo p/ mais antigo
      }
    }
    lastByName.forEach((h) => {
      const due = h.timestamp + (h.everyHours ?? 0) * 3600000;
      if (nowTs >= due && nowTs - due < 3 * 3600000) {
        list.push({
          id: `med-${h.id}`,
          episode: h.id,
          tone: "warn",
          title: `Remédio: ${h.name}`,
          text: `Próxima dose estava prevista para ${formatClock(due)}.`,
        });
      }
    });

    // consultas e vacinas agendadas: 7, 3 e 1 dia antes, e às 6h do próprio dia
    for (const ap of listAppointments(visits, vaccines)) {
      const stage = stageFor(ap.timestamp, nowTs);
      if (stage) {
        const t = alertFor(ap, stage, nowTs);
        list.push({
          id: ap.key,
          episode: stage,
          tone: stage === "today" ? "warn" : "info",
          title: t.title,
          text: t.text,
        });
      } else if (ap.timestamp < nowTs - 2 * 3600000 && ap.timestamp > nowTs - 14 * DAY) {
        list.push({
          id: ap.key,
          episode: "done",
          tone: "info",
          title: ap.source === "vaccine" ? "A vacina foi aplicada?" : "Como foi a consulta?",
          text: `${ap.title} de ${formatDate(ap.timestamp).slice(0, 5)}: registre como foi em Mais → ${ap.source === "vaccine" ? "Vacinas" : "Consultas"}.`,
        });
      }
    }

    // febre recente
    const temp = health.find((h) => h.kind === "temperatura" && nowTs - h.timestamp < 6 * 3600000);
    if (temp && (temp.tempC ?? 0) >= 37.8) {
      list.push({
        id: "fever",
        episode: temp.id,
        tone: "warn",
        title: "Temperatura alta",
        text: `${(temp.tempC ?? 0).toFixed(1).replace(".", ",")} °C às ${formatClock(temp.timestamp)}. Em caso de dúvida, fale com o pediatra.`,
      });
    }
    return list;
  }, [derived, settings.alertFeedHours, settings.alertFeedLeadMin, settings.alertSleepHours, timer, elapsed, health, visits, vaccines, nowTs]);

  /* ================= notificações do navegador ================= */

  // lembra o que já foi avisado (mesmo fechando o app), para não repetir o mesmo aviso
  const notified = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!prefs.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!notified.current) {
      try {
        notified.current = new Set<string>(JSON.parse(localStorage.getItem("pedrinho-notified-v1") || "[]"));
      } catch {
        notified.current = new Set<string>();
      }
    }
    const seen = notified.current;
    let changed = false;
    for (const a of alerts) {
      const key = `${a.id}:${a.episode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      changed = true;
      void showNotice(a.title, a.text, key);
    }
    if (changed) {
      try {
        localStorage.setItem("pedrinho-notified-v1", JSON.stringify(Array.from(seen).slice(-300)));
      } catch {
        /* sem armazenamento */
      }
    }
  }, [alerts, prefs.notify]);

  return {
    ...db,
    now: nowTs,
    elapsed,
    ...derived,
    alerts,
    startFeed,
    switchSide,
    stopFeed,
    startSleep,
    stopSleep,
    cancelTimer,
    addDiaper,
    addBottle,
    saveEvent,
    deleteEvent,
  };
}

export type App = ReturnType<typeof useApp>;
