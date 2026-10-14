"use client";

import { useState, useEffect } from "react";

type EventType = "amamentacao" | "sono" | "fralda";

type Event = {
  id: string;
  type: EventType;
  side?: "esquerdo" | "direito";
  duration?: number;
  diaper?: "molhada" | "suja" | "mista";
  timestamp: number;
  endTimestamp?: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"inicio" | "amamentacao" | "sono" | "fraldas" | "stats">("inicio");
  const [timer, setTimer] = useState<{ type: "amamentacao" | "sono"; side?: "esquerdo" | "direito"; start: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem("pedrinho-events-v2");
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("pedrinho-events-v2", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startFeed = (side: "esquerdo" | "direito") => {
    setTimer({ type: "amamentacao", side, start: Date.now() });
    setActiveTab("amamentacao");
  };

  const stopFeed = () => {
    if (!timer || timer.type !== "amamentacao") return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "amamentacao",
      side: timer.side,
      duration,
      timestamp: timer.start,
      endTimestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
    setActiveTab("inicio");
  };

  const switchSide = () => {
    if (!timer || timer.type !== "amamentacao") return;
    setTimer({ ...timer, side: timer.side === "esquerdo" ? "direito" : "esquerdo" });
  };

  const startSleep = () => {
    setTimer({ type: "sono", start: Date.now() });
    setActiveTab("sono");
  };

  const stopSleep = () => {
    if (!timer || timer.type !== "sono") return;
    const duration = Math.floor((Date.now() - timer.start) / 1000);
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "sono",
      duration,
      timestamp: timer.start,
      endTimestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setTimer(null);
    setActiveTab("inicio");
  };

  const addDiaper = (kind: "molhada" | "suja" | "mista") => {
    const newEvent: Event = {
      id: Date.now().toString(),
      type: "fralda",
      diaper: kind,
      timestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const todayEvents = events.filter(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
  );
