import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/stripe";

/**
 * Check if user can create a new project (active project limit).
 */
export async function canCreateProject(
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan);
  if (limits.projects === Infinity) return { allowed: true };

  const activeCount = await prisma.project.count({
    where: { userId, status: "active" },
  });

  if (activeCount >= limits.projects) {
    return {
      allowed: false,
      message: `Free plan allows ${limits.projects} active projects. Upgrade to Pro for unlimited.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a project can have more segments.
 */
export async function canAddSegments(
  projectId: string,
  plan: string,
  newSegmentCount: number,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan);
  if (limits.segmentsPerProject === Infinity) return { allowed: true };

  const currentCount = await prisma.segment.count({ where: { projectId } });

  if (currentCount + newSegmentCount > limits.segmentsPerProject) {
    return {
      allowed: false,
      message: `Free plan allows ${limits.segmentsPerProject} segments per project. This file has ${newSegmentCount} segments. Upgrade to Pro for unlimited.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add more TM entries.
 */
export async function canAddTMEntry(
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan);
  if (limits.tmEntries === Infinity) return { allowed: true };

  const count = await prisma.translationMemory.count({ where: { userId } });

  if (count >= limits.tmEntries) {
    return {
      allowed: false,
      message: `Free plan allows ${limits.tmEntries} TM entries. Upgrade to Pro for unlimited.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add more glossary terms.
 */
export async function canAddGlossaryTerm(
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan);
  if (limits.glossaryTerms === Infinity) return { allowed: true };

  const count = await prisma.glossaryTerm.count({ where: { userId } });

  if (count >= limits.glossaryTerms) {
    return {
      allowed: false,
      message: `Free plan allows ${limits.glossaryTerms} glossary terms. Upgrade to Pro for unlimited.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if file format is allowed for the user's plan.
 */
export function canImportFormat(
  _plan: string,
  _extension: string,
): { allowed: boolean; message?: string } {
  // All formats available on all plans — upsell is by volume and pro features, not formats
  return { allowed: true };
}

/**
 * Check if export format is allowed for the user's plan.
 */
export function canExportFormat(
  _plan: string,
  _format: string,
): { allowed: boolean; message?: string } {
  // All formats available on all plans — upsell is by volume and pro features, not formats
  return { allowed: true };
}
