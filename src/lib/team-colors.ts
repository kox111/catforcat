export const TEAM_COLORS = [
  { value: "rojo", label: "Rojo" },
  { value: "rosa", label: "Rosa" },
  { value: "morado", label: "Morado" },
  { value: "azul", label: "Azul" },
  { value: "celeste", label: "Celeste" },
  { value: "teal", label: "Teal" },
  { value: "verde", label: "Verde" },
  { value: "amarillo", label: "Amarillo" },
] as const;

export type TeamColorName = (typeof TEAM_COLORS)[number]["value"];
export const VALID_TEAM_COLORS = TEAM_COLORS.map((c) => c.value);

/** Get CSS variable reference for a team color */
export function teamColorVar(color: string): string {
  return `var(--team-${color})`;
}
