/** Perfis da família. O nome aparece em "por Laís" nos registros. */
export const PROFILES: { name: string; role: string }[] = [
  { name: "Laís", role: "Mãe" },
  { name: "Samuel", role: "Pai" },
];

/** Outros cuidadores (o nome salvo é o próprio papel). */
export const OTHER_ROLES = ["Avó", "Avô", "Babá"];

export const roleOf = (who: string) => PROFILES.find((p) => p.name === who)?.role;
