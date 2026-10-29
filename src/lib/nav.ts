import type { App } from "./app";

export type Screen =
  | "inicio"
  | "amamentacao"
  | "sono"
  | "fraldas"
  | "mais"
  | "stats"
  | "historico"
  | "crescimento"
  | "saude"
  | "vacinas"
  | "consultas"
  | "emergencia"
  | "marcos"
  | "desenvolvimento"
  | "sons"
  | "relatorio"
  | "config";

export type ScreenProps = { app: App; go: (s: Screen) => void };
