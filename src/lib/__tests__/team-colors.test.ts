/**
 * Team Colors — Unit tests
 * Verifies color definitions, validation, and CSS variable generation.
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import { TEAM_COLORS, VALID_TEAM_COLORS, teamColorVar } from "../team-colors";

describe("team-colors.ts", () => {
  it("has exactly 8 colors", () => {
    expect(TEAM_COLORS).toHaveLength(8);
  });

  it("all colors have value and label", () => {
    for (const color of TEAM_COLORS) {
      expect(color.value).toBeTruthy();
      expect(color.label).toBeTruthy();
    }
  });

  it("VALID_TEAM_COLORS matches TEAM_COLORS values", () => {
    expect(VALID_TEAM_COLORS).toHaveLength(8);
    expect(VALID_TEAM_COLORS).toContain("rojo");
    expect(VALID_TEAM_COLORS).toContain("amarillo");
  });

  it("teamColorVar generates correct CSS variable reference", () => {
    expect(teamColorVar("rojo")).toBe("var(--team-rojo)");
    expect(teamColorVar("azul")).toBe("var(--team-azul)");
    expect(teamColorVar("amarillo")).toBe("var(--team-amarillo)");
  });

  it("no duplicate color values", () => {
    const values = TEAM_COLORS.map((c) => c.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("no duplicate color labels", () => {
    const labels = TEAM_COLORS.map((c) => c.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});
