/**
 * CATforCAT — Role definitions and permission matrix
 *
 * Project roles: pm, translator, reviewer, proofreader, terminologist, dtp
 * Classroom roles: professor, student
 * Legacy: "student" in project context maps to "translator"
 */

export const PROJECT_ROLES = [
  { value: "pm", label: "PM" },
  { value: "translator", label: "Translator" },
  { value: "reviewer", label: "Reviewer" },
  { value: "proofreader", label: "Proofreader" },
  { value: "terminologist", label: "Terminologist" },
  { value: "dtp", label: "DTP" },
] as const;

export const CLASSROOM_ROLES = [
  { value: "professor", label: "Professor" },
  { value: "student", label: "Student" },
] as const;

export const VALID_PROJECT_ROLES = [
  "owner",
  "pm",
  "translator",
  "reviewer",
  "proofreader",
  "terminologist",
  "dtp",
  // Legacy — kept for backward compat
  "professor",
  "student",
] as const;

export const VALID_CLASSROOM_ROLES = ["professor", "student"] as const;

/** Normalize legacy roles: "student" in project context → "translator" */
export function normalizeProjectRole(role: string): string {
  if (role === "student") return "translator";
  return role;
}

/** Permission checks by role */
export const ROLE_PERMISSIONS = {
  pm:            { editSegments: false, createSuggestions: false, createPostIts: true,  editGlossary: false, editTM: false, viewDashboard: true,  assignTasks: true,  confirmSegments: false, rejectSegments: false },
  translator:    { editSegments: true,  createSuggestions: false, createPostIts: false, editGlossary: false, editTM: false, viewDashboard: false, assignTasks: false, confirmSegments: true,  rejectSegments: false },
  reviewer:      { editSegments: true,  createSuggestions: true,  createPostIts: true,  editGlossary: false, editTM: false, viewDashboard: false, assignTasks: false, confirmSegments: false, rejectSegments: true  },
  proofreader:   { editSegments: true,  createSuggestions: true,  createPostIts: true,  editGlossary: false, editTM: false, viewDashboard: false, assignTasks: false, confirmSegments: false, rejectSegments: true  },
  terminologist: { editSegments: false, createSuggestions: false, createPostIts: false, editGlossary: true,  editTM: true,  viewDashboard: false, assignTasks: false, confirmSegments: false, rejectSegments: false },
  dtp:           { editSegments: false, createSuggestions: false, createPostIts: true,  editGlossary: false, editTM: false, viewDashboard: false, assignTasks: false, confirmSegments: true,  rejectSegments: false },
  // Legacy/classroom — professor gets PM-like perms, student gets translator perms
  professor:     { editSegments: false, createSuggestions: true,  createPostIts: true,  editGlossary: false, editTM: false, viewDashboard: true,  assignTasks: true,  confirmSegments: false, rejectSegments: false },
  student:       { editSegments: true,  createSuggestions: false, createPostIts: false, editGlossary: false, editTM: false, viewDashboard: false, assignTasks: false, confirmSegments: true,  rejectSegments: false },
} as const;

type RoleKey = keyof typeof ROLE_PERMISSIONS;

export function canEditSegments(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.editSegments ?? false;
}

export function canCreateSuggestions(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.createSuggestions ?? false;
}

export function canCreatePostIts(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.createPostIts ?? false;
}

export function canEditGlossary(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.editGlossary ?? false;
}

export function canEditTM(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.editTM ?? false;
}

export function canViewDashboard(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.viewDashboard ?? false;
}

export function canAssignTasks(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.assignTasks ?? false;
}

export function canConfirmSegments(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.confirmSegments ?? false;
}

export function canRejectSegments(role: string): boolean {
  return ROLE_PERMISSIONS[role as RoleKey]?.rejectSegments ?? false;
}
