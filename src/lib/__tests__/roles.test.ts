import { describe, it, expect } from "vitest";
import {
  canEditSegments,
  canCreateSuggestions,
  canCreatePostIts,
  canEditGlossary,
  canEditTM,
  canViewDashboard,
  canAssignTasks,
  canConfirmSegments,
  canRejectSegments,
  normalizeProjectRole,
  VALID_PROJECT_ROLES,
  VALID_CLASSROOM_ROLES,
  PROJECT_ROLES,
  CLASSROOM_ROLES,
} from "../roles";

describe("roles.ts — permission matrix", () => {
  it("translator can edit segments", () => {
    expect(canEditSegments("translator")).toBe(true);
  });

  it("pm cannot edit segments", () => {
    expect(canEditSegments("pm")).toBe(false);
  });

  it("reviewer can create suggestions and post-its", () => {
    expect(canCreateSuggestions("reviewer")).toBe(true);
    expect(canCreatePostIts("reviewer")).toBe(true);
  });

  it("translator cannot create suggestions", () => {
    expect(canCreateSuggestions("translator")).toBe(false);
  });

  it("terminologist can edit glossary and TM", () => {
    expect(canEditGlossary("terminologist")).toBe(true);
    expect(canEditTM("terminologist")).toBe(true);
  });

  it("pm can view dashboard and assign tasks", () => {
    expect(canViewDashboard("pm")).toBe(true);
    expect(canAssignTasks("pm")).toBe(true);
  });

  it("dtp cannot edit segments", () => {
    expect(canEditSegments("dtp")).toBe(false);
  });

  it("unknown role returns false for everything", () => {
    expect(canEditSegments("fake_role")).toBe(false);
    expect(canCreateSuggestions("fake_role")).toBe(false);
    expect(canViewDashboard("fake_role")).toBe(false);
  });
});

describe("roles.ts — Teams Mode permissions (confirm/reject)", () => {
  it("translator can confirm segments", () => {
    expect(canConfirmSegments("translator")).toBe(true);
  });

  it("translator cannot reject segments", () => {
    expect(canRejectSegments("translator")).toBe(false);
  });

  it("reviewer can reject segments", () => {
    expect(canRejectSegments("reviewer")).toBe(true);
  });

  it("reviewer cannot confirm segments", () => {
    expect(canConfirmSegments("reviewer")).toBe(false);
  });

  it("proofreader can reject segments", () => {
    expect(canRejectSegments("proofreader")).toBe(true);
  });

  it("pm cannot confirm or reject", () => {
    expect(canConfirmSegments("pm")).toBe(false);
    expect(canRejectSegments("pm")).toBe(false);
  });

  it("dtp can confirm segments", () => {
    expect(canConfirmSegments("dtp")).toBe(true);
  });

  it("terminologist cannot confirm or reject", () => {
    expect(canConfirmSegments("terminologist")).toBe(false);
    expect(canRejectSegments("terminologist")).toBe(false);
  });
});

describe("roles.ts — role normalization", () => {
  it("normalizes student to translator in project context", () => {
    expect(normalizeProjectRole("student")).toBe("translator");
  });

  it("keeps other roles unchanged", () => {
    expect(normalizeProjectRole("reviewer")).toBe("reviewer");
    expect(normalizeProjectRole("pm")).toBe("pm");
  });
});

describe("roles.ts — role constants", () => {
  it("has 6 project roles", () => {
    expect(PROJECT_ROLES).toHaveLength(6);
  });

  it("has 2 classroom roles", () => {
    expect(CLASSROOM_ROLES).toHaveLength(2);
  });

  it("valid project roles includes owner", () => {
    expect(VALID_PROJECT_ROLES).toContain("owner");
  });

  it("valid classroom roles are professor and student", () => {
    expect(VALID_CLASSROOM_ROLES).toContain("professor");
    expect(VALID_CLASSROOM_ROLES).toContain("student");
  });
});
