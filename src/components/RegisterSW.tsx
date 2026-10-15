"use client";

import { useEffect } from "react";

/** Liga o modo offline (só na versão publicada, para não atrapalhar o desenvolvimento). */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sem suporte ou bloqueado: o app funciona normalmente, só não abre offline */
    });
  }, []);
  return null;
}
